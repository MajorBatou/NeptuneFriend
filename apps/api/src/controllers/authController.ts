import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { UserModel } from './userModel.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
});

function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
}

export async function register(req: Request, res: Response) {
  try {
    const body = registerSchema.parse(req.body);
    const existing = await UserModel.findByEmail(body.email);
    if (existing) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email already exists',
        statusCode: 409,
        timestamp: new Date().toISOString(),
      });
    }
    const user = await UserModel.create({
      name: body.name,
      email: body.email,
      password: body.password,
    });
    const safeUser = await UserModel.toSafeUser(user);
    const token = generateToken(user.id);
    return res.status(201).json({
      data: {
        user: safeUser,
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
    const user = await UserModel.findByEmail(body.email);
    if (!user || !(await UserModel.verifyPassword(user, body.password))) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      });
    }
    const safeUser = await UserModel.toSafeUser(user);
    const token = generateToken(user.id);
    return res.json({
      data: {
        user: safeUser,
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
  if (!userId)
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Not authenticated',
      statusCode: 401,
      timestamp: new Date().toISOString(),
    });
  const user = await UserModel.findById(userId);
  if (!user)
    return res.status(404).json({
      error: 'Not found',
      message: 'User not found',
      statusCode: 404,
      timestamp: new Date().toISOString(),
    });
  const safeUser = await UserModel.toSafeUser(user);
  return res.json({ data: safeUser, timestamp: new Date().toISOString() });
}
