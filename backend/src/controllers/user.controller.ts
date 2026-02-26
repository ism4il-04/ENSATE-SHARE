import { Response } from 'express';
import User from '../models/User.model';
import ActivityLog from '../models/ActivityLog.model';
import { AuthRequest } from '../middleware/auth.middleware';

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
            error: error.message,
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

        // Validate required fields
        if (!email || !password || !firstName || !lastName || !assignedYear || !assignedFiliere) {
            res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
            return;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });

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
            error: error.message,
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

        if (email) user.email = email;
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (assignedYear) user.assignedYear = assignedYear;
        if (assignedFiliere) user.assignedFiliere = assignedFiliere;
        if (typeof isActive !== 'undefined') user.isActive = isActive;
        if (password) user.password = password; // Will be hashed by pre-save hook

        await user.save();

        // Log activity
        if (req.user) {
            await ActivityLog.create({
                userId: req.user._id,
                action: 'USER_UPDATE',
                targetId: user._id,
                targetType: 'User',
                details: req.body,
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
            error: error.message,
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
            error: error.message,
        });
    }
};
