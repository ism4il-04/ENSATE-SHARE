import { Response } from 'express';
import User from '../models/User.model';
import ActivityLog from '../models/ActivityLog.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { checkPasswordStrength, isNonEmptyString, isValidEmail } from '../utils/authHelpers';

// @desc    Get all responsables
// @route   GET /api/users
// @access  Private (Superadmin only)
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const users = await User.find({ role: 'responsable' }).select('-password');

        res.status(200).json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
        });
    }
};

// @desc    Create a new responsable
// @route   POST /api/users
// @access  Private (Superadmin only)
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { email, password, firstName, lastName, assignedYear, assignedFiliere } =
            req.body;

        // Validate required fields (strings only)
        if (
            ![firstName, lastName, assignedYear, assignedFiliere].every((v) => isNonEmptyString(v)) ||
            !isValidEmail(email)
        ) {
            res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
            return;
        }

        const passwordError = checkPasswordStrength(password);
        if (passwordError) {
            res.status(400).json({ success: false, message: passwordError });
            return;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.trim().toLowerCase() });

        if (existingUser) {
            res.status(400).json({
                success: false,
                message: 'User with this email already exists',
            });
            return;
        }

        // Create user
        const user = await User.create({
            email,
            password,
            firstName,
            lastName,
            role: 'responsable',
            assignedYear,
            assignedFiliere,
        });

        // Log activity
        if (req.user) {
            await ActivityLog.create({
                userId: req.user._id,
                action: 'USER_CREATE',
                targetId: user._id,
                targetType: 'User',
                details: {
                    email: user.email,
                    assignedYear,
                    assignedFiliere,
                },
            });
        }

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                assignedYear: user.assignedYear,
                assignedFiliere: user.assignedFiliere,
                isActive: user.isActive,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Error creating user',
        });
    }
};

// @desc    Update a responsable
// @route   PUT /api/users/:id
// @access  Private (Superadmin only)
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        if (user.role !== 'responsable') {
            res.status(400).json({
                success: false,
                message: 'Can only update responsable accounts',
            });
            return;
        }

        // Update allowed fields
        const { email, firstName, lastName, assignedYear, assignedFiliere, isActive, password } =
            req.body;

        const textFields = { firstName, lastName, assignedYear, assignedFiliere };
        for (const [field, value] of Object.entries(textFields)) {
            if (value === undefined || value === '') continue;
            if (!isNonEmptyString(value)) {
                res.status(400).json({ success: false, message: `Invalid ${field}` });
                return;
            }
            user.set(field, value);
        }

        if (email !== undefined && email !== '') {
            if (!isValidEmail(email)) {
                res.status(400).json({ success: false, message: 'Invalid email' });
                return;
            }
            const normalizedEmail = email.trim().toLowerCase();
            if (await User.exists({ email: normalizedEmail, _id: { $ne: user._id } })) {
                res.status(400).json({ success: false, message: 'User with this email already exists' });
                return;
            }
            user.email = normalizedEmail;
        }

        if (typeof isActive !== 'undefined') {
            if (typeof isActive !== 'boolean') {
                res.status(400).json({ success: false, message: 'Invalid isActive' });
                return;
            }
            user.isActive = isActive;
        }

        if (password) {
            const passwordError = checkPasswordStrength(password);
            if (passwordError) {
                res.status(400).json({ success: false, message: passwordError });
                return;
            }
            user.password = password; // Will be hashed by pre-save hook
        }

        await user.save();

        // Log activity (never the password itself)
        if (req.user) {
            const { password: _omit, ...loggedChanges } = req.body;
            await ActivityLog.create({
                userId: req.user._id,
                action: 'USER_UPDATE',
                targetId: user._id,
                targetType: 'User',
                details: { ...loggedChanges, ...(password && { passwordChanged: true }) },
            });
        }

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                assignedYear: user.assignedYear,
                assignedFiliere: user.assignedFiliere,
                isActive: user.isActive,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Error updating user',
        });
    }
};

// @desc    Delete a responsable
// @route   DELETE /api/users/:id
// @access  Private (Superadmin only)
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        if (user.role !== 'responsable') {
            res.status(400).json({
                success: false,
                message: 'Can only delete responsable accounts',
            });
            return;
        }

        await user.deleteOne();

        // Log activity
        if (req.user) {
            await ActivityLog.create({
                userId: req.user._id,
                action: 'USER_DELETE',
                targetId: user._id,
                targetType: 'User',
                details: {
                    email: user.email,
                },
            });
        }

        res.status(200).json({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
        });
    }
};
