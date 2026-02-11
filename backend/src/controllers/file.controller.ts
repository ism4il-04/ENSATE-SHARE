
import { Response } from 'express';
import File from '../models/File.model';
import ActivityLog from '../models/ActivityLog.model';
import AcademicStructure from '../models/AcademicStructure.model';
import { drive, FOLDER_ID } from '../config/drive'; // Import Google Drive config
import { AuthRequest } from '../middleware/auth.middleware';
import path from 'path';
import { Readable } from 'stream';

// @desc    Get all files with filters
// @route   GET /api/files
// @access  Public
export const getFiles = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { year, filiere, semester, module, fileCategory, search, page = 1, limit = 20 } = req.query;

        // Build filter object
        const filter: any = {};

        if (year) filter.year = year;
        if (filiere) filter.filiere = filiere;
        if (semester) filter.semester = semester;
        if (module) filter.module = module;
        if (fileCategory) filter.fileCategory = fileCategory;

        // Text search on file names
        if (search) {
            filter.$text = { $search: search as string };
        }

        // If user is a responsable, filter by their assigned year/filiere
        if (req.user && req.user.role === 'responsable') {
            filter.year = req.user.assignedYear;
            filter.filiere = req.user.assignedFiliere;
        }

        // Pagination
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Get files
        const files = await File.find(filter)
            .populate('uploadedBy', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        // Get total count
        const total = await File.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: files.length,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            files,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Error fetching files',
            error: error.message,
        });
    }
};

// @desc    Get single file by ID
// @route   GET /api/files/:id
// @access  Public
export const getFileById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const file = await File.findById(req.params.id).populate(
            'uploadedBy',
            'firstName lastName email'
        );

        if (!file) {
            res.status(404).json({
                success: false,
                message: 'File not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            file,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Error fetching file',
            error: error.message,
        });
    }
};

