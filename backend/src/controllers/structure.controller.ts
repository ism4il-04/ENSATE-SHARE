import { Response } from 'express';
import AcademicStructure from '../models/AcademicStructure.model';
import ActivityLog from '../models/ActivityLog.model';
import { AuthRequest } from '../middleware/auth.middleware';

// @desc    Get academic structure
// @route   GET /api/structure
// @access  Public
export const getStructure = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        let structure = await AcademicStructure.findOne();

        // If no structure exists, create empty one (cycles: [])
        if (!structure) {
            structure = await AcademicStructure.create({
                cycles: [],
            });
        }

        res.status(200).json({
            success: true,
            structure,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Error fetching academic structure',
            error: error.message,
        });
    }
};

// @desc    Update academic structure
// @route   PUT /api/structure
// @access  Private (Superadmin only)
export const updateStructure = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { cycles } = req.body;

        if (!cycles || !Array.isArray(cycles)) {
            res.status(400).json({
                success: false,
                message: 'Cycles array is required',
            });
            return;
        }

        let structure = await AcademicStructure.findOne();

        if (!structure) {
            structure = await AcademicStructure.create({ cycles });
        } else {
            structure.cycles = cycles;
            await structure.save();
        }

        // Log activity
        if (req.user) {
            await ActivityLog.create({
                userId: req.user._id,
                action: 'STRUCTURE_UPDATE',
                targetId: structure._id,
                targetType: 'AcademicStructure',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Academic structure updated successfully',
            structure,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Error updating academic structure',
            error: error.message,
        });
    }
};
