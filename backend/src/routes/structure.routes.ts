import { Router } from 'express';
import { getStructure, updateStructure } from '../controllers/structure.controller';
import { requireSuperadmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getStructure);
router.put('/', requireSuperadmin, updateStructure);

export default router;
