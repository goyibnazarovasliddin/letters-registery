import { Router } from 'express';
import * as Controller from '../controllers/departments.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticateToken);

router.get('/', Controller.listDepartments);
router.post('/', Controller.createDepartment);
router.put('/:id', Controller.updateDepartment);
router.delete('/:id', Controller.deleteDepartment);
router.patch('/:id/status', Controller.updateStatus);
router.delete('/:id/permanent', Controller.permanentDelete);

export default router;
