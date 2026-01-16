import { Router } from 'express';
import * as UsersController from '../controllers/users.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken); // Protect all routes

router.get('/', UsersController.listUsers);
router.post('/', UsersController.createUser);
router.put('/:id', UsersController.updateUser);
router.delete('/:id', UsersController.deleteUser);
router.patch('/:id/status', UsersController.updateStatus);
router.delete('/:id/permanent', UsersController.permanentDelete);
router.post('/:id/reset-password', UsersController.resetPassword);

export default router;
