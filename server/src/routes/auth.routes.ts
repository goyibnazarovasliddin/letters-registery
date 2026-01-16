import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', AuthController.login);
router.post('/change-password', authenticateToken, AuthController.changePassword);
router.get('/me', authenticateToken, AuthController.getMe);

export default router;
