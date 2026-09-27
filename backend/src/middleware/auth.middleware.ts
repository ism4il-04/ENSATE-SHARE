import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User.model';

// Extend Express Request type to include user
export interface AuthRequest extends Request {
    user?: IUser;
}

const getToken = (req: Request): string | undefined => {
    if (req.cookies?.token) {
        return req.cookies.token;
    }
    if (req.headers.authorization?.startsWith('Bearer ')) {
        return req.headers.authorization.split(' ')[1];
    }
    return undefined;
};

// Returns the active user the token belongs to, or null if the token is invalid,
// expired, issued before the last password change, or the account is inactive/deleted.
const resolveUser = async (token: string): Promise<IUser | null> => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    let decoded: { id: string; iat?: number };
    try {
        decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as { id: string; iat?: number };
    } catch {
        return null;
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
        return null;
    }

    if (user.passwordChangedAt && (decoded.iat ?? 0) < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
        return null;
    }

    return user;
};

// Verify JWT token
export const protect = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const token = getToken(req);

        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Not authorized to access this route',
            });
            return;
        }

        const user = await resolveUser(token);
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid or expired session',
            });
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error in authentication',
        });
    }
};

// Authorize specific roles
export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Not authorized',
            });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route`,
            });
            return;
        }

        next();
    };
};

// Optional auth - populate req.user if token exists, but don't reject if missing
export const optionalAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const token = getToken(req);
        if (token) {
            const user = await resolveUser(token);
            if (user) {
                req.user = user;
            }
        }
    } catch {
        /* token invalid/expired — proceed as unauthenticated */
    }
    next();
};

// Middleware to require superadmin role
export const requireSuperadmin = [protect, authorize('superadmin')];

// Middleware to require responsable or superadmin role
export const requireAuth = [protect, authorize('responsable', 'superadmin')];
