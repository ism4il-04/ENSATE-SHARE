import { Router } from 'express';
import { login, logout, getMe } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;
