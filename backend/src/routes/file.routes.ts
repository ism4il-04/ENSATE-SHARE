import { Router } from 'express';
import {
    getFiles,
    getFileById,
    uploadFile,
    updateFile,
    deleteFile,
    downloadFile,
    syncThumbnails,
} from '../controllers/file.controller';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import upload from '../middleware/upload.middleware';

const router = Router();

// Public routes (optionalAuth populates req.user for responsable filtering)
router.get('/', optionalAuth, getFiles);
router.get('/sync-thumbnails', syncThumbnails); // Debug route
router.get('/:id', getFileById);
router.get('/:id/download', downloadFile);

// Protected routes
router.post('/', requireAuth, upload.single('file'), uploadFile);
router.put('/:id', requireAuth, updateFile);
router.delete('/:id', requireAuth, deleteFile);

export default router;
