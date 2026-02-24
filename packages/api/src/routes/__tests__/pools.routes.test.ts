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
  schema: { apiKeys: {} },
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
import { poolRoutes } from '../../routes/pools';

const TEST_SECRET = 'test-secret-32chars-for-jwt!!!!!';
let app: ReturnType<typeof Fastify>;

function authHeader() {
  const token = jwt.sign(
    { sub: 'usr-001', partyId: 'party::test', role: 'retail', jti: 'jti-1' },
    TEST_SECRET,
    { expiresIn: '15m' },
  );
  return { authorization: `Bearer ${token}` };
}

beforeAll(async () => {
  app = Fastify();
  await app.register(poolRoutes);
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('Pool Routes', () => {
  describe('GET /pools', () => {
    it('returns 200 with pool list', async () => {
      const res = await app.inject({ method: 'GET', url: '/pools' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });
    it('accepts assetType filter', async () => {
      const res = await app.inject({ method: 'GET', url: '/pools?assetType=stablecoin' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      body.data.forEach((p: any) => expect(p.asset.type).toBe('Stablecoin'));
    });
    it('returns pagination', async () => {
      const res = await app.inject({ method: 'GET', url: '/pools' });
      const body = JSON.parse(res.body);
      expect(body).toHaveProperty('pagination');
      expect(body.pagination).toHaveProperty('total');
    });
  });

  describe('GET /pools/:poolId', () => {
    it('returns 200 for valid pool', async () => {
      const res = await app.inject({ method: 'GET', url: '/pools/usdc-main' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.poolId).toBe('usdc-main');
    });
    it('returns 404 for non-existent pool', async () => {
      const res = await app.inject({ method: 'GET', url: '/pools/fake-pool' });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /pools/:poolId/history', () => {
    it('returns 200 with history', async () => {
      const res = await app.inject({ method: 'GET', url: '/pools/usdc-main/history' });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /pools/:poolId/deposit', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/pools/usdc-main/deposit',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ amount: '1000' }),
      });
      expect(res.statusCode).toBe(401);
    });
    it('returns 201 with valid auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/pools/usdc-main/deposit',
        headers: { 'content-type': 'application/json', ...authHeader() },
        body: JSON.stringify({ amount: '1000' }),
      });
      expect(res.statusCode).toBe(201);
    });
  });

  describe('POST /pools/:poolId/withdraw', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/pools/usdc-main/withdraw',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ shares: '100' }),
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /pools/:poolId/rate-curve', () => {
    it('returns 200 with curve data', async () => {
      const res = await app.inject({ method: 'GET', url: '/pools/usdc-main/rate-curve' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toHaveProperty('curve');
      expect(body.data.curve.length).toBe(101);
    });
  });
});
