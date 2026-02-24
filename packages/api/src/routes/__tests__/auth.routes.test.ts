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
  schema: { apiKeys: {}, audit_logs: {}, adminAuditLogs: {} },
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

// Mock auth service — all functions
const mockSession = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresIn: 900,
  user: { userId: 'usr-001', email: 'test@example.com', role: 'retail', partyId: 'party::test' },
};

vi.mock('../../services/auth.service.js', () => ({
  registerRetail: vi.fn(async () => mockSession),
  registerInstitutional: vi.fn(async () => ({ ...mockSession, institutionId: 'inst-001' })),
  loginWithEmail: vi.fn(async () => mockSession),
  generateWalletNonce: vi.fn(async () => ({ nonce: 'nonce-abc', expiresAt: new Date().toISOString() })),
  loginWithWallet: vi.fn(async () => ({ ...mockSession, isNewUser: false })),
  refreshSession: vi.fn(async () => mockSession),
  logoutByRefreshToken: vi.fn(async () => {}),
  logoutAll: vi.fn(async () => {}),
  getUserById: vi.fn(async () => ({
    userId: 'usr-001',
    email: 'test@example.com',
    role: 'retail',
    partyId: 'party::test',
    displayName: 'Test User',
    emailVerified: true,
    createdAt: new Date().toISOString(),
  })),
  verifyEmail: vi.fn(async () => ({ verified: true })),
  requestPasswordReset: vi.fn(async () => ({ sent: true })),
  resetPassword: vi.fn(async () => ({ reset: true })),
  linkWallet: vi.fn(async () => ({ linked: true })),
  getUserSessions: vi.fn(async () => [
    { sessionId: 'sess-001', createdAt: new Date().toISOString(), lastActive: new Date().toISOString() },
  ]),
  revokeSession: vi.fn(async () => {}),
}));

vi.mock('../../security/brute-force.js', () => ({
  checkBruteForce: vi.fn(async () => ({ allowed: true })),
  recordFailedAttempt: vi.fn(async () => {}),
  resetBruteForce: vi.fn(async () => {}),
}));

import Fastify from 'fastify';
import jwt from 'jsonwebtoken';
import { authRoutes } from '../../routes/auth';

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
  await app.register(authRoutes);
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('Auth Routes', () => {
  describe('GET /auth/csrf-token', () => {
    it('returns 200 with csrf token', async () => {
      const res = await app.inject({ method: 'GET', url: '/auth/csrf-token' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toHaveProperty('csrfToken');
    });
  });

  describe('POST /auth/register/retail', () => {
    it('returns 201 with valid registration', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/register/retail',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'new@example.com', password: 'securepass123' }),
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.data).toHaveProperty('accessToken');
    });
    it('returns 400 for invalid email', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/register/retail',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email', password: 'securepass123' }),
      });
      expect(res.statusCode).toBe(400);
    });
    it('returns 400 for short password', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/register/retail',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'valid@example.com', password: 'short' }),
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /auth/register/institutional', () => {
    it('returns 201 with valid data', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/register/institutional',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'inst@example.com',
          password: 'securepass123',
          companyName: 'Acme Corp',
          repFirstName: 'John',
          repLastName: 'Doe',
          repTitle: 'CEO',
        }),
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.data).toHaveProperty('institutionId');
    });
    it('returns 400 for missing companyName', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/register/institutional',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'inst@example.com',
          password: 'securepass123',
          repFirstName: 'John',
          repLastName: 'Doe',
          repTitle: 'CEO',
        }),
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('returns 200 with valid credentials', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'securepass123' }),
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toHaveProperty('accessToken');
    });
    it('returns 400 for missing password', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /auth/wallet/nonce', () => {
    it('returns 200 with valid wallet address', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/wallet/nonce',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ walletAddress: '0x1234567890abcdef1234567890abcdef12345678' }),
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toHaveProperty('nonce');
    });
    it('returns 400 for short wallet address', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/wallet/nonce',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ walletAddress: '0x123' }),
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /auth/wallet/verify', () => {
    it('returns 200 with valid verification', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/wallet/verify',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
          signature: 'mock-sig-123',
          nonce: 'nonce-abc',
        }),
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /auth/refresh', () => {
    it('returns 200 with valid refresh token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'valid-refresh-token' }),
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toHaveProperty('accessToken');
    });
    it('returns 400 for missing refresh token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /auth/logout', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({ method: 'POST', url: '/auth/logout' });
      expect(res.statusCode).toBe(401);
    });
    it('returns 200 with auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: authHeader(),
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /auth/me', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({ method: 'GET', url: '/auth/me' });
      expect(res.statusCode).toBe(401);
    });
    it('returns 200 with auth', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: authHeader(),
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toHaveProperty('email');
    });
  });

  describe('POST /auth/verify-email', () => {
    it('returns 200 with valid token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/verify-email',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: 'verify-token-123' }),
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('returns 200 with valid email', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/forgot-password',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /auth/reset-password', () => {
    it('returns 200 with valid data', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/reset-password',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: 'reset-token-123', newPassword: 'newSecurePass123' }),
      });
      expect(res.statusCode).toBe(200);
    });
    it('returns 400 for short password', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/reset-password',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: 'reset-token-123', newPassword: 'short' }),
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /auth/link-wallet', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/link-wallet',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
          signature: 'sig-123',
          nonce: 'nonce-abc',
        }),
      });
      expect(res.statusCode).toBe(401);
    });
    it('returns 200 with auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/link-wallet',
        headers: { 'content-type': 'application/json', ...authHeader() },
        body: JSON.stringify({
          walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
          signature: 'sig-123',
          nonce: 'nonce-abc',
        }),
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /auth/sessions', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({ method: 'GET', url: '/auth/sessions' });
      expect(res.statusCode).toBe(401);
    });
    it('returns 200 with auth', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/auth/sessions',
        headers: authHeader(),
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /auth/sessions/:sessionId', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({ method: 'DELETE', url: '/auth/sessions/sess-001' });
      expect(res.statusCode).toBe(401);
    });
    it('returns 200 with auth', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/auth/sessions/sess-001',
        headers: authHeader(),
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /auth/revoke-all-sessions', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({ method: 'POST', url: '/auth/revoke-all-sessions' });
      expect(res.statusCode).toBe(401);
    });
    it('returns 200 with auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/revoke-all-sessions',
        headers: authHeader(),
      });
      expect(res.statusCode).toBe(200);
    });
  });
});
