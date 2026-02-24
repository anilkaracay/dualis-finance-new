import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

vi.mock('../../config/logger.js', () => ({
  createChildLogger: () => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  }),
}));

vi.mock('../../db/client.js', () => ({
  getDb: vi.fn(() => null),
  schema: {},
}));

vi.mock('../../cache/redis.js', () => ({
  getRedis: vi.fn(() => null),
}));

vi.mock('../../config/env.js', () => ({
  env: { CANTON_MOCK: true, CANTON_ENV: 'sandbox' },
}));

import Fastify from 'fastify';
import { healthRoutes } from '../../routes/health';

let app: ReturnType<typeof Fastify>;

beforeAll(async () => {
  app = Fastify();
  await app.register(healthRoutes);
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('Health Routes', () => {
  describe('GET /health', () => {
    it('returns 200 with healthy status', async () => {
      const res = await app.inject({ method: 'GET', url: '/health' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.status).toBe('healthy');
      expect(body).toHaveProperty('version');
      expect(body).toHaveProperty('uptime');
    });
  });

  describe('GET /health/ready', () => {
    it('returns readiness info', async () => {
      const res = await app.inject({ method: 'GET', url: '/health/ready' });
      const body = JSON.parse(res.body);
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('dependencies');
    });
  });

  describe('GET /health/detailed', () => {
    it('returns detailed system info', async () => {
      const res = await app.inject({ method: 'GET', url: '/health/detailed' });
      const body = JSON.parse(res.body);
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('memory');
      expect(body).toHaveProperty('dependencies');
    });
  });
});
