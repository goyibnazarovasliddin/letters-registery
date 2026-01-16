import { Router } from 'express';
import * as Controller from '../controllers/indices.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticateToken);

router.get('/', Controller.listIndices);
router.post('/', Controller.createIndex);
router.put('/:id', Controller.updateIndex);
router.delete('/:id', Controller.deleteIndex);
router.patch('/:id/status', Controller.updateStatus);
router.delete('/:id/permanent', Controller.permanentDelete);

export default router;
