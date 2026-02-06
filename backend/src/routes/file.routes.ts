import { Router } from 'express';
import {
    getFiles,
    getFileById,
    uploadFile,
    updateFile,
    deleteFile,
    downloadFile,
} from '../controllers/file.controller';
import { requireAuth } from '../middleware/auth.middleware';
import upload from '../middleware/upload.middleware';

const router = Router();

// Public routes
router.get('/', getFiles);
router.get('/:id', getFileById);
router.get('/:id/download', downloadFile);

// Protected routes
router.post('/', requireAuth, upload.single('file'), uploadFile);
router.put('/:id', requireAuth, updateFile);
router.delete('/:id', requireAuth, deleteFile);

export default router;
