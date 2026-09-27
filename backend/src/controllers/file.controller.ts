
import { Response } from 'express';
import File from '../models/File.model';
import ActivityLog from '../models/ActivityLog.model';
import AcademicStructure from '../models/AcademicStructure.model';
import mongoose from 'mongoose';
import PendingUpload from '../models/PendingUpload.model';
import { drive, oauth2Client } from '../config/drive';
import { ensureDrivePath, deleteCategoryFolderIfEmpty, deleteModuleFolderAndPruneAncestors } from '../utils/driveUtils';
import {
    allowedExtensionsLabel,
    getExtension,
    MAX_UPLOAD_BYTES,
    mimeTypeFor,
    sanitizeFileName,
} from '../utils/uploadRules';
import { AuthRequest } from '../middleware/auth.middleware';
import { isNonEmptyString } from '../utils/authHelpers';

// @desc    Get all files with filters
// @route   GET /api/files
// @access  Public
export const getFiles = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { search, page = '1', limit = '20' } = req.query;

        // Build filter object (plain string values only, so query operators can't be injected)
        const filter: any = {};

        for (const key of ['year', 'filiere', 'semester', 'module', 'fileCategory'] as const) {
            const value = req.query[key];
            if (typeof value === 'string' && value) filter[key] = value;
        }

        // Text search on file names
        if (typeof search === 'string' && search) {
            filter.$text = { $search: search.slice(0, 200) };
        }

        // Responsable dashboard (?scope=mine): only their assigned year/filière.
        // On the public site everyone, responsables included, sees every document.
        if (req.user && req.user.role === 'responsable' && req.query.scope === 'mine') {
            filter.year = req.user.assignedYear;
            filter.filiere = req.user.assignedFiliere;
        }

        // Pagination
        const pageNum = Math.max(1, parseInt(page as string) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
        const skip = (pageNum - 1) * limitNum;

        // Get files
        const files = await File.find(filter)
            .populate('uploadedBy', 'firstName lastName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        // Get total count
        const total = await File.countDocuments(filter);

        // Aggregate total size across ALL matching files (not just the paginated subset)
        const sizeAgg = await File.aggregate([
            { $match: filter },
            { $group: { _id: null, totalSize: { $sum: '$fileSize' } } },
        ]);
        const totalSize = sizeAgg.length > 0 ? sizeAgg[0].totalSize : 0;

        // Count files uploaded this month (matching the same filter)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthCount = await File.countDocuments({
            ...filter,
            createdAt: { $gte: startOfMonth },
        });

        res.status(200).json({
            success: true,
            count: files.length,
            total,
            totalSize,
            thisMonthCount,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            files,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Error fetching files',
        });
    }
};

// @desc    Get single file by ID
// @route   GET /api/files/:id
// @access  Public
export const getFileById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const file = await File.findById(req.params.id).populate('uploadedBy', 'firstName lastName');

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
        });
    }
};

const FILE_CATEGORIES = ['Cours', 'TD', 'TP', 'EXAM', 'Autre'];
const PENDING_UPLOAD_TTL_MS = 24 * 60 * 60 * 1000;

type UploadTarget = { year: string; filiere: string; semester: string; module: string; fileCategory: string; fileLabel?: string };

// Where an upload goes, and whether this user may put it there. Returns an error message when not allowed.
const resolveUploadTarget = async (req: AuthRequest): Promise<UploadTarget | string> => {
    const { semester, module, fileCategory = 'Autre', fileLabel } = req.body;

    for (const [field, value] of Object.entries({ semester, module, fileCategory, year: req.body.year, filiere: req.body.filiere })) {
        if (value !== undefined && value !== '' && !isNonEmptyString(value)) return `Champ invalide : ${field}`;
    }
    if (fileLabel !== undefined && fileLabel !== '' && !isNonEmptyString(fileLabel, 100)) return 'Label invalide';
    if (!semester) return 'Le semestre est requis';
    if (!module) return 'Le module est requis';
    if (!FILE_CATEGORIES.includes(fileCategory)) return 'Type de fichier invalide';

    let year: string;
    let filiere: string;

    if (req.user!.role === 'responsable') {
        // Responsable: only their assigned year/filière, and only semesters/modules of the structure
        year = req.user!.assignedYear!;
        filiere = req.user!.assignedFiliere!;

        const structure = await AcademicStructure.findOne();
        const cycleData = structure?.cycles.find((c) => c.name === filiere);
        const yearData = cycleData?.years.find((y) => y.code === year);
        const semesterData = yearData?.semesters.find((s) => s.name === semester);

        if (!cycleData || !yearData) {
            return "Votre année ou filière n'est pas dans la structure académique. Contactez l'administrateur.";
        }
        if (!semesterData) {
            return `Le semestre "${semester}" ne fait pas partie de votre année (${year}). Semestres possibles : ${yearData.semesters.map((s) => s.name).join(', ')}.`;
        }
        if (!semesterData.modules.includes(module)) {
            return `Le module "${module}" n'est pas dans le semestre ${semester}.`;
        }
    } else {
        // Superadmin: must provide year and filière
        year = req.body.year;
        filiere = req.body.filiere;
        if (!year || !filiere) return "L'année et la filière sont requises";
    }

    return { year, filiere, semester, module, fileCategory, fileLabel: fileLabel || undefined };
};

