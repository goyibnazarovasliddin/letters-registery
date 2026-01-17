import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateToken, getSettings);
router.put('/', authenticateToken, updateSettings);

export default router;
