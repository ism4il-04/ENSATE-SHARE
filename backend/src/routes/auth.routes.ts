import { Router } from 'express';
import { login, googleLogin, logout, getMe, updateProfile } from '../controllers/auth.controller';
import { optionalAuth, protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/google', googleLogin);
router.post('/logout', protect, logout);
router.get('/me', optionalAuth, getMe); // user: null when not logged in
router.put('/profile', protect, updateProfile);

export default router;
