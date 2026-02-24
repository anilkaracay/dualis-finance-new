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

vi.mock('../../services/compositeCredit.service.js', () => ({
  getCompositeScore: vi.fn(() => ({
    tier: 'Gold',
    totalScore: 750,
    benefits: { rateDiscount: 0.15, maxLTV: 0.78 },
  })),
}));

import Fastify from 'fastify';
import jwt from 'jsonwebtoken';
import { borrowRoutes } from '../../routes/borrow';

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
  await app.register(borrowRoutes);
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('Borrow Routes', () => {
  describe('GET /borrow/collateral-assets', () => {
    it('returns 200 with asset list (no auth)', async () => {
      const res = await app.inject({ method: 'GET', url: '/borrow/collateral-assets' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body).toHaveProperty('data');
      expect(body.data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /borrow/request', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/borrow/request',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          lendingPoolId: 'usdc-main',
          borrowAmount: '1000',
          collateralAssets: [{ symbol: 'ETH', amount: '10' }],
        }),
      });
      expect(res.statusCode).toBe(401);
    });
    it('returns 201 with valid borrow', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/borrow/request',
        headers: { 'content-type': 'application/json', ...authHeader() },
        body: JSON.stringify({
          lendingPoolId: 'usdc-main',
          borrowAmount: '1000',
          collateralAssets: [{ symbol: 'ETH', amount: '10' }],
        }),
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.data).toHaveProperty('borrowPositionId');
    });
    it('returns 400 for missing fields', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/borrow/request',
        headers: { 'content-type': 'application/json', ...authHeader() },
        body: JSON.stringify({ lendingPoolId: 'usdc-main' }),
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /borrow/positions', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({ method: 'GET', url: '/borrow/positions' });
      expect(res.statusCode).toBe(401);
    });
    it('returns 200 with positions', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/borrow/positions',
        headers: authHeader(),
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /borrow/positions/:id/repay', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/borrow/positions/borrow-pos-001/repay',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ amount: '100' }),
      });
      expect(res.statusCode).toBe(401);
    });
    it('returns 200 with valid repay', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/borrow/positions/borrow-pos-001/repay',
        headers: { 'content-type': 'application/json', ...authHeader() },
        body: JSON.stringify({ amount: '100' }),
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /borrow/positions/:id/add-collateral', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/borrow/positions/borrow-pos-001/add-collateral',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ asset: { symbol: 'ETH', amount: '1' } }),
      });
      expect(res.statusCode).toBe(401);
    });
    it('returns 200 with valid request', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/borrow/positions/borrow-pos-001/add-collateral',
        headers: { 'content-type': 'application/json', ...authHeader() },
        body: JSON.stringify({ asset: { symbol: 'ETH', amount: '1' } }),
      });
      expect(res.statusCode).toBe(200);
    });
  });
});
