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
  scan: vi.fn(),
};

vi.mock('../redis.js', () => ({
  getRedis: vi.fn(() => mockRedis),
}));

import { CacheService } from '../cache';
import { getRedis } from '../redis';

describe('CacheService', () => {
  let cache: CacheService;

  beforeEach(() => {
    cache = new CacheService();
    vi.clearAllMocks();
    vi.mocked(getRedis).mockReturnValue(mockRedis as any);
  });

  describe('Generic operations', () => {
    it('get returns null on cache miss', async () => {
      mockRedis.get.mockResolvedValue(null);
      expect(await cache.get('missing')).toBeNull();
    });
    it('get returns parsed data on hit', async () => {
      mockRedis.get.mockResolvedValue('{"value":42}');
      const result = await cache.get<{ value: number }>('key');
      expect(result).toEqual({ value: 42 });
    });
    it('set stores data with TTL', async () => {
      mockRedis.set.mockResolvedValue('OK');
      await cache.set('key', { test: true }, 60);
      expect(mockRedis.set).toHaveBeenCalledWith('key', '{"test":true}', 'EX', 60);
    });
    it('del removes key', async () => {
      mockRedis.del.mockResolvedValue(1);
      await cache.del('key');
      expect(mockRedis.del).toHaveBeenCalledWith('key');
    });
    it('invalidatePattern uses SCAN', async () => {
      mockRedis.scan.mockResolvedValue(['0', ['key1', 'key2']]);
      mockRedis.del.mockResolvedValue(2);
      await cache.invalidatePattern('prefix:*');
      expect(mockRedis.scan).toHaveBeenCalled();
      expect(mockRedis.del).toHaveBeenCalledWith('key1', 'key2');
    });
  });

  describe('Domain-specific', () => {
    it('setPrice / getPrice uses price: prefix', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValue('"100"');
      await cache.setPrice('ETH', '100');
      expect(mockRedis.set).toHaveBeenCalledWith('price:ETH', expect.any(String), 'EX', 5);
      await cache.getPrice('ETH');
      expect(mockRedis.get).toHaveBeenCalledWith('price:ETH');
    });
    it('setPoolList / getPoolList uses pools:list key', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValue('[]');
      await cache.setPoolList([]);
      expect(mockRedis.set).toHaveBeenCalledWith('pools:list', expect.any(String), 'EX', 5);
      await cache.getPoolList();
      expect(mockRedis.get).toHaveBeenCalledWith('pools:list');
    });
    it('setPoolDetail / getPoolDetail uses pools:detail: prefix', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValue('{}');
      await cache.setPoolDetail('usdc-main', {});
      expect(mockRedis.set).toHaveBeenCalledWith('pools:detail:usdc-main', expect.any(String), 'EX', 10);
      await cache.getPoolDetail('usdc-main');
      expect(mockRedis.get).toHaveBeenCalledWith('pools:detail:usdc-main');
    });
    it('setCreditScore / getCreditScore uses credit: prefix', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValue('{}');
      await cache.setCreditScore('alice', {});
      expect(mockRedis.set).toHaveBeenCalledWith('credit:alice', expect.any(String), 'EX', 30);
      await cache.getCreditScore('alice');
      expect(mockRedis.get).toHaveBeenCalledWith('credit:alice');
    });
    it('setProtocolConfig / getProtocolConfig', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValue('{}');
      await cache.setProtocolConfig({});
      expect(mockRedis.set).toHaveBeenCalledWith('config:protocol', expect.any(String), 'EX', 300);
      await cache.getProtocolConfig();
      expect(mockRedis.get).toHaveBeenCalledWith('config:protocol');
    });
  });

  describe('Targeted invalidation', () => {
    it('invalidatePool clears detail + list', async () => {
      mockRedis.del.mockResolvedValue(1);
      await cache.invalidatePool('usdc-main');
      expect(mockRedis.del).toHaveBeenCalledWith('pools:detail:usdc-main');
      expect(mockRedis.del).toHaveBeenCalledWith('pools:list');
    });
    it('invalidateCredit clears credit key', async () => {
      mockRedis.del.mockResolvedValue(1);
      await cache.invalidateCredit('alice');
      expect(mockRedis.del).toHaveBeenCalledWith('credit:alice');
    });
  });

  describe('Redis unavailable', () => {
    it('get returns null', async () => {
      vi.mocked(getRedis).mockReturnValue(null as any);
      const c = new CacheService();
      expect(await c.get('key')).toBeNull();
    });
    it('set is no-op', async () => {
      vi.mocked(getRedis).mockReturnValue(null as any);
      const c = new CacheService();
      await c.set('key', 'val', 60);
      expect(mockRedis.set).not.toHaveBeenCalled();
    });
    it('del is no-op', async () => {
      vi.mocked(getRedis).mockReturnValue(null as any);
      const c = new CacheService();
      await c.del('key');
      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });
});
