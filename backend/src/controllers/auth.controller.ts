import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import User from '../models/User.model';
import ActivityLog from '../models/ActivityLog.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { clearLoginFailures, getLoginBlock, recordLoginFailure } from '../utils/loginThrottle';
import { isStudentAllowed, isStudentGoogleAccount, STUDENT_EMAIL_DOMAIN } from '../utils/studentAccess';
import {
    checkPasswordStrength,
    clearAuthCookie,
    isNonEmptyString,
    isValidEmail,
    setAuthCookie,
} from '../utils/authHelpers';

// Compared against when the email is unknown, so response time doesn't reveal which emails exist
const DUMMY_HASH = '$2a$10$Vkk6tEqIZNBu3gP4.ipIMeEtPSZ3qggqm.IX75GQzKa05t83UIlee';

// Verifies Google ID tokens (caches Google's public keys between calls)
const googleClient = new OAuth2Client();

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { email: rawEmail, password, rememberMe } = req.body;

        // Strings only: blocks NoSQL operator injection like {"$ne": null}
        if (!isNonEmptyString(rawEmail, 254) || !isNonEmptyString(password, 128)) {
            res.status(400).json({
                success: false,
                message: 'Please provide email and password',
            });
            return;
        }

        const email = rawEmail.trim().toLowerCase();
        const ip = req.ip || 'unknown';

        const retryAfter = await getLoginBlock(ip, email);
        if (retryAfter > 0) {
            res.set('Retry-After', String(retryAfter));
            res.status(429).json({
                success: false,
                message: `Trop de tentatives de connexion. Réessayez dans ${Math.ceil(retryAfter / 60)} minute(s).`,
            });
            return;
        }

        const user = await User.findOne({ email }).select('+password');
        const isPasswordMatch = user
            ? await user.comparePassword(password)
            : await bcrypt.compare(password, DUMMY_HASH);

        // Same response for unknown email, wrong password and inactive account
        if (!user || !isPasswordMatch || !user.isActive) {
            await recordLoginFailure(ip, email);
            res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
            return;
        }

        await clearLoginFailures(email);

        // Log activity
        await ActivityLog.create({
            userId: user._id,
            action: 'LOGIN',
            details: { email: user.email, ip },
        });

        // The token only travels in the httpOnly cookie, never in the response body
        setAuthCookie(res, user._id.toString(), rememberMe === true);
        res.status(200).json({
            success: true,
            message: 'Login successful',
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
        });
    }
};

