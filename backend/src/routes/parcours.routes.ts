import { Router } from 'express';
import {
    getSavedParcours,
    addSavedParcours,
    removeSavedParcours,
} from '../controllers/parcours.controller';
import { requireLogin } from '../middleware/auth.middleware';

const router = Router();

// Saved parcours belong to the signed-in user (any role)
router.use(requireLogin);

router.get('/', getSavedParcours);
router.post('/', addSavedParcours);
router.delete('/:id', removeSavedParcours);

export default router;
