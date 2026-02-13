import { Response } from 'express';
import AcademicStructure, { ICycle } from '../models/AcademicStructure.model';
import ActivityLog from '../models/ActivityLog.model';
import { AuthRequest } from '../middleware/auth.middleware';
import File from '../models/File.model';
import { deleteModuleFolderAndPruneAncestors, renameModuleFolder } from '../utils/driveUtils';

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

        const previousCycles: ICycle[] = structure ? (structure.toObject().cycles as ICycle[]) : [];

        if (!structure) {
            structure = await AcademicStructure.create({ cycles });
        } else {
            structure.cycles = cycles;
            await structure.save();
        }

        // Detect removed modules and clean their Drive folders if they have no files
        const newCycles: ICycle[] = structure.cycles as any;

        const getFiliereName = (cycle: ICycle): string =>
            cycle.cycle === 'CP' ? 'CP' : cycle.name;

        for (const oldCycle of previousCycles) {
            const newCycle = newCycles.find(
                (c) => c.cycle === oldCycle.cycle && c.name === oldCycle.name,
            );
            if (!newCycle) continue;

            for (const oldYear of oldCycle.years) {
                const newYear = newCycle.years.find((y) => y.code === oldYear.code);
                if (!newYear) continue;

                for (const oldSem of oldYear.semesters) {
                    const newSem = newYear.semesters.find((s) => s.name === oldSem.name);
                    if (!newSem) continue;

                    const oldModules = oldSem.modules;
                    const newModules = newSem.modules;

                    const removedModules = oldModules.filter((m) => !newModules.includes(m));
                    const addedModules = newModules.filter((m) => !oldModules.includes(m));

                    for (const oldModuleName of removedModules) {
                        const filiere = getFiliereName(oldCycle);
                        const year = oldYear.code;
                        const semester = oldSem.name;

                        const remaining = await File.countDocuments({
                            filiere,
                            year,
                            semester,
                            module: oldModuleName,
                        });

                        // Try to interpret this as a rename when we have a single removed and a single added module.
                        const isSingleRenameCandidate =
                            removedModules.length === 1 && addedModules.length === 1;

                        if (isSingleRenameCandidate && remaining > 0) {
                            const newModuleName = addedModules[0];

                            // Only rename if there are no files already using the new module name
                            const conflict = await File.countDocuments({
                                filiere,
                                year,
                                semester,
                                module: newModuleName,
                            });

                            if (conflict === 0) {
                                // 1) Update all File documents to new module name
                                await File.updateMany(
                                    { filiere, year, semester, module: oldModuleName },
                                    { $set: { module: newModuleName } },
                                );

                                // 2) Rename the module folder in Drive (keep hierarchy)
                                await renameModuleFolder({
                                    filiere,
                                    year,
                                    semester,
                                    module: oldModuleName,
                                    newModuleName,
                                });

                                // Skip deletion logic for this module; continue to next
                                continue;
                            }
                        }

                        // If we reach here, treat as a pure deletion (no files or rename not safe)
                        if (remaining === 0) {
                            await deleteModuleFolderAndPruneAncestors({
                                filiere,
                                year,
                                semester,
                                module: oldModuleName,
                            });
                        }
                    }
                }
            }
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
