import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

vi.mock('../../config/logger.js', () => ({
  createChildLogger: () => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  }),
}));

vi.mock('../../config/env.js', () => ({
  env: { JWT_SECRET: 'test-secret-32chars-for-jwt!!!!!' },
}));

vi.mock('../../db/client.js', () => ({
  getDb: vi.fn(() => null),
  schema: { apiKeys: {}, audit_logs: {} },
}));

vi.mock('../../cache/redis.js', () => ({
  getRedis: vi.fn(() => null),
}));

vi.mock('../../security/session.js', () => ({
  isTokenBlacklisted: vi.fn(async () => false),
}));

vi.mock('../../services/institutional.service.js', () => ({
  getInstitutionStatus: vi.fn(() => null),
}));

vi.mock('../../services/privacy.service.js', () => ({
  getPrivacyConfig: vi.fn(() => ({ privacyLevel: 'Selective' })),
}));

import Fastify from 'fastify';
import jwt from 'jsonwebtoken';
import { adminDashboardRoutes } from '../../routes/admin-dashboard';
import { adminPoolRoutes } from '../../routes/admin-pools';
import { adminUserRoutes } from '../../routes/admin-users';

const TEST_SECRET = 'test-secret-32chars-for-jwt!!!!!';
let app: ReturnType<typeof Fastify>;

function adminToken() {
  return jwt.sign(
    { sub: 'usr-admin', partyId: 'party::admin', role: 'admin', jti: 'jti-admin' },
    TEST_SECRET,
    { expiresIn: '15m' },
  );
}
function retailToken() {
  return jwt.sign(
    { sub: 'usr-001', partyId: 'party::test', role: 'retail', jti: 'jti-1' },
    TEST_SECRET,
    { expiresIn: '15m' },
  );
}

beforeAll(async () => {
  app = Fastify();
  await app.register(adminDashboardRoutes);
  await app.register(adminPoolRoutes);
  await app.register(adminUserRoutes);
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('Admin Routes', () => {
  describe('Admin Dashboard', () => {
    it('GET /admin/dashboard/stats requires admin auth', async () => {
      const res = await app.inject({ method: 'GET', url: '/admin/dashboard/stats' });
      expect(res.statusCode).toBe(401);
    });
    it('GET /admin/dashboard/stats returns 200 for admin', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/admin/dashboard/stats',
        headers: { authorization: `Bearer ${adminToken()}` },
      });
      expect(res.statusCode).toBe(200);
    });
    it('returns 403 for non-admin', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/admin/dashboard/stats',
        headers: { authorization: `Bearer ${retailToken()}` },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('Admin Pools', () => {
    it('GET /admin/pools requires admin auth', async () => {
      const res = await app.inject({ method: 'GET', url: '/admin/pools' });
      expect(res.statusCode).toBe(401);
    });
    it('GET /admin/pools returns 200 for admin', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/admin/pools',
        headers: { authorization: `Bearer ${adminToken()}` },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toHaveProperty('data');
      expect(body.data.data.length).toBeGreaterThan(0);
    });
    it('GET /admin/pools/:poolId returns pool', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/admin/pools/usdc-main',
        headers: { authorization: `Bearer ${adminToken()}` },
      });
      expect(res.statusCode).toBe(200);
    });
    it('POST /admin/pools/:poolId/pause requires admin', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/admin/pools/usdc-main/pause',
        headers: { authorization: `Bearer ${retailToken()}` },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('Admin Users', () => {
    it('GET /admin/users requires auth', async () => {
      const res = await app.inject({ method: 'GET', url: '/admin/users' });
      expect(res.statusCode).toBe(401);
    });
    it('GET /admin/users returns 200 for admin', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/admin/users',
        headers: { authorization: `Bearer ${adminToken()}` },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toHaveProperty('data');
      expect(body.data.data.length).toBeGreaterThan(0);
    });
    it('returns 403 for retail user', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/admin/users',
        headers: { authorization: `Bearer ${retailToken()}` },
      });
      expect(res.statusCode).toBe(403);
    });
  });
});
