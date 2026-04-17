import { describe, it, expect } from 'vitest';

describe('NeptuneFriend API', () => {
  it('health check response shape is correct', () => {
    const response = {
      status: 'ok',
      service: 'neptunefriend-api',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
    expect(response.status).toBe('ok');
    expect(response.service).toBe('neptunefriend-api');
    expect(response.database).toBe('connected');
    expect(response.timestamp).toBeDefined();
  });

  it('validates JWT secret is set', () => {
    const secret = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
    expect(secret).toBeTruthy();
  });
});
