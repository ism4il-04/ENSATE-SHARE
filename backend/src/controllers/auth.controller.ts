import { Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import User from '../models/User.model';
import ActivityLog from '../models/ActivityLog.model';
import { AuthRequest } from '../middleware/auth.middleware';

// Generate JWT Token
const generateToken = (id: string): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    return jwt.sign({ id }, secret, { expiresIn: '24h' });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: 'Please provide email and password',
            });
            return;
        }

        // Check if user exists (include password for comparison)
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
            return;
        }

        // Check if user is active
        if (!user.isActive) {
            res.status(401).json({
                success: false,
                message: 'Account is inactive',
            });
            return;
        }

        // Check password
        const isPasswordMatch = await user.comparePassword(password);

        if (!isPasswordMatch) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
            return;
        }

        // Generate token
        const token = generateToken(user._id.toString());

        // Log activity
        await ActivityLog.create({
            userId: user._id,
            action: 'LOGIN',
            details: { email: user.email },
        });

        // Send response with cookie
        res
            .status(200)
            .cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
            })
            .json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    assignedYear: user.assignedYear,
                    assignedFiliere: user.assignedFiliere,
                },
            });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message,
        });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Log activity
        if (req.user) {
            await ActivityLog.create({
                userId: req.user._id,
                action: 'LOGOUT',
            });
        }

        res
            .status(200)
            .cookie('token', '', {
                httpOnly: true,
                expires: new Date(0),
            })
            .json({
                success: true,
                message: 'Logout successful',
            });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Server error during logout',
            error: error.message,
        });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Not authorized',
            });
            return;
        }

        res.status(200).json({
            success: true,
            user: {
                id: req.user._id,
                email: req.user.email,
                role: req.user.role,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                assignedYear: req.user.assignedYear,
                assignedFiliere: req.user.assignedFiliere,
                isActive: req.user.isActive,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};
