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
};

vi.mock('../../cache/redis.js', () => ({
  getRedis: vi.fn(() => mockRedis),
}));

vi.mock('../../config/env.js', () => ({
  env: {
    BRUTE_FORCE_MAX_ATTEMPTS: 5,
    BRUTE_FORCE_LOCKOUT_SEC: 900,
  },
}));

vi.mock('../audit-log.js', () => ({
  logSecurityEvent: vi.fn(),
}));

vi.mock('../metrics.js', () => ({
  securityMetrics: {
    bruteForceBlocks: { inc: vi.fn() },
  },
}));

import { checkBruteForce, recordFailedAttempt, resetBruteForce } from '../brute-force';
import { getRedis } from '../../cache/redis';

describe('Brute Force Protection', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('checkBruteForce', () => {
    it('allows request when no prior attempts', async () => {
      mockRedis.get.mockResolvedValue(null);
      const result = await checkBruteForce('test-id');
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(5);
    });

    it('allows request when Redis unavailable', async () => {
      vi.mocked(getRedis).mockReturnValueOnce(null as any);
      const result = await checkBruteForce('test-id');
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(5);
    });

    it('blocks when at max attempts', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ attempts: 5, lockedUntil: null }));
      mockRedis.set.mockResolvedValue('OK');
      const result = await checkBruteForce('test-id');
      expect(result.allowed).toBe(false);
      expect(result.remainingAttempts).toBe(0);
      expect(result.retryAfterSeconds).toBeDefined();
    });

    it('blocks during active lockout', async () => {
      const futureTime = Date.now() + 600_000;
      mockRedis.get.mockResolvedValue(JSON.stringify({ attempts: 10, lockedUntil: futureTime }));
      const result = await checkBruteForce('test-id');
      expect(result.allowed).toBe(false);
      expect(result.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('allows after lockout expires', async () => {
      const pastTime = Date.now() - 1000;
      mockRedis.get.mockResolvedValue(JSON.stringify({ attempts: 3, lockedUntil: pastTime }));
      const result = await checkBruteForce('test-id');
      expect(result.allowed).toBe(true);
    });

    it('returns remaining attempts correctly', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ attempts: 3, lockedUntil: null }));
      const result = await checkBruteForce('test-id');
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(2);
    });

    it('handles Redis errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis down'));
      const result = await checkBruteForce('test-id');
      expect(result.allowed).toBe(true);
    });
  });

  describe('recordFailedAttempt', () => {
    it('increments attempt counter', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ attempts: 2, lockedUntil: null }));
      mockRedis.set.mockResolvedValue('OK');
      await recordFailedAttempt('test-id');
      expect(mockRedis.set).toHaveBeenCalledWith(
        'bf:test-id',
        expect.stringContaining('"attempts":3'),
        'EX',
        86400,
      );
    });

    it('creates new entry when none exists', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');
      await recordFailedAttempt('test-id');
      expect(mockRedis.set).toHaveBeenCalledWith(
        'bf:test-id',
        expect.stringContaining('"attempts":1'),
        'EX',
        86400,
      );
    });

    it('does nothing when Redis unavailable', async () => {
      vi.mocked(getRedis).mockReturnValueOnce(null as any);
      await recordFailedAttempt('test-id');
      expect(mockRedis.set).not.toHaveBeenCalled();
    });
  });

  describe('resetBruteForce', () => {
    it('removes the tracking key', async () => {
      mockRedis.del.mockResolvedValue(1);
      await resetBruteForce('test-id');
      expect(mockRedis.del).toHaveBeenCalledWith('bf:test-id');
    });
    it('does nothing when Redis unavailable', async () => {
      vi.mocked(getRedis).mockReturnValueOnce(null as any);
      await resetBruteForce('test-id');
      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });
});
