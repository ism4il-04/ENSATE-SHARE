import 'server-only';
import { eq } from 'drizzle-orm';
import { jwtVerify, SignJWT } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { db, filieres, users, years } from '@/lib/db';
import { isStudentAllowed } from './student-access';

export type Role = 'student' | 'responsable' | 'superadmin';

export interface AuthUser {
    id: string;
    email: string;
    role: Role;
    firstName: string;
    lastName: string;
    isActive: boolean;
    assignedYearId?: number | null;
    assignedYear?: string | null; // year code, responsables only
    assignedFiliere?: string | null; // filière name, responsables only
}

const COOKIE = 'token';
const LONG_SESSION = 30 * 24 * 60 * 60; // seconds
const SHORT_SESSION = 24 * 60 * 60;

const secret = () => {
    const value = process.env.SESSION_SECRET;
    if (!value || value.length < 32) throw new Error('SESSION_SECRET is missing or too short');
    return new TextEncoder().encode(value);
};

/**
 * Signs the session and sets the httpOnly cookie. Persistent sessions (students, "Rester connecté")
 * last 30 days; others are a browser-session cookie with a 24 h token. Names travel in the token so
 * student requests never need the database.
 */
export async function setSessionCookie(res: NextResponse, user: AuthUser, persistent: boolean): Promise<void> {
    const lifetime = persistent ? LONG_SESSION : SHORT_SESSION;
    const token = await new SignJWT({ role: user.role, email: user.email, fn: user.firstName, ln: user.lastName })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(user.id)
        .setIssuedAt()
        .setExpirationTime(`${lifetime}s`)
        .sign(secret());

    res.cookies.set(COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        ...(persistent && { maxAge: lifetime }),
    });
}

export function clearSessionCookie(res: NextResponse): void {
    res.cookies.set(COOKIE, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 0,
    });
}

// Whether the current session was persistent (kept when a password change re-issues it)
export async function sessionIsPersistent(req: NextRequest): Promise<boolean> {
    const token = req.cookies.get(COOKIE)?.value;
    if (!token) return false;
    try {
        const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] });
        return !!payload.iat && !!payload.exp && payload.exp - payload.iat > 2 * 24 * 60 * 60;
    } catch {
        return false;
    }
}

// Staff account with its assignment, straight from the database
export async function loadUser(id: string): Promise<(AuthUser & { passwordChangedAt: Date | null }) | null> {
    const [row] = await db
        .select({
            id: users.id,
            email: users.email,
            role: users.role,
            firstName: users.firstName,
            lastName: users.lastName,
            isActive: users.isActive,
            passwordChangedAt: users.passwordChangedAt,
            assignedYearId: users.assignedYearId,
            assignedYear: years.code,
            assignedFiliere: filieres.name,
        })
        .from(users)
        .leftJoin(years, eq(years.id, users.assignedYearId))
        .leftJoin(filieres, eq(filieres.id, years.filiereId))
        .where(eq(users.id, id));
    return row ?? null;
}

/**
 * The signed-in user, or null (no/invalid/expired session, account revoked).
 * - Students: checked against the cached access snapshot, no database query.
 * - Staff: checked against the database on every request (active, role, password changes).
 */
export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
    const token = req.cookies.get(COOKIE)?.value;
    if (!token) return null;

    let payload;
    try {
        ({ payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] }));
    } catch {
        return null;
    }
    const id = payload.sub;
    if (!id) return null;

    if (payload.role === 'student') {
        const email = String(payload.email);
        if (!(await isStudentAllowed(email, id))) return null;
        return {
            id,
            email,
            role: 'student',
            firstName: String(payload.fn ?? ''),
            lastName: String(payload.ln ?? ''),
            isActive: true,
        };
    }

    const user = await loadUser(id);
    if (!user || !user.isActive) return null;
    if (user.passwordChangedAt && (payload.iat ?? 0) < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
        return null;
    }
    const { passwordChangedAt: _, ...authUser } = user;
    return authUser;
}

export const publicUser = (user: AuthUser) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    assignedYear: user.assignedYear ?? undefined,
    assignedFiliere: user.assignedFiliere ?? undefined,
    isActive: user.isActive,
});