import { ensureDrivePath } from '../utils/driveUtils';
// @route   POST /api/files
// @access  Private (Responsable/Superadmin)
export const uploadFile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({
                success: false,
                message: 'Please upload a file',
            });
            return;
        }

        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Not authorized',
            });
            return;
        }

        const { semester, module, fileCategory = 'Autre', fileLabel } = req.body;

        if (!semester) {
            res.status(400).json({
                success: false,
                message: 'Semester is required',
            });
            return;
        }

        if (!module) {
            res.status(400).json({
                success: false,
                message: 'Module is required',
            });
            return;
        }

        // Determine year and filiere
        let year: string;
        let filiere: string;

        if (req.user.role === 'responsable') {
            // Responsable: use assigned year/filiere
            year = req.user.assignedYear!;
            filiere = req.user.assignedFiliere!;

            // Ensure the responsable can only upload to semesters of their assigned year (filiere = cycle name, year = year code)
            const structure = await AcademicStructure.findOne();
            if (structure?.cycles) {
                const cycleData = structure.cycles.find((c) => c.name === filiere);
                const yearData = cycleData?.years.find((y) => y.code === year);
                const semesterData = yearData?.semesters.find((s) => s.name === semester);

                if (!cycleData || !yearData) {
                    res.status(400).json({
                        success: false,
                        message: 'Your assigned year or filière is not in the academic structure. Contact the administrator.',
                    });
                    return;
                }
                if (!semesterData) {
                    res.status(400).json({
                        success: false,
                        message: `Semester "${semester}" is not part of your assigned year(${year}).You can only upload to: ${yearData.semesters.map((s) => s.name).join(', ')}.`,
                    });
                    return;
                }
                if (!semesterData.modules.includes(module)) {
                    res.status(400).json({
                        success: false,
                        message: `Module "${module}" is not in semester ${semester}. Allowed modules: ${semesterData.modules.join(', ')}.`,
                    });
                    return;
                }
            }
        } else {
            // Superadmin: must provide year and filiere
            year = req.body.year;
            filiere = req.body.filiere;

            if (!year || !filiere) {
                res.status(400).json({
                    success: false,
                    message: 'Year and filiere are required for superadmin',
                });
                return;
            }
        }

        // Sanitize filename
        const sanitizedFilename = req.file.originalname
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^a-zA-Z0-9._-]/g, '_'); // Replace special chars with underscore

        // Get file extension (without dot)
        const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');

        // Create a readable stream from the buffer
        const bufferStream = new Readable();
        bufferStream.push(req.file.buffer);
        bufferStream.push(null);

        // Ensure folder structure exists
        const targetFolderId = await ensureDrivePath({
            filiere,
            year,
            semester,
            module,
            fileCategory
        });

        // Upload to Google Drive
        const driveResponse = await drive.files.create({
            requestBody: {
                name: sanitizedFilename,
                parents: [targetFolderId], // Upload to the dynamically created folder
            },
            media: {
                mimeType: req.file.mimetype,
                body: bufferStream,
            },
            fields: 'id, name, webViewLink, webContentLink, thumbnailLink',
        });

        // Make file public
        await drive.permissions.create({
            fileId: driveResponse.data.id!,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        // Check if thumbnail exists, if not, wait and refetch (Drive takes time to generate it)
        let thumbnailLink = driveResponse.data.thumbnailLink;

        // Retry logic for thumbnails (PPTX often takes longer)
        if (!thumbnailLink) {
            let retries = 0;
            const maxRetries = 3;

            while (!thumbnailLink && retries < maxRetries) {
                retries++;
                // console.log(`Thumbnail missing, retrying (${retries}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s

                try {
                    const updatedFile = await drive.files.get({
                        fileId: driveResponse.data.id!,
                        fields: 'thumbnailLink',
                    });
                    thumbnailLink = updatedFile.data.thumbnailLink;
                    if (thumbnailLink) break;
                } catch (err) {
                    console.error('Failed to refetch thumbnail:', err);
                }
            }
        }

        // Create file document
        const file = await File.create({
            fileName: sanitizedFilename,
            originalName: req.file.originalname,
            displayName: req.file.originalname, // Preserve accents for display
            fileType: ext,
            fileSize: req.file.size,
            fileUrl: driveResponse.data.webViewLink, // Link to view in Drive
            driveId: driveResponse.data.id,
            webViewLink: driveResponse.data.webViewLink,
            webContentLink: driveResponse.data.webContentLink,
            thumbnailLink: thumbnailLink,
            year,
            filiere,
            semester,
            module,
            fileCategory,
            fileLabel: fileLabel || undefined,
            uploadedBy: req.user._id,
        });

        // Log activity
        await ActivityLog.create({
            userId: req.user._id,
            action: 'upload',
            details: `Uploaded ${file.fileName} to ${year} - ${filiere} - ${semester} - ${module} `,
        });

        res.status(201).json({
            success: true,
            message: 'File uploaded successfully',
            file,
        });
    } catch (error: any) {
        console.error('Upload Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading file',
            error: error.message,
        });
    }
};

// @desc    Update file metadata
// @route   PUT /api/files/:id
// @access  Private (Owner or Superadmin)
export const updateFile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Not authorized',
            });
            return;
        }

        const file = await File.findById(req.params.id);

        if (!file) {
            res.status(404).json({
                success: false,
                message: 'File not found',
            });
            return;
        }

        // Check authorization: owner or superadmin
        if (
            req.user.role !== 'superadmin' &&
            file.uploadedBy.toString() !== req.user._id.toString()
        ) {
            res.status(403).json({
                success: false,
                message: 'Not authorized to update this file',
            });
            return;
        }

        // Update allowed fields
        const { fileName, semester, module, fileCategory, fileLabel } = req.body;

        if (fileName) {
            file.fileName = fileName;
            file.displayName = fileName; // Update display name too
        }
        if (semester) file.semester = semester;
        if (module) file.module = module;
        if (fileCategory) file.fileCategory = fileCategory;
        if (fileLabel !== undefined) file.fileLabel = fileLabel;

        await file.save();

        // Log activity
        await ActivityLog.create({
            userId: req.user._id,
            action: 'FILE_UPDATE',
            targetId: file._id,
            targetType: 'File',
            details: { fileName, module },
        });

        res.status(200).json({
            success: true,
            message: 'File updated successfully',
            file,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Error updating file',
            error: error.message,
        });
    }
};

