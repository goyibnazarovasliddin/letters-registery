import { Router } from 'express';
import * as Controller from '../controllers/letters.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();
router.use(authenticateToken);

const uploadFields = upload.fields([
    { name: 'xatFile', maxCount: 1 },
    { name: 'ilovaFiles', maxCount: 10 }
]);

router.get('/', Controller.listLetters);
router.post('/', uploadFields, Controller.createLetter);
router.post('/:id/register', Controller.registerLetter);
router.get('/:id', Controller.getLetter);
router.get('/files/:id/download', Controller.downloadFile);

export default router;
