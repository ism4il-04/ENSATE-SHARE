import { Response } from 'express';
import File from '../models/File.model';
import ActivityLog from '../models/ActivityLog.model';
import cloudinary from '../config/cloudinary';
import { AuthRequest } from '../middleware/auth.middleware';
import path from 'path';

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

// @desc    Upload a file
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

        // Upload to Cloudinary
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        // Sanitize filename for Cloudinary (remove special characters)
        const sanitizedFilename = req.file.originalname
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^a-zA-Z0-9._-]/g, '_'); // Replace special chars with underscore

        const result = await cloudinary.uploader.upload(dataURI, {
            folder: `ensa-share/${year}/${filiere}/${semester}/${module}`,
            resource_type: 'auto',
            public_id: sanitizedFilename.replace(/\.[^/.]+$/, ''), // Remove extension from public_id
        });

        // Get file extension
        const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');

        // Create file document
        const file = await File.create({
            fileName: sanitizedFilename,
            originalName: req.file.originalname,
            displayName: req.file.originalname, // Preserve accents for display
            fileType: ext,
            fileSize: req.file.size,
            fileUrl: result.secure_url,
            publicId: result.public_id,
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
            details: `Uploaded ${file.fileName} to ${year} - ${filiere} - ${semester} - ${module}`,
        });

        res.status(201).json({
            success: true,
            message: 'File uploaded successfully',
            file,
        });
    } catch (error: any) {
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

        // Delete from Cloudinary
        await cloudinary.uploader.destroy(file.publicId);

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

// @desc    Download a file (redirect to Cloudinary URL)
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

        // Redirect to Cloudinary URL
        res.redirect(file.fileUrl);
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Error downloading file',
            error: error.message,
        });
    }
};