// Origin the browser uploads from: Google only accepts the browser's upload (CORS) from this origin
const uploadOrigin = (req: AuthRequest): string => {
    const origin = req.headers.origin;
    const allowed = [process.env.FRONTEND_URL, `${req.protocol}://${req.get('host')}`].filter(Boolean);
    return origin && allowed.includes(origin) ? origin : process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
};

// @desc    Authorize an upload and get a one-time Google Drive upload link for the browser
// @route   POST /api/files/upload-session  { fileName, size, semester, module, fileCategory, fileLabel?, year?, filiere? }
// @access  Private (Responsable/Superadmin)
export const createUploadSession = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { fileName, size } = req.body;

        if (!isNonEmptyString(fileName, 255)) {
            res.status(400).json({ success: false, message: 'Nom de fichier invalide' });
            return;
        }
        if (typeof size !== 'number' || !Number.isInteger(size) || size <= 0) {
            res.status(400).json({ success: false, message: 'Taille de fichier invalide' });
            return;
        }
        if (size > MAX_UPLOAD_BYTES) {
            res.status(400).json({
                success: false,
                message: `Fichier trop volumineux (max ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} Mo)`,
            });
            return;
        }

        const fileType = getExtension(fileName);
        const mimeType = mimeTypeFor(fileType);
        if (!mimeType) {
            res.status(400).json({
                success: false,
                message: `Type de fichier non autorisé. Types acceptés : ${allowedExtensionsLabel()}`,
            });
            return;
        }

        const target = await resolveUploadTarget(req);
        if (typeof target === 'string') {
            res.status(400).json({ success: false, message: target });
            return;
        }

        const folderId = await ensureDrivePath(target);
        const sanitizedName = sanitizeFileName(fileName);

        const pending = await PendingUpload.create({
            userId: req.user!._id,
            folderId,
            fileName: sanitizedName,
            originalName: fileName,
            fileType,
            mimeType,
            size,
            ...target,
            expiresAt: new Date(Date.now() + PENDING_UPLOAD_TTL_MS),
        });

        // Start a resumable upload on Drive; the returned session URL accepts exactly this one file
        const { token } = await oauth2Client.getAccessToken();
        const driveResponse = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json; charset=UTF-8',
                    'X-Upload-Content-Type': mimeType,
                    'X-Upload-Content-Length': String(size),
                    Origin: uploadOrigin(req),
                },
                body: JSON.stringify({
                    name: sanitizedName,
                    parents: [folderId],
                    mimeType,
                    appProperties: { ensaUploadId: String(pending._id) },
                }),
            }
        );

        const uploadUrl = driveResponse.headers.get('location');
        if (!driveResponse.ok || !uploadUrl) {
            console.error('Drive resumable session failed:', driveResponse.status, await driveResponse.text());
            await pending.deleteOne();
            res.status(502).json({ success: false, message: "Google Drive n'a pas accepté l'upload, réessayez" });
            return;
        }

        res.status(200).json({ success: true, uploadId: String(pending._id), uploadUrl, mimeType });
    } catch (error: any) {
        console.error('Upload session error:', error);
        res.status(500).json({ success: false, message: "Erreur lors de la préparation de l'upload" });
    }
};

