import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { db, users } from '@/lib/db';
import { logActivity } from '@/lib/server/activity';
import { clientIp, fail, handler, json, readBody } from '@/lib/server/http';
import { clearLoginFailures, getLoginBlock, recordLoginFailure } from '@/lib/server/rate-limit';
import { loadUser, publicUser, setSessionCookie } from '@/lib/server/session';
import { isNonEmptyString } from '@/lib/server/validation';

// Compared against when the account has no password, so response time doesn't reveal which emails exist
const DUMMY_HASH = '$2a$10$Vkk6tEqIZNBu3gP4.ipIMeEtPSZ3qggqm.IX75GQzKa05t83UIlee';

// Password sign-in, kept as a fallback for staff accounts ("Accès équipe")
export const POST = handler(async (req: NextRequest) => {
    const { email: rawEmail, password, rememberMe } = await readBody(req);

    if (!isNonEmptyString(rawEmail, 254) || !isNonEmptyString(password, 128)) {
        return fail(400, 'Please provide email and password');
    }

    const email = rawEmail.trim().toLowerCase();
    const ip = clientIp(req);

    const retryAfter = await getLoginBlock(ip, email);
    if (retryAfter > 0) {
        const res = fail(429, `Trop de tentatives de connexion. Réessayez dans ${Math.ceil(retryAfter / 60)} minute(s).`);
        res.headers.set('Retry-After', String(retryAfter));
        return res;
    }

    const [account] = await db
        .select({ id: users.id, passwordHash: users.passwordHash, isActive: users.isActive, role: users.role })
        .from(users)
        .where(eq(users.email, email));
    const passwordMatches = await bcrypt.compare(password, account?.passwordHash ?? DUMMY_HASH);

    // Same answer for unknown email, wrong password, no password (Google-only) and inactive account
    if (!account?.passwordHash || !passwordMatches || !account.isActive || account.role === 'student') {
        await recordLoginFailure(ip, email);
        return fail(401, 'Invalid credentials');
    }

    await clearLoginFailures(email);
    const user = (await loadUser(account.id))!;
    await logActivity({ userId: user.id, action: 'LOGIN', details: { email: user.email, ip } });

    const res = json({ success: true, message: 'Login successful', user: publicUser(user) });
    await setSessionCookie(res, user, rememberMe === true);
    return res;
}, 'Server error during login');
