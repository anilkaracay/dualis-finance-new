import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/logger.js', () => ({
  createChildLogger: () => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  }),
}));

const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  incr: vi.fn(),
  expire: vi.fn(),
};

vi.mock('../../cache/redis.js', () => ({
  getRedis: vi.fn(() => mockRedis),
}));

vi.mock('../../config/env.js', () => ({
  env: {
    BAN_THRESHOLD: 3,
    BAN_DURATION_SECONDS: 900,
  },
}));

vi.mock('../audit-log.js', () => ({
  logSecurityEvent: vi.fn(),
}));

vi.mock('../metrics.js', () => ({
  securityMetrics: {
    ipBans: { inc: vi.fn() },
  },
}));

import { isBanned, recordRateLimitViolation } from '../ban';
import { getRedis } from '../../cache/redis';

describe('IP Ban', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('isBanned', () => {
    it('returns false when not banned', async () => {
      mockRedis.get.mockResolvedValue(null);
      expect(await isBanned('1.2.3.4')).toBe(false);
    });
    it('returns true when banned', async () => {
      mockRedis.get.mockResolvedValue('1');
      expect(await isBanned('1.2.3.4')).toBe(true);
    });
    it('returns false when Redis unavailable', async () => {
      vi.mocked(getRedis).mockReturnValueOnce(null as any);
      expect(await isBanned('1.2.3.4')).toBe(false);
    });
    it('returns false on Redis error', async () => {
      mockRedis.get.mockRejectedValue(new Error('fail'));
      expect(await isBanned('1.2.3.4')).toBe(false);
    });
  });

  describe('recordRateLimitViolation', () => {
    it('increments violation counter', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      const banned = await recordRateLimitViolation('1.2.3.4');
      expect(banned).toBe(false);
      expect(mockRedis.incr).toHaveBeenCalled();
    });
    it('sets 1-hour expiry on first violation', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      await recordRateLimitViolation('1.2.3.4');
      expect(mockRedis.expire).toHaveBeenCalledWith(expect.any(String), 3600);
    });
    it('bans IP at threshold', async () => {
      mockRedis.incr.mockResolvedValue(3);
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.del.mockResolvedValue(1);
      const banned = await recordRateLimitViolation('1.2.3.4');
      expect(banned).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith('ban:1.2.3.4', '1', 'EX', 900);
    });
    it('returns false when Redis unavailable', async () => {
      vi.mocked(getRedis).mockReturnValueOnce(null as any);
      const banned = await recordRateLimitViolation('1.2.3.4');
      expect(banned).toBe(false);
    });
  });
});
