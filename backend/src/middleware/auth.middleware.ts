import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User.model';

// Extend Express Request type to include user
export interface AuthRequest extends Request {
    user?: IUser;
}

// Verify JWT token
export const protect = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        let token: string | undefined;

        // Check for token in cookies or Authorization header
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        } else if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Not authorized to access this route',
            });
            return;
        }

        try {
            // Verify token
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                res.status(500).json({
                    success: false,
                    message: 'Server configuration error',
                });
                return;
            }

            const decoded = jwt.verify(token, secret) as {
                id: string;
            };

            // Get user from token
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                res.status(401).json({
                    success: false,
                    message: 'User not found',
                });
                return;
            }

            if (!user.isActive) {
                res.status(401).json({
                    success: false,
                    message: 'User account is inactive',
                });
                return;
            }

            req.user = user;
            next();
        } catch (error) {
            res.status(401).json({
                success: false,
                message: 'Invalid token',
            });
            return;
        }
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

// Middleware to require superadmin role
export const requireSuperadmin = [protect, authorize('superadmin')];

// Middleware to require responsable or superadmin role
export const requireAuth = [protect, authorize('responsable', 'superadmin')];