// @desc    Delete a file
// @route   DELETE /api/files/:id
// @access  Private (Owner or Superadmin)
export const deleteFile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Not authorized',
            });
            return;
        }

        const file = await File.findById(req.params.id);

        if (!file) {
            res.status(404).json({
                success: false,
                message: 'File not found',
            });
            return;
        }

        // Check authorization: owner or superadmin
        if (
            req.user.role !== 'superadmin' &&
            file.uploadedBy.toString() !== req.user._id.toString()
        ) {
            res.status(403).json({
                success: false,
                message: 'Not authorized to delete this file',
            });
            return;
        }

        // Delete from Drive (if driveId exists)
        if (file.driveId) {
            try {
                await drive.files.delete({ fileId: file.driveId });
            } catch (err: any) {
                console.error('Error deleting from Drive:', err);
                // Continue to delete from DB even if Drive fails (e.g., file already gone)
            }
        }
        // No legacy Cloudinary delete here, as the instruction implies a full switch.

        // Delete from database
        await file.deleteOne();

        // Log activity
        await ActivityLog.create({
            userId: req.user._id,
            action: 'FILE_DELETE',
            targetId: file._id,
            targetType: 'File',
            details: {
                fileName: file.fileName,
                year: file.year,
                filiere: file.filiere,
            },
        });

        res.status(200).json({
            success: true,
            message: 'File deleted successfully',
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Error deleting file',
            error: error.message,
        });
    }
};

// @desc    Download a file
// @route   GET /api/files/:id/download
// @access  Public
export const downloadFile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            res.status(404).json({
                success: false,
                message: 'File not found',
            });
            return;
        }

        // If it's a Google Drive file, redirect to the webContentLink
        if (file.webContentLink) {
            res.redirect(file.webContentLink);
            return;
        }

        // Legacy Cloudinary fallback
        if (file.fileUrl) {
            res.redirect(file.fileUrl);
            return;
        }

        res.status(404).json({ success: false, message: 'File URL not found' });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Error downloading file',
            error: error.message,
        });
    }
};

// @desc    Sync thumbnails from Google Drive for files missing them
// @route   GET /api/files/sync-thumbnails
// @access  Private (Superadmin only) - for debugging/maintenance
export const syncThumbnails = async (req: AuthRequest, res: Response): Promise<void> => {
    const fs = require('fs');
    const logPath = path.join(__dirname, '../../debug_sync.txt');
    const log = (msg: string) => fs.appendFileSync(logPath, msg + '\n');

    try {
        log('--- Sync triggered --- ' + new Date().toISOString());

        // Find files with driveId but no thumbnailLink
        const filesToSync = await File.find({
            driveId: { $exists: true, $ne: null },
            $or: [
                { thumbnailLink: { $exists: false } },
                { thumbnailLink: null },
                { thumbnailLink: '' }
            ]
        }).limit(50); // Process in batches

        log(`Found ${filesToSync.length} files to sync.`);
        const results = [];

        for (const file of filesToSync) {
            log(`Syncing thumbnail for ${file.fileName} (${file.driveId})...`);
            try {
                // Fetch file metadata from Drive
                const driveFile = await drive.files.get({
                    fileId: file.driveId!,
                    fields: 'thumbnailLink, hasThumbnail, id, name, mimeType'
                });

                log(`Drive response for ${file.fileName}: ` + JSON.stringify(driveFile.data));

                if (driveFile.data.thumbnailLink) {
                    file.thumbnailLink = driveFile.data.thumbnailLink;
                    await file.save();
                    results.push({ id: file._id, name: file.fileName, status: 'Updated', link: 'Found' });
                    log('Updated DB with thumbnailLink.');
                } else {
                    results.push({ id: file._id, name: file.fileName, status: 'Skipped', link: 'Not found in Drive' });
                    log('No thumbnailLink in Drive response.');
                }
            } catch (err: any) {
                console.error(`Error syncing file ${file.fileName}:`, err.message);
                log(`Error syncing ${file.fileName}: ${err.message}`);
                results.push({ id: file._id, name: file.fileName, status: 'Error', error: err.message });
            }
        }

        res.status(200).json({
            success: true,
            count: filesToSync.length,
            results
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Error syncing thumbnails',
            error: error.message,
        });
    }
};
