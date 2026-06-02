import { Router } from 'express';
import { createParcel, getParcelById, getParcelByTracking, listParcels, updateParcelStatus, recordParcelEvent } from '../controllers/parcelController';
import { authenticateJwt } from '../middleware/auth';

const router = Router();

router.get('/', authenticateJwt, listParcels);
router.post('/', authenticateJwt, createParcel);
router.get('/detail/:parcelId', authenticateJwt, getParcelById);        // internal – by UUID
router.get('/:trackingNumber', getParcelByTracking);                     // public – customer tracking
router.patch('/:parcelId/status', authenticateJwt, updateParcelStatus);
router.post('/:parcelId/events', authenticateJwt, recordParcelEvent);

export default router;
