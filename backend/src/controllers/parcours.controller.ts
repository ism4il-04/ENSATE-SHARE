import { Response } from 'express';
import User, { MAX_SAVED_PARCOURS } from '../models/User.model';
import AcademicStructure from '../models/AcademicStructure.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { isNonEmptyString } from '../utils/authHelpers';

const toJSON = (p: { _id: unknown; cycle: string; filiere: string; year: string; semester: string }) => ({
    id: String(p._id),
    cycle: p.cycle,
    filiere: p.filiere,
    year: p.year,
    semester: p.semester,
});

// @desc    List the current user's saved parcours
// @route   GET /api/parcours
// @access  Private (any signed-in user)
export const getSavedParcours = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user!._id).select('savedParcours');
        res.status(200).json({
            success: true,
            max: MAX_SAVED_PARCOURS,
            parcours: (user?.savedParcours ?? []).map(toJSON),
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error fetching saved parcours' });
    }
};

// @desc    Save a parcours (cycle + filière + year + semester)
// @route   POST /api/parcours
// @access  Private (any signed-in user)
export const addSavedParcours = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { cycle, filiere, year, semester } = req.body;

        if (
            (cycle !== 'CP' && cycle !== 'CI') ||
            ![filiere, year, semester].every((v) => isNonEmptyString(v))
        ) {
            res.status(400).json({ success: false, message: 'Parcours invalide' });
            return;
        }

        // Only parcours that exist in the academic structure can be saved
        const structure = await AcademicStructure.findOne();
        const cycleData = structure?.cycles.find((c) => c.cycle === cycle && c.name === filiere);
        const yearData = cycleData?.years.find((y) => y.code === year);
        if (!yearData?.semesters.some((s) => s.name === semester)) {
            res.status(400).json({ success: false, message: "Ce parcours n'existe pas" });
            return;
        }

        const user = await User.findById(req.user!._id);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        const alreadySaved = user.savedParcours.some(
            (p) => p.cycle === cycle && p.filiere === filiere && p.year === year && p.semester === semester
        );
        if (alreadySaved) {
            res.status(200).json({ success: true, parcours: user.savedParcours.map(toJSON) });
            return;
        }

        if (user.savedParcours.length >= MAX_SAVED_PARCOURS) {
            res.status(400).json({
                success: false,
                message: `Vous pouvez enregistrer au maximum ${MAX_SAVED_PARCOURS} parcours`,
            });
            return;
        }

        user.savedParcours.push({ cycle, filiere, year, semester });
        await user.save();

        res.status(201).json({ success: true, parcours: user.savedParcours.map(toJSON) });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error saving parcours' });
    }
};

// @desc    Remove a saved parcours
// @route   DELETE /api/parcours/:id
// @access  Private (any signed-in user)
export const removeSavedParcours = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user!._id);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        const entry = user.savedParcours.find((p) => String(p._id) === req.params.id);
        if (entry) {
            user.savedParcours.pull(entry._id);
            await user.save();
        }

        res.status(200).json({ success: true, parcours: user.savedParcours.map(toJSON) });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error removing parcours' });
    }
};
