import { Router } from 'express';
import authRouter from './auth';
import parcelRouter from './parcel';
import customerRouter from './customer';
import franchiseRouter from './franchise';
import manifestRouter from './manifest';
import dashboardRouter from './dashboard';
import vehiclesRouter from './vehicles';
import routesRouter from './routes';
import usersRouter from './users';
import reportsRouter from './reports';
import otpRouter from './otp';
import pricingRouter from './pricing';
import custodyRouter from './custody';

const router = Router();

router.use('/auth', authRouter);
router.use('/dashboard', dashboardRouter);
router.use('/parcels', parcelRouter);
router.use('/customers', customerRouter);
router.use('/franchises', franchiseRouter);
router.use('/manifests', manifestRouter);
router.use('/vehicles', vehiclesRouter);
router.use('/routes', routesRouter);
router.use('/users', usersRouter);
router.use('/reports', reportsRouter);
router.use('/parcels', otpRouter);   // /parcels/:id/generate, /verify, /status
router.use('/pricing', pricingRouter);
router.use('/custody', custodyRouter);

router.get('/', (_req, res) => {
  res.json({ service: 'Mufasa Express API', version: '0.1.0' });
});

export default router;
