import { Router } from 'express';
import { franchiseService } from '../services/franchiseService';
import { authenticateJwt } from '../middleware/auth';

const router = Router();

router.post('/', authenticateJwt, async (req, res) => {
  try {
    const franchise = await franchiseService.createFranchise(req.body);
    res.status(201).json({ data: franchise });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.get('/', authenticateJwt, async (_req, res) => {
  try {
    const franchises = await franchiseService.listFranchises();
    res.json({ data: franchises });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.get('/:franchiseId', authenticateJwt, async (req, res) => {
  try {
    const franchise = await franchiseService.getFranchise(req.params.franchiseId);
    res.json({ data: franchise });
  } catch (error) {
    res.status(404).json({ error: 'Franchise not found' });
  }
});

router.get('/:franchiseId/stats', authenticateJwt, async (req, res) => {
  try {
    const stats = await franchiseService.getFranchiseStats(req.params.franchiseId);
    res.json({ data: stats });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export default router;
