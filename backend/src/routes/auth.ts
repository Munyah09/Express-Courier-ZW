import { Router } from 'express';
import { signIn, refreshToken } from '../controllers/authController';

const router = Router();

router.post('/login', signIn);
router.post('/refresh', refreshToken);

export default router;
