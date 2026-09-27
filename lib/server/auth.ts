import 'server-only';
import { NextRequest } from 'next/server';
import { fail } from './http';
import { AuthUser, getAuthUser, Role } from './session';

/**
 * Route guard: returns the user, or a 401/403 Response to return as-is.
 *   const auth = await requireRole(req, 'superadmin');
 *   if (auth instanceof Response) return auth;
 */
export async function requireRole(req: NextRequest, ...roles: Role[]): Promise<AuthUser | Response> {
    const user = await getAuthUser(req);
    if (!user) return fail(401, 'Session invalide ou expirée');
    if (roles.length > 0 && !roles.includes(user.role)) {
        return fail(403, "Vous n'avez pas accès à cette action");
    }
    return user;
}

export const requireLogin = (req: NextRequest) => requireRole(req);
export const requireStaff = (req: NextRequest) => requireRole(req, 'responsable', 'superadmin');
export const requireSuperadmin = (req: NextRequest) => requireRole(req, 'superadmin');
