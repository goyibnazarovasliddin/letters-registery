import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import departmentsRoutes from './departments.routes';
import indicesRoutes from './indices.routes';
import lettersRoutes from './letters.routes';
import settingsRoutes from './settings.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/departments', departmentsRoutes);
router.use('/indices', indicesRoutes);
router.use('/letters', lettersRoutes);
router.use('/settings', settingsRoutes);

export default router;
