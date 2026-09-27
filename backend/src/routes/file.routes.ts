import { Router } from 'express';
import {
    getFiles,
    getFileById,
    createUploadSession,
    completeUpload,
    updateFile,
    deleteFile,
    downloadFile,
    syncThumbnails,
} from '../controllers/file.controller';
import { requireAuth, requireLogin, requireSuperadmin } from '../middleware/auth.middleware';

const router = Router();

// Reading documents requires any signed-in account (students, responsables, admins)
router.get('/', requireLogin, getFiles);
router.get('/sync-thumbnails', requireSuperadmin, syncThumbnails);
router.get('/:id', requireLogin, getFileById);
router.get('/:id/download', requireLogin, downloadFile);

// Managing documents requires a responsable or superadmin
// Uploads go straight from the browser to Google Drive (Vercel caps request bodies at 4.5 MB)
router.post('/upload-session', requireAuth, createUploadSession);
router.post('/upload-complete', requireAuth, completeUpload);
router.put('/:id', requireAuth, updateFile);
router.delete('/:id', requireAuth, deleteFile);

export default router;
