import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

const TEST_SECRET = 'test-jwt-secret-for-vitest-32chars!!';

vi.mock('../../config/logger.js', () => ({
  createChildLogger: () => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  }),
}));

vi.mock('../../config/env.js', () => ({
  env: {
    JWT_SECRET: 'test-jwt-secret-for-vitest-32chars!!',
  },
}));

vi.mock('../../db/client.js', () => ({
  getDb: vi.fn(() => null),
  schema: { apiKeys: {} },
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

import { authMiddleware, operatorMiddleware, optionalAuthMiddleware, requireRole } from '../auth';
import { isTokenBlacklisted } from '../../security/session';

function createMockRequest(headers: Record<string, string> = {}) {
  return { headers, user: undefined } as any;
}
const mockReply = {} as any;

function signToken(payload: Record<string, unknown>) {
  return jwt.sign(payload, TEST_SECRET, { expiresIn: '15m' });
}

describe('Auth Middleware', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('Bearer JWT', () => {
    it('populates request.user on valid JWT', async () => {
      const token = signToken({ sub: 'usr-001', partyId: 'party::test', email: 'test@test.com', role: 'retail', jti: 'jti-1' });
      const req = createMockRequest({ authorization: `Bearer ${token}` });
      await authMiddleware(req, mockReply);
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe('usr-001');
      expect(req.user.partyId).toBe('party::test');
      expect(req.user.email).toBe('test@test.com');
      expect(req.user.role).toBe('retail');
    });
    it('throws UNAUTHORIZED on missing header', async () => {
      const req = createMockRequest({});
      await expect(authMiddleware(req, mockReply)).rejects.toThrow(/Authentication required/);
    });
    it('throws UNAUTHORIZED on invalid token', async () => {
      const req = createMockRequest({ authorization: 'Bearer invalid.token.here' });
      await expect(authMiddleware(req, mockReply)).rejects.toThrow(/Invalid or expired/);
    });
    it('throws UNAUTHORIZED on expired token', async () => {
      const token = jwt.sign({ sub: 'usr-001' }, TEST_SECRET, { expiresIn: '-1s' });
      const req = createMockRequest({ authorization: `Bearer ${token}` });
      await expect(authMiddleware(req, mockReply)).rejects.toThrow(/Invalid or expired/);
    });
    it('checks JWT blacklist', async () => {
      const token = signToken({ sub: 'usr-001', jti: 'blacklisted-jti' });
      const req = createMockRequest({ authorization: `Bearer ${token}` });
      vi.mocked(isTokenBlacklisted).mockResolvedValueOnce(true);
      await expect(authMiddleware(req, mockReply)).rejects.toThrow(/revoked/);
    });
  });

  describe('operatorMiddleware', () => {
    it('allows operator party', async () => {
      const req = createMockRequest();
      req.user = { partyId: 'party::operator::0', isOperator: true };
      await expect(operatorMiddleware(req, mockReply)).resolves.toBeUndefined();
    });
    it('throws FORBIDDEN for non-operator', async () => {
      const req = createMockRequest();
      req.user = { partyId: 'party::alice', isOperator: false };
      await expect(operatorMiddleware(req, mockReply)).rejects.toThrow(/Operator/);
    });
  });

  describe('optionalAuthMiddleware', () => {
    it('populates user on valid token', async () => {
      const token = signToken({ sub: 'usr-001', partyId: 'party::test' });
      const req = createMockRequest({ authorization: `Bearer ${token}` });
      await optionalAuthMiddleware(req, mockReply);
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe('usr-001');
    });
    it('does not throw on missing token', async () => {
      const req = createMockRequest({});
      await optionalAuthMiddleware(req, mockReply);
      expect(req.user).toBeUndefined();
    });
    it('does not throw on invalid token', async () => {
      const req = createMockRequest({ authorization: 'Bearer bad' });
      await optionalAuthMiddleware(req, mockReply);
      expect(req.user).toBeUndefined();
    });
  });

  describe('requireRole', () => {
    it('allows matching role', async () => {
      const middleware = requireRole('admin', 'retail');
      const req = createMockRequest();
      req.user = { role: 'admin' };
      await expect(middleware(req, mockReply)).resolves.toBeUndefined();
    });
    it('throws FORBIDDEN for non-matching role', async () => {
      const middleware = requireRole('admin');
      const req = createMockRequest();
      req.user = { role: 'retail' };
      await expect(middleware(req, mockReply)).rejects.toThrow(/restricted/);
    });
    it('throws FORBIDDEN when no role', async () => {
      const middleware = requireRole('admin');
      const req = createMockRequest();
      req.user = {};
      await expect(middleware(req, mockReply)).rejects.toThrow(/restricted/);
    });
  });
});
