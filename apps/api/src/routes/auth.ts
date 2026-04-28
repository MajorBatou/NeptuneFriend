import { Router, Request, Response } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { register, login, getMe } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { authRateLimit } from '../middleware/rateLimit.js';
import type { User } from '../controllers/userModel.js';

const router = Router();

function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
}

// Standard auth routes
router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);
router.get('/me', authMiddleware, getMe);

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CORS_ORIGIN ?? 'http://localhost:3000'}/login?error=google_failed`,
  }),
  (req: Request, res: Response) => {
    const user = req.user as User;
    const token = generateToken(user.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Redirect to frontend with token in URL
    const redirectUrl = `${process.env.CORS_ORIGIN ?? 'http://localhost:3000'}/auth/callback?token=${token}&expiresAt=${expiresAt}`;
    res.redirect(redirectUrl);
  }
);

export default router;
