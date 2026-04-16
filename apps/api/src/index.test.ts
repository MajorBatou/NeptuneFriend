import { describe, it, expect, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { register, login, users } from '../controllers/authController';

function mockRes() {
  const res = {
    status: function (code: number) {
      this._status = code;
      return this;
    },
    json: function (data: unknown) {
      this._data = data;
      return this;
    },
    _status: 200,
    _data: null as unknown,
  };
  return res as unknown as Response & { _status: number; _data: unknown };
}

function mockReq(body: unknown): Request {
  return { body, ip: '127.0.0.1' } as Request;
}

describe('Auth Controller', () => {
  beforeEach(() => {
    // Clear users between tests
    users.length = 0;
  });

  describe('register', () => {
    it('creates a new user successfully', async () => {
      const req = mockReq({
        name: 'Test Sailor',
        email: 'sailor@test.com',
        password: 'password123',
      });
      const res = mockRes();
      await register(req, res);
      expect(res._status).toBe(201);
      expect((res._data as { data: { user: { email: string } } }).data.user.email).toBe(
        'sailor@test.com'
      );
    });

    it('returns 409 for duplicate email', async () => {
      const req = mockReq({ name: 'Test', email: 'sailor@test.com', password: 'password123' });
      await register(req, mockRes());
      const res = mockRes();
      await register(req, res);
      expect(res._status).toBe(409);
    });

    it('returns 400 for invalid email', async () => {
      const req = mockReq({ name: 'Test', email: 'not-an-email', password: 'password123' });
      const res = mockRes();
      await register(req, res);
      expect(res._status).toBe(400);
    });

    it('returns 400 for short password', async () => {
      const req = mockReq({ name: 'Test', email: 'test@test.com', password: 'short' });
      const res = mockRes();
      await register(req, res);
      expect(res._status).toBe(400);
    });

    it('does not return passwordHash in response', async () => {
      const req = mockReq({ name: 'Test', email: 'test@test.com', password: 'password123' });
      const res = mockRes();
      await register(req, res);
      const user = (res._data as { data: { user: Record<string, unknown> } }).data.user;
      expect(user.passwordHash).toBeUndefined();
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      const req = mockReq({
        name: 'Test Sailor',
        email: 'sailor@test.com',
        password: 'password123',
      });
      await register(req, mockRes());
    });

    it('logs in with valid credentials', async () => {
      const req = mockReq({ email: 'sailor@test.com', password: 'password123' });
      const res = mockRes();
      await login(req, res);
      expect(res._status).toBe(200);
      expect((res._data as { data: { token: string } }).data.token).toBeDefined();
    });

    it('returns 401 for wrong password', async () => {
      const req = mockReq({ email: 'sailor@test.com', password: 'wrongpassword' });
      const res = mockRes();
      await login(req, res);
      expect(res._status).toBe(401);
    });

    it('returns 401 for unknown email', async () => {
      const req = mockReq({ email: 'unknown@test.com', password: 'password123' });
      const res = mockRes();
      await login(req, res);
      expect(res._status).toBe(401);
    });
  });
});
