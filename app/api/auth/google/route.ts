import { eq } from 'drizzle-orm';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { NextRequest } from 'next/server';
import { db, users } from '@/lib/db';
import { logActivity } from '@/lib/server/activity';
import { clientIp, fail, handler, json, readBody } from '@/lib/server/http';
import { loadUser, publicUser, setSessionCookie, type AuthUser } from '@/lib/server/session';
import { invalidateStudentAccess, isStudentAllowed, isStudentGoogleAccount, STUDENT_EMAIL_DOMAIN } from '@/lib/server/student-access';
import { isNonEmptyString } from '@/lib/server/validation';

// Verifies Google ID tokens (caches Google's public keys between calls)
const googleClient = new OAuth2Client();

// Sign-in with a Google ID token (Google Identity Services button)
export const POST = handler(async (req: NextRequest) => {
    const { credential } = await readBody(req);
    const clientId = process.env.GOOGLE_AUTH_CLIENT_ID;

    if (!clientId) return fail(503, 'Connexion Google non configurée');
    if (!isNonEmptyString(credential, 4096)) return fail(400, 'Google credential is required');

    // Checks Google's signature, expiry, issuer, and that the token was issued for our client ID
    let payload: TokenPayload | undefined;
    try {
        payload = (await googleClient.verifyIdToken({ idToken: credential, audience: clientId })).getPayload();
    } catch {
        payload = undefined;
    }
    if (!payload?.email || payload.email_verified !== true) return fail(401, 'Connexion Google invalide');

    const email = payload.email.toLowerCase();
    let [account] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));

    // Students: the first sign-in with a university Google Workspace account creates their account,
    // provided the email is on the student list (or the list is still empty)
    if (!account && isStudentGoogleAccount(email, payload.hd) && (await isStudentAllowed(email))) {
        [account] = await db
            .insert(users)
            .values({
                email,
                role: 'student',
                firstName: payload.given_name?.slice(0, 100) || email.split('@')[0].slice(0, 100),
                lastName: payload.family_name?.slice(0, 100) || '-',
            })
            // Two first sign-ins at once: the other request already created it
            .onConflictDoNothing({ target: users.email })
            .returning({ id: users.id });
        [account] = account ? [account] : await db.select({ id: users.id }).from(users).where(eq(users.email, email));
        invalidateStudentAccess(); // the new account must be in the cached list of active students
    }

    const user: AuthUser | null = account ? await loadUser(account.id) : null;
    if (!user || !user.isActive) {
        return fail(
            403,
            user ? 'Ce compte est désactivé' : `Connexion réservée aux étudiants de l'ENSA Tétouan (adresse @${STUDENT_EMAIL_DOMAIN})`
        );
    }
    // The account was just read from the database (active, still a student): only the student list remains to check
    if (user.role === 'student' && !(await isStudentAllowed(user.email))) {
        return fail(403, "Votre adresse ne figure pas dans la liste des étudiants de l'ENSA Tétouan");
    }

    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    // Staff logins go to the activity log; student logins would drown it out
    if (user.role !== 'student') {
        await logActivity({ userId: user.id, action: 'LOGIN', details: { email: user.email, ip: clientIp(req), method: 'google' } });
    }

    const res = json({ success: true, message: 'Login successful', user: publicUser(user) });
    await setSessionCookie(res, user);
    return res;
}, 'Server error during Google login');
