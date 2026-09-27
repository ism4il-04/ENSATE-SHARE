import { Response } from 'express';
import User, { IUser, MAX_SAVED_PARCOURS } from '../models/User.model';
import ActivityLog from '../models/ActivityLog.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { isNonEmptyString, isValidEmail } from '../utils/authHelpers';

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

// Response shape shared by create/update
const toResponsableJSON = (user: IUser) => ({
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    assignedYear: user.assignedYear,
    assignedFiliere: user.assignedFiliere,
    isActive: user.isActive,
});

// @desc    Create a new responsable (signs in with Google using this email, no password)
// @route   POST /api/users
// @access  Private (Superadmin only)
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { email, firstName, lastName, assignedYear, assignedFiliere } = req.body;

        // Validate required fields (strings only)
        if (
            ![firstName, lastName, assignedYear, assignedFiliere].every((v) => isNonEmptyString(v)) ||
            !isValidEmail(email)
        ) {
            res.status(400).json({
                success: false,
                message: 'Tous les champs sont requis (avec une adresse email valide)',
            });
            return;
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser && existingUser.role !== 'student') {
            res.status(400).json({
                success: false,
                message: 'Cette adresse est déjà utilisée par un autre responsable ou administrateur',
            });
            return;
        }

        // A student who already signed in with this address becomes the responsable (saved parcours kept)
        const user = existingUser ?? new User({ email: normalizedEmail });
        user.set({ role: 'responsable', firstName, lastName, assignedYear, assignedFiliere, isActive: true });
        await user.save();

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
                    ...(existingUser && { promotedFromStudent: true }),
                },
            });
        }

        res.status(201).json({
            success: true,
            message: existingUser
                ? 'Le compte étudiant existant a été converti en responsable'
                : 'Responsable créé',
            user: toResponsableJSON(user),
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du responsable',
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
                message: 'Utilisateur introuvable',
            });
            return;
        }

        if (user.role !== 'responsable') {
            res.status(400).json({
                success: false,
                message: 'Seuls les comptes responsables peuvent être modifiés ici',
            });
            return;
        }

        // Update allowed fields
        const { email, firstName, lastName, assignedYear, assignedFiliere, isActive } = req.body;

        const textFields = { firstName, lastName, assignedYear, assignedFiliere };
        for (const [field, value] of Object.entries(textFields)) {
            if (value === undefined || value === '') continue;
            if (!isNonEmptyString(value)) {
                res.status(400).json({ success: false, message: `Champ invalide : ${field}` });
                return;
            }
            user.set(field, value);
        }

        let absorbedStudent: IUser | null = null;
        if (email !== undefined && email !== '') {
            if (!isValidEmail(email)) {
                res.status(400).json({ success: false, message: 'Adresse email invalide' });
                return;
            }
            const normalizedEmail = email.trim().toLowerCase();

            if (normalizedEmail !== user.email) {
                const other = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
                if (other && other.role !== 'student') {
                    res.status(400).json({
                        success: false,
                        message: 'Cette adresse est déjà utilisée par un autre responsable ou administrateur',
                    });
                    return;
                }
                // Same person already signed in as a student: merge that account into this one
                absorbedStudent = other;

                user.email = normalizedEmail;
                // New address = new owner: the old password stops working and open sessions end.
                // The responsable now signs in with Google using the new address.
                user.password = undefined;
                user.passwordChangedAt = new Date();
            }
        }

        if (typeof isActive !== 'undefined') {
            if (typeof isActive !== 'boolean') {
                res.status(400).json({ success: false, message: 'Statut invalide' });
                return;
            }
            user.isActive = isActive;
        }

        if (absorbedStudent) {
            for (const p of absorbedStudent.savedParcours) {
                const duplicate = user.savedParcours.some(
                    (q) => q.cycle === p.cycle && q.filiere === p.filiere && q.year === p.year && q.semester === p.semester
                );
                if (!duplicate && user.savedParcours.length < MAX_SAVED_PARCOURS) {
                    user.savedParcours.push({ cycle: p.cycle, filiere: p.filiere, year: p.year, semester: p.semester });
                }
            }
            // Free the email before saving it on this account (unique index)
            await absorbedStudent.deleteOne();
        }

        await user.save();

        // Log activity
        if (req.user) {
            await ActivityLog.create({
                userId: req.user._id,
                action: 'USER_UPDATE',
                targetId: user._id,
                targetType: 'User',
                details: {
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    assignedYear: user.assignedYear,
                    assignedFiliere: user.assignedFiliere,
                    isActive: user.isActive,
                    ...(absorbedStudent && { mergedStudentAccount: true }),
                },
            });
        }

        res.status(200).json({
            success: true,
            message: 'Responsable mis à jour',
            user: toResponsableJSON(user),
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour',
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
