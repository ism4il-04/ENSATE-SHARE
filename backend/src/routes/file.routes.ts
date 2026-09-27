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
import { requireAuth, requireLogin, requireSuperadmin } from '../middleware/auth.middleware';
import upload from '../middleware/upload.middleware';

const router = Router();

// Reading documents requires any signed-in account (students, responsables, admins)
router.get('/', requireLogin, getFiles);
router.get('/sync-thumbnails', requireSuperadmin, syncThumbnails);
router.get('/:id', requireLogin, getFileById);
router.get('/:id/download', requireLogin, downloadFile);

// Managing documents requires a responsable or superadmin
router.post('/', requireAuth, upload.single('file'), uploadFile);
router.put('/:id', requireAuth, updateFile);
router.delete('/:id', requireAuth, deleteFile);

export default router;
