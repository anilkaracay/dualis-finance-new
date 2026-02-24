import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/logger.js', () => ({
  createChildLogger: () => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  }),
}));

const mockRedis = {
  set: vi.fn(),
  exists: vi.fn(),
};

vi.mock('../../cache/redis.js', () => ({
  getRedis: vi.fn(() => mockRedis),
}));

vi.mock('../audit-log.js', () => ({
  logSecurityEvent: vi.fn(),
}));

vi.mock('../metrics.js', () => ({
  securityMetrics: {
    sessionsRevoked: { inc: vi.fn() },
  },
}));

import { blacklistAccessToken, isTokenBlacklisted } from '../session';
import { getRedis } from '../../cache/redis';

describe('Session Security', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('blacklistAccessToken', () => {
    it('adds JTI to Redis with TTL', async () => {
      mockRedis.set.mockResolvedValue('OK');
      await blacklistAccessToken('test-jti', 900);
      expect(mockRedis.set).toHaveBeenCalledWith('jwt:bl:test-jti', '1', 'EX', 900);
    });
    it('uses default TTL when not specified', async () => {
      mockRedis.set.mockResolvedValue('OK');
      await blacklistAccessToken('test-jti');
      expect(mockRedis.set).toHaveBeenCalledWith('jwt:bl:test-jti', '1', 'EX', 900);
    });
    it('handles Redis unavailability', async () => {
      vi.mocked(getRedis).mockReturnValueOnce(null as any);
      await expect(blacklistAccessToken('test-jti')).resolves.toBeUndefined();
    });
  });

  describe('isTokenBlacklisted', () => {
    it('returns true for blacklisted JTI', async () => {
      mockRedis.exists.mockResolvedValue(1);
      expect(await isTokenBlacklisted('test-jti')).toBe(true);
    });
    it('returns false for non-blacklisted JTI', async () => {
      mockRedis.exists.mockResolvedValue(0);
      expect(await isTokenBlacklisted('test-jti')).toBe(false);
    });
    it('returns false when Redis unavailable', async () => {
      vi.mocked(getRedis).mockReturnValueOnce(null as any);
      expect(await isTokenBlacklisted('test-jti')).toBe(false);
    });
    it('returns false on Redis error', async () => {
      mockRedis.exists.mockRejectedValue(new Error('fail'));
      expect(await isTokenBlacklisted('test-jti')).toBe(false);
    });
  });
});
