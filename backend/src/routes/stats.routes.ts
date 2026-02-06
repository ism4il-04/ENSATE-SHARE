import { Router } from 'express';
import {
    getDashboardStats,
    getFilesByFiliere,
    getActivityLogs,
} from '../controllers/stats.controller';
import { requireSuperadmin } from '../middleware/auth.middleware';

const router = Router();

// All routes require superadmin role
router.use(requireSuperadmin);

router.get('/dashboard', getDashboardStats);
router.get('/files-by-filiere', getFilesByFiliere);
router.get('/logs', getActivityLogs);

export default router;