// @desc    Register a file the browser finished uploading to Drive
// @route   POST /api/files/upload-complete  { uploadId, driveFileId }
// @access  Private (Responsable/Superadmin)
export const completeUpload = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { uploadId, driveFileId } = req.body;

        if (!isNonEmptyString(uploadId, 50) || !mongoose.isValidObjectId(uploadId) || !isNonEmptyString(driveFileId, 200)) {
            res.status(400).json({ success: false, message: 'Requête invalide' });
            return;
        }

        const pending = await PendingUpload.findOne({ _id: uploadId, userId: req.user!._id });
        if (!pending) {
            res.status(404).json({ success: false, message: 'Upload introuvable ou expiré' });
            return;
        }

        // The Drive file must be the one this session created: our upload id, our folder, the announced size
        let driveFile;
        try {
            driveFile = (
                await drive.files.get({
                    fileId: driveFileId,
                    fields: 'id, size, parents, appProperties, webViewLink, webContentLink, thumbnailLink',
                })
            ).data;
        } catch {
            driveFile = null;
        }

        if (!driveFile || driveFile.appProperties?.ensaUploadId !== uploadId) {
            res.status(400).json({ success: false, message: 'Fichier Drive invalide pour cet upload' });
            return;
        }
        if (!driveFile.parents?.includes(pending.folderId) || Number(driveFile.size) !== pending.size) {
            await drive.files.delete({ fileId: driveFileId }).catch(() => undefined);
            await pending.deleteOne();
            res.status(400).json({ success: false, message: "Le fichier reçu ne correspond pas à l'upload annoncé" });
            return;
        }

        // Make file public (readable by link, used by previews and downloads)
        await drive.permissions.create({
            fileId: driveFileId,
            requestBody: { role: 'reader', type: 'anyone' },
        });

        // Drive generates thumbnails a few seconds after upload (PPTX often takes longer)
        let thumbnailLink = driveFile.thumbnailLink;
        for (let retries = 0; !thumbnailLink && retries < 3; retries++) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            try {
                thumbnailLink = (await drive.files.get({ fileId: driveFileId, fields: 'thumbnailLink' })).data.thumbnailLink;
            } catch (err) {
                console.error('Failed to refetch thumbnail:', err);
            }
        }

        const file = await File.create({
            fileName: pending.fileName,
            originalName: pending.originalName,
            displayName: pending.originalName, // Preserve accents for display
            fileType: pending.fileType,
            fileSize: pending.size,
            fileUrl: driveFile.webViewLink, // Link to view in Drive
            driveId: driveFileId,
            webViewLink: driveFile.webViewLink,
            webContentLink: driveFile.webContentLink,
            thumbnailLink,
            year: pending.year,
            filiere: pending.filiere,
            semester: pending.semester,
            module: pending.module,
            fileCategory: pending.fileCategory,
            fileLabel: pending.fileLabel,
            uploadedBy: req.user!._id,
        });
        await pending.deleteOne();

        // Log activity
        await ActivityLog.create({
            userId: req.user!._id,
            action: 'upload',
            details: `Uploaded ${file.fileName} to ${file.year} - ${file.filiere} - ${file.semester} - ${file.module}`,
        });

        res.status(201).json({ success: true, message: 'Fichier ajouté', file });
    } catch (error: any) {
        console.error('Upload completion error:', error);
        res.status(500).json({ success: false, message: "Erreur lors de l'enregistrement du fichier" });
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

        const textFields = { fileName, semester, module, fileCategory };
        for (const [field, value] of Object.entries(textFields)) {
            if (value !== undefined && value !== '' && !isNonEmptyString(value)) {
                res.status(400).json({ success: false, message: `Invalid ${field}` });
                return;
            }
        }
        if (fileLabel !== undefined && fileLabel !== '' && !isNonEmptyString(fileLabel)) {
            res.status(400).json({ success: false, message: 'Invalid fileLabel' });
            return;
        }

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

        const { year, filiere, semester, module, fileCategory } = file;

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

        // After deletion, if there are no more files in this (year, filiere, semester, module, category),
        // try to clean up the corresponding Drive folders.
        const remainingInCategory = await File.countDocuments({
            year,
            filiere,
            semester,
            module,
            fileCategory,
        });
        if (remainingInCategory === 0) {
            await deleteCategoryFolderIfEmpty({ filiere, year, semester, module, fileCategory });
        }

        const remainingInModule = await File.countDocuments({
            year,
            filiere,
            semester,
            module,
        });
        if (remainingInModule === 0) {
            await deleteModuleFolderAndPruneAncestors({ filiere, year, semester, module });
        }

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
        });
    }
};

// @desc    Sync thumbnails from Google Drive for files missing them
// @route   GET /api/files/sync-thumbnails
// @access  Private (Superadmin only) - for debugging/maintenance
export const syncThumbnails = async (req: AuthRequest, res: Response): Promise<void> => {

    try {

        // Find files with driveId but no thumbnailLink
        const filesToSync = await File.find({
            driveId: { $exists: true, $ne: null },
            $or: [
                { thumbnailLink: { $exists: false } },
                { thumbnailLink: null },
                { thumbnailLink: '' }
            ]
        }).limit(50); // Process in batches

        const results = [];

        for (const file of filesToSync) {
            try {
                // Fetch file metadata from Drive
                const driveFile = await drive.files.get({
                    fileId: file.driveId!,
                    fields: 'thumbnailLink, hasThumbnail, id, name, mimeType'
                });


                if (driveFile.data.thumbnailLink) {
                    file.thumbnailLink = driveFile.data.thumbnailLink;
                    await file.save();
                    results.push({ id: file._id, name: file.fileName, status: 'Updated', link: 'Found' });
                } else {
                    results.push({ id: file._id, name: file.fileName, status: 'Skipped', link: 'Not found in Drive' });
                }
            } catch (err: any) {
                console.error(`Error syncing file ${file.fileName}:`, err.message);
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
        });
    }
};
