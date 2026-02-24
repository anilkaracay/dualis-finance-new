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
import { secLendingRoutes } from '../../routes/secLending';

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
  await app.register(secLendingRoutes);
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('SecLending Routes', () => {
  describe('GET /sec-lending/offers', () => {
    it('returns 200 with offers', async () => {
      const res = await app.inject({ method: 'GET', url: '/sec-lending/offers' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body).toHaveProperty('data');
      expect(body.data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /sec-lending/offers', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/sec-lending/offers',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          security: { symbol: 'GOOG', amount: '1000' },
          feeType: 'fixed',
          feeValue: 0.30,
          acceptedCollateralTypes: ['cash'],
          initialMarginPercent: 105,
          minLendDuration: 7,
          isRecallable: true,
          recallNoticeDays: 3,
        }),
      });
      expect(res.statusCode).toBe(401);
    });
    it('returns 201 with valid request', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/sec-lending/offers',
        headers: { 'content-type': 'application/json', ...authHeader() },
        body: JSON.stringify({
          security: { symbol: 'GOOG', amount: '1000' },
          feeType: 'fixed',
          feeValue: 0.30,
          acceptedCollateralTypes: ['cash'],
          initialMarginPercent: 105,
          minLendDuration: 7,
          isRecallable: true,
          recallNoticeDays: 3,
        }),
      });
      expect(res.statusCode).toBe(201);
    });
  });

  describe('GET /sec-lending/deals', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({ method: 'GET', url: '/sec-lending/deals' });
      expect(res.statusCode).toBe(401);
    });
    it('returns 200 with auth', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/sec-lending/deals',
        headers: authHeader(),
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /sec-lending/stats', () => {
    it('returns 200 with stats', async () => {
      const res = await app.inject({ method: 'GET', url: '/sec-lending/stats' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toHaveProperty('totalOffers');
    });
  });
});
