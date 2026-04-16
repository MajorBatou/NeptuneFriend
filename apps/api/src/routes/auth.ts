import { Router } from 'express';
import { register, login, getMe } from '@/controllers/authController';
import { authMiddleware } from '@/middleware/auth';
import { authRateLimit } from '@/middleware/rateLimit';

const router = Router();

// POST /auth/register
router.post('/register', authRateLimit, register);

// POST /auth/login
router.post('/login', authRateLimit, login);

// GET /auth/me — protected
router.get('/me', authMiddleware, getMe);

export default router;
