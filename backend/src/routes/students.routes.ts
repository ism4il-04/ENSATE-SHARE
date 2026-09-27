import { Router } from 'express';
import {
    getStudentAllowlist,
    importStudentEmails,
    removeStudentEmail,
    clearStudentAllowlist,
} from '../controllers/students.controller';
import { requireSuperadmin } from '../middleware/auth.middleware';

const router = Router();

// Student allowlist management: superadmin only
router.use(requireSuperadmin);

router.get('/', getStudentAllowlist);
router.post('/import', importStudentEmails);
router.delete('/', clearStudentAllowlist);
router.delete('/:id', removeStudentEmail);

export default router;
