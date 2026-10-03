import { and, count, eq } from 'drizzle-orm';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { NextRequest } from 'next/server';
import { accessCodes, db, savedParcours, users } from '@/lib/db';
import { findActiveCode, hasActiveCode } from '@/lib/server/access-codes';
import { logActivity } from '@/lib/server/activity';
import { clientIp, fail, handler, json, readBody } from '@/lib/server/http';
import { invalidateSavedParcours, MAX_SAVED_PARCOURS } from '@/lib/server/parcours';
import { getAuthUser, loadUser, publicUser, setSessionCookie, type AuthUser } from '@/lib/server/session';
import { invalidateStudentAccess, isStudentAllowed, isStudentGoogleAccount, STUDENT_EMAIL_DOMAIN } from '@/lib/server/student-access';
import { isNonEmptyString } from '@/lib/server/validation';

// Verifies Google ID tokens (caches Google's public keys between calls)
const googleClient = new OAuth2Client();

// Local automated tests only (npm run test:api): a dev server started with ALLOW_TEST_GOOGLE_TOKENS=1
// accepts the token payload as plain JSON. Never active in production builds.
const acceptsTestTokens = process.env.NODE_ENV !== 'production' && process.env.ALLOW_TEST_GOOGLE_TOKENS === '1';

async function verifyGoogleToken(credential: string, clientId: string): Promise<TokenPayload | undefined> {
    if (acceptsTestTokens && credential.startsWith('{')) return JSON.parse(credential);
    try {
        return (await googleClient.verifyIdToken({ idToken: credential, audience: clientId })).getPayload();
    } catch {
        return undefined;
    }
}

const namesFrom = (payload: TokenPayload, email: string) => ({
    firstName: payload.given_name?.slice(0, 100) || email.split('@')[0].slice(0, 100),
    lastName: payload.family_name?.slice(0, 100) || '-',
});

// A temporary (access code) account signing in again with a real student account in the same
// browser: keep its saved parcours, then delete it
async function upgradeTemporaryAccount(previous: AuthUser | null, user: AuthUser) {
    if (!previous || previous.id === user.id || previous.role !== 'student' || user.role !== 'student') return;
    const [guest] = await db.select({ accessCodeId: users.accessCodeId }).from(users).where(eq(users.id, previous.id));
    if (!guest?.accessCodeId) return;

    const theirs = await db.select().from(savedParcours).where(eq(savedParcours.userId, previous.id));
    const [{ n }] = await db.select({ n: count() }).from(savedParcours).where(eq(savedParcours.userId, user.id));
    const room = Math.max(0, MAX_SAVED_PARCOURS - n);
    if (theirs.length && room) {
        await db
            .insert(savedParcours)
            .values(theirs.slice(0, room).map((p) => ({ userId: user.id, semesterId: p.semesterId })))
            .onConflictDoNothing();
        invalidateSavedParcours(user.id);
    }
    await db.delete(users).where(and(eq(users.id, previous.id), eq(users.role, 'student')));
    invalidateStudentAccess();
}

// Sign-in with a Google ID token (Google Identity Services button), with an optional access code
export const POST = handler(async (req: NextRequest) => {
    const { credential, accessCode } = await readBody(req);
    const clientId = process.env.GOOGLE_AUTH_CLIENT_ID;

    if (!clientId) return fail(503, 'Connexion Google non configurée');
    if (!isNonEmptyString(credential, 4096)) return fail(400, 'Google credential is required');

    // Checks Google's signature, expiry, issuer, and that the token was issued for our client ID
    const payload = await verifyGoogleToken(credential, clientId);
    if (!payload?.email || payload.email_verified !== true) return fail(401, 'Connexion Google invalide');

    const email = payload.email.toLowerCase();
    let [account] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));

    if (!account) {
        let accessCodeId: number | null = null;

        if (isStudentGoogleAccount(email, payload.hd) && (await isStudentAllowed(email))) {
            // Students: the first sign-in with a university Google Workspace account creates their account
        } else if (await hasActiveCode()) {
            // No university address yet: possible only while an access code is active
            if (!isNonEmptyString(accessCode, 50)) {
                return json(
                    {
                        success: false,
                        needsAccessCode: true,
                        message: "Cette adresse n'est pas une adresse universitaire. Si vous avez un code d'accès temporaire, saisissez-le.",
                    },
                    403
                );
            }
            const code = await findActiveCode(accessCode);
            if (!code) {
                return json({ success: false, needsAccessCode: true, message: "Code d'accès invalide ou expiré" }, 403);
            }
            accessCodeId = code.id;
        } else {
            return fail(403, `Connexion réservée aux étudiants de l'ENSA Tétouan (adresse @${STUDENT_EMAIL_DOMAIN})`);
        }

        [account] = await db
            .insert(users)
            .values({ email, role: 'student', ...namesFrom(payload, email), accessCodeId })
            // Two first sign-ins at once: the other request already created it
            .onConflictDoNothing({ target: users.email })
            .returning({ id: users.id });
        [account] = account ? [account] : await db.select({ id: users.id }).from(users).where(eq(users.email, email));
        invalidateStudentAccess(); // the new account must be in the cached list of active students
    }

    const [row] = await db
        .select({ accessCodeId: users.accessCodeId, guestUntil: accessCodes.expiresAt })
        .from(users)
        .leftJoin(accessCodes, eq(accessCodes.id, users.accessCodeId))
        .where(eq(users.id, account.id));
    const user: AuthUser | null = await loadUser(account.id);
    if (!user || !user.isActive) {
        return fail(403, user ? 'Ce compte est désactivé' : `Connexion réservée aux étudiants de l'ENSA Tétouan (adresse @${STUDENT_EMAIL_DOMAIN})`);
    }

    if (row?.accessCodeId) {
        // Temporary account: only while its code exists and hasn't expired (read from the database,
        // not the cache, since the account may have been created by this very request)
        if (!row.guestUntil || row.guestUntil.getTime() <= Date.now()) {
            return fail(403, "Votre accès temporaire a expiré. Connectez-vous avec votre adresse @etu.uae.ac.ma.");
        }
    } else if (user.role === 'student' && !(await isStudentAllowed(user.email))) {
        // The account was just read from the database (active, still a student): only the student list remains to check
        return fail(403, "Votre adresse ne figure pas dans la liste des étudiants de l'ENSA Tétouan");
    }

    await upgradeTemporaryAccount(await getAuthUser(req), user);
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    // Staff logins go to the activity log; student logins would drown it out
    if (user.role !== 'student') {
        await logActivity({ userId: user.id, action: 'LOGIN', details: { email: user.email, ip: clientIp(req), method: 'google' } });
    }

    const res = json({ success: true, message: 'Login successful', user: publicUser(user) });
    await setSessionCookie(res, user);
    return res;
}, 'Server error during Google login');
