import { Router } from 'express';
import {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
} from '../controllers/user.controller';
import { requireSuperadmin } from '../middleware/auth.middleware';

const router = Router();

// All routes require superadmin role
router.use(requireSuperadmin);

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
