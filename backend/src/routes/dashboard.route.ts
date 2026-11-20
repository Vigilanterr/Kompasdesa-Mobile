/**
 * @openapi
 * /api/dashboard:
 *   get:
 *     tags: [Dashboard]
 *     summary: Statistik dashboard (khusus petani)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Data dashboard
 */
import { Router } from 'express';
import { authMiddleware, role } from '../middleware/auth.middleware';
import { getDashboard } from '../controllers/dashboard.controller';

const router = Router();

router.get('/dashboard', authMiddleware, role('petani'), getDashboard);

export default router;