// @desc    Login with a Google ID token (from Google Identity Services on the login page)
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { credential, rememberMe } = req.body;
        const clientId = process.env.GOOGLE_AUTH_CLIENT_ID;

        if (!clientId) {
            res.status(503).json({ success: false, message: 'Connexion Google non configurée' });
            return;
        }
        if (!isNonEmptyString(credential, 4096)) {
            res.status(400).json({ success: false, message: 'Google credential is required' });
            return;
        }

        // Checks Google's signature, expiry, issuer, and that the token was issued for our client ID
        let payload: TokenPayload | undefined;
        try {
            const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: clientId });
            payload = ticket.getPayload();
        } catch {
            payload = undefined;
        }

        if (!payload?.email || payload.email_verified !== true) {
            res.status(401).json({ success: false, message: 'Connexion Google invalide' });
            return;
        }

        const email = payload.email.toLowerCase();
        let user = await User.findOne({ email });

        // Students: the first sign-in with a university Google Workspace account creates their account,
        // provided the email is on the student list (or the list is still empty)
        const allowedStudent = isStudentGoogleAccount(email, payload.hd) && (await isStudentAllowed(email));
        if (!user && allowedStudent) {
            try {
                user = await User.create({
                    email,
                    role: 'student',
                    firstName: payload.given_name?.slice(0, 100) || email.split('@')[0].slice(0, 100),
                    lastName: payload.family_name?.slice(0, 100) || '-',
                });
            } catch (error: any) {
                // Two first sign-ins at once: the other request already created the account
                if (error?.code !== 11000) throw error;
                user = await User.findOne({ email });
            }
        }

        if (!user || !user.isActive) {
            res.status(403).json({
                success: false,
                message: user
                    ? 'Ce compte est désactivé'
                    : `Connexion réservée aux étudiants de l'ENSA Tétouan (adresse @${STUDENT_EMAIL_DOMAIN})`,
            });
            return;
        }

        // Existing student accounts are re-checked against the list at every sign-in
        if (user.role === 'student' && !(await isStudentAllowed(user.email))) {
            res.status(403).json({
                success: false,
                message: "Votre adresse ne figure pas dans la liste des étudiants de l'ENSA Tétouan",
            });
            return;
        }

        user.lastLoginAt = new Date();
        await user.save();

        // Staff logins go to the activity log; student logins would drown it out
        if (user.role !== 'student') {
            await ActivityLog.create({
                userId: user._id,
                action: 'LOGIN',
                details: { email: user.email, ip: req.ip, method: 'google' },
            });
        }

        setAuthCookie(res, user._id.toString(), rememberMe === true);
        res.status(200).json({
            success: true,
            message: 'Login successful',
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
            message: 'Server error during Google login',
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

        clearAuthCookie(res);
        res.status(200).json({
            success: true,
            message: 'Logout successful',
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Server error during logout',
        });
    }
};

// @desc    Get current logged in user (user: null when there is no valid session)
// @route   GET /api/auth/me
// @access  Public
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(200).json({
                success: true,
                user: null,
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
        });
    }
};

// @desc    Update own profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authorized' });
            return;
        }

        const user = await User.findById(req.user._id).select('+password');
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        const { firstName, lastName, email, currentPassword, newPassword } = req.body;
        const emailChanged =
            req.user.role === 'superadmin' &&
            email !== undefined &&
            email !== '' &&
            (typeof email !== 'string' || email.trim().toLowerCase() !== user.email);

        // Password and email changes both require the current password
        if (newPassword || emailChanged) {
            if (!isNonEmptyString(currentPassword, 128)) {
                res.status(400).json({ success: false, message: 'Le mot de passe actuel est requis' });
                return;
            }
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                res.status(400).json({ success: false, message: 'Mot de passe actuel incorrect' });
                return;
            }
        }

        if (newPassword) {
            const passwordError = checkPasswordStrength(newPassword);
            if (passwordError) {
                res.status(400).json({ success: false, message: passwordError });
                return;
            }
            user.password = newPassword;
        }

        // Name updates (both roles)
        for (const [field, value] of [['firstName', firstName], ['lastName', lastName]] as const) {
            if (value === undefined || value === '') continue;
            if (!isNonEmptyString(value, 100)) {
                res.status(400).json({ success: false, message: 'Nom ou prénom invalide' });
                return;
            }
            user[field] = value;
        }

        // Email update (superadmin only)
        if (emailChanged) {
            if (!isValidEmail(email)) {
                res.status(400).json({ success: false, message: 'Email invalide' });
                return;
            }
            const normalizedEmail = email.trim().toLowerCase();
            if (await User.exists({ email: normalizedEmail, _id: { $ne: user._id } })) {
                res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
                return;
            }
            user.email = normalizedEmail;
        }

        await user.save();

        // Changing the password invalidates older tokens, so issue a fresh one for this session
        if (newPassword) {
            const current = jwt.decode(req.cookies?.token || '') as { iat?: number; exp?: number } | null;
            const wasRemembered =
                !!current?.iat && !!current?.exp && current.exp - current.iat > 2 * 24 * 60 * 60;
            setAuthCookie(res, user._id.toString(), wasRemembered);
        }

        res.status(200).json({
            success: true,
            message: 'Profil mis à jour',
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
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};
