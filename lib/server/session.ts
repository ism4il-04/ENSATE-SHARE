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
const SESSION_SECONDS = 30 * 24 * 60 * 60;

const secret = () => {
    const value = process.env.SESSION_SECRET;
    if (!value || value.length < 32) throw new Error('SESSION_SECRET is missing or too short');
    return new TextEncoder().encode(value);
};

/**
 * Signs the session (30 days) and sets the httpOnly cookie. Names travel in the token so
 * student requests never need the database.
 */
export async function setSessionCookie(res: NextResponse, user: AuthUser): Promise<void> {
    const token = await new SignJWT({ role: user.role, email: user.email, fn: user.firstName, ln: user.lastName })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(user.id)
        .setIssuedAt()
        .setExpirationTime(`${SESSION_SECONDS}s`)
        .sign(secret());

    res.cookies.set(COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: SESSION_SECONDS,
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

// Staff account with its assignment, straight from the database
export async function loadUser(id: string): Promise<(AuthUser & { sessionsRevokedAt: Date | null }) | null> {
    const [row] = await db
        .select({
            id: users.id,
            email: users.email,
            role: users.role,
            firstName: users.firstName,
            lastName: users.lastName,
            isActive: users.isActive,
            sessionsRevokedAt: users.passwordChangedAt,
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
 * - Staff: checked against the database on every request (active, role, sessions revoked on an email change).
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
    if (user.sessionsRevokedAt && (payload.iat ?? 0) < Math.floor(user.sessionsRevokedAt.getTime() / 1000)) {
        return null;
    }
    const { sessionsRevokedAt: _, ...authUser } = user;
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
