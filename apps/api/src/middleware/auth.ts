import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
}

export interface AuthRequest extends Request {
  userId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid authorization header',
      statusCode: 401,
      timestamp: new Date().toISOString(),
    });
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
      statusCode: 401,
      timestamp: new Date().toISOString(),
    });
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.userId = payload.userId;
  } catch {
    // Ignore invalid token for optional auth
  }

  next();
}
