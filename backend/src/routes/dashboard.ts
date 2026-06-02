import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { authenticateJwt } from '../middleware/auth';

const router = Router();
router.get('/stats', authenticateJwt, getDashboardStats);
export default router;
