import { Router } from 'express';
import { listManifests, getManifest, createManifest, updateManifestStatus } from '../controllers/manifestController';
import { authenticateJwt } from '../middleware/auth';

const router = Router();

router.get('/', authenticateJwt, listManifests);
router.post('/', authenticateJwt, createManifest);
router.get('/:manifestId', authenticateJwt, getManifest);
router.patch('/:manifestId/status', authenticateJwt, updateManifestStatus);

export default router;
