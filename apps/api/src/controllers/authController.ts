import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
});

// In-memory user store for development — replace with PostgreSQL in Day 18
const users: Array<{
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  favoriteZones: string[];
  preferences: {
    units: string;
    windSpeedUnit: string;
    temperatureUnit: string;
    defaultZoom: number;
    notificationsEnabled: boolean;
  };
}> = [];

function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
}

function sanitizeUser(user: (typeof users)[0]) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safe } = user;
  return safe;
}

export async function register(req: Request, res: Response) {
  try {
    const body = registerSchema.parse(req.body);

    const existing = users.find((u) => u.email === body.email);
    if (existing) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email already exists',
        statusCode: 409,
        timestamp: new Date().toISOString(),
      });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = {
      id: `user-${Date.now()}`,
      name: body.name,
      email: body.email,
      passwordHash,
      favoriteZones: [],
      preferences: {
        units: 'nautical',
        windSpeedUnit: 'knots',
        temperatureUnit: 'celsius',
        defaultZoom: 7,
        notificationsEnabled: true,
      },
    };

    users.push(user);
    const token = generateToken(user.id);

    return res.status(201).json({
      data: {
        user: sanitizeUser(user),
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.errors[0].message,
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
    }
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Registration failed',
      statusCode: 500,
      timestamp: new Date().toISOString(),
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const body = loginSchema.parse(req.body);

    const user = users.find((u) => u.email === body.email);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      });
    }

    const passwordValid = await bcrypt.compare(body.password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      });
    }

    const token = generateToken(user.id);

    return res.json({
      data: {
        user: sanitizeUser(user),
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.errors[0].message,
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
    }
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Login failed',
      statusCode: 500,
      timestamp: new Date().toISOString(),
    });
  }
}

export async function getMe(req: Request, res: Response) {
  const userId = (req as Request & { userId?: string }).userId;
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({
      error: 'Not found',
      message: 'User not found',
      statusCode: 404,
      timestamp: new Date().toISOString(),
    });
  }

  return res.json({
    data: sanitizeUser(user),
    timestamp: new Date().toISOString(),
  });
}

export { users };
