import { Response } from 'express';
import File from '../models/File.model';
import ActivityLog from '../models/ActivityLog.model';
import cloudinary from '../config/cloudinary';
import { AuthRequest } from '../middleware/auth.middleware';
import path from 'path';

// @desc    Upload a file
// @route   POST /api/files
// @access  Private (Responsable/Superadmin)
export const uploadFile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        console.log('📤 Upload request received');
        console.log('User:', req.user?.email, 'Role:', req.user?.role);
        console.log('Body:', req.body);
        console.log('File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');

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

        const { module } = req.body;

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
            console.log('📋 Responsable upload:', { year, filiere, module });
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
            console.log('👑 Superadmin upload:', { year, filiere, module });
        }

        // Upload to Cloudinary
        console.log('☁️ Uploading to Cloudinary...');
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        const result = await cloudinary.uploader.upload(dataURI, {
            folder: `ensate-share/${year}/${filiere}/${module}`,
            resource_type: 'auto',
        });
        console.log('✅ Cloudinary upload successful:', result.public_id);

        // Get file extension
        const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');

        // Create file document
        console.log('💾 Saving to database...');
        const file = await File.create({
            fileName: req.file.originalname,
            originalName: req.file.originalname,
            fileType: ext,
            fileSize: req.file.size,
            fileUrl: result.secure_url,
            publicId: result.public_id,
            year,
            filiere,
            module,
            uploadedBy: req.user._id,
        });
        console.log('✅ File saved to database:', file._id);

        // Log activity
        await ActivityLog.create({
            userId: req.user._id,
            action: 'upload',
            details: `Uploaded ${file.fileName} to ${year} - ${filiere} - ${module}`,
        });

        res.status(201).json({
            success: true,
            message: 'File uploaded successfully',
            file,
        });
    } catch (error: any) {
        console.error('❌ Upload error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            success: false,
            message: 'Error uploading file',
            error: error.message,
        });
    }
};
