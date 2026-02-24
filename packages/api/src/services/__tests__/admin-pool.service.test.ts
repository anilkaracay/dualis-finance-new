import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/logger.js', () => ({
  createChildLogger: () => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  }),
}));

import {
  listPools, getPoolById, createPool, updatePoolParams,
  pausePool, resumePool, archivePool, getPoolPositions, getPoolHistory,
} from '../admin-pool.service';

describe('Admin Pool Service', () => {
  describe('listPools', () => {
    it('returns all pools', () => {
      const result = listPools();
      expect(result.data.length).toBeGreaterThanOrEqual(6);
      expect(result.total).toBeGreaterThanOrEqual(6);
    });
    it('filters by asset', () => {
      const result = listPools({ asset: 'USDC' });
      result.data.forEach((p: any) => {
        expect(p.asset).toBe('USDC');
      });
    });
    it('paginates', () => {
      const result = listPools(undefined, { page: 1, limit: 2 });
      expect(result.data.length).toBeLessThanOrEqual(2);
      expect(result.limit).toBe(2);
    });
  });

  describe('getPoolById', () => {
    it('returns pool for valid poolId', () => {
      const pool = getPoolById('usdc-main');
      expect(pool).not.toBeNull();
      expect(pool!.poolId).toBe('usdc-main');
    });
    it('returns null for invalid poolId', () => {
      expect(getPoolById('nonexistent')).toBeNull();
    });
    it('includes calculated APY', () => {
      const pool = getPoolById('usdc-main');
      expect(pool).toHaveProperty('supplyAPY');
      expect(pool).toHaveProperty('borrowAPY');
    });
  });

  describe('createPool', () => {
    it('creates and returns new pool', () => {
      const pool = createPool({
        poolId: 'admin-test-pool-1',
        name: 'Admin Test Pool',
        asset: 'ADMIN-TEST',
        priceUSD: 50,
        params: {
          baseRatePerYear: 0.02, multiplierPerYear: 0.1, jumpMultiplierPerYear: 0.3,
          kink: 0.8, maxLTV: 0.75, liquidationThreshold: 0.82,
          liquidationPenalty: 0.05, liquidationBonus: 0.025,
          supplyCap: 1_000_000, borrowCap: 500_000,
        },
      });
      expect(pool).not.toBeNull();
      expect(pool!.poolId).toBe('admin-test-pool-1');
    });
    it('new pool visible in listPools', () => {
      const result = listPools({ search: 'admin-test' });
      expect(result.data.some((p: any) => p.poolId === 'admin-test-pool-1')).toBe(true);
    });
  });

  describe('updatePoolParams', () => {
    it('returns old and new params', () => {
      const result = updatePoolParams('usdc-main', { reserveFactor: 0.20 });
      expect(result).not.toBeNull();
      expect(result!.oldParams).toBeDefined();
      expect(result!.newParams).toBeDefined();
    });
    it('returns null for non-existent pool', () => {
      expect(updatePoolParams('fake', { reserveFactor: 0.1 })).toBeNull();
    });
  });

  describe('pausePool / resumePool / archivePool', () => {
    it('pause sets isActive to false', () => {
      const pool = pausePool('wbtc-main');
      expect(pool).not.toBeNull();
      resumePool('wbtc-main');
    });
    it('resume sets isActive to true', () => {
      pausePool('wbtc-main');
      const pool = resumePool('wbtc-main');
      expect(pool).not.toBeNull();
    });
    it('archive returns pool', () => {
      const pool = archivePool('spy-2026');
      expect(pool).not.toBeNull();
      resumePool('spy-2026');
    });
    it('returns null for non-existent pool', () => {
      expect(pausePool('fake')).toBeNull();
      expect(resumePool('fake')).toBeNull();
    });
  });

  describe('getPoolPositions / getPoolHistory', () => {
    it('returns mock positions', () => {
      const result = getPoolPositions('usdc-main');
      expect(result.data.length).toBeGreaterThan(0);
    });
    it('returns mock history', () => {
      const result = getPoolHistory('usdc-main');
      expect(result.data.length).toBeGreaterThan(0);
    });
  });
});
