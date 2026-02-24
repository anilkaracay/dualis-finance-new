import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/logger.js', () => ({
  createChildLogger: () => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  }),
}));

import {
  listPools,
  getPoolById,
  createPool,
  updatePoolParams,
  pausePool,
  resumePool,
  archivePool,
} from '../admin-pool.service';

import * as registry from '../poolRegistry';

describe('Admin Pool Lifecycle Integration', () => {
  describe('Create → Visible → Update → Pause → Resume → Archive', () => {
    it('creates a new pool and it appears in pool list', () => {
      const initialList = listPools();
      const initialCount = initialList.data.length;

      const pool = createPool({
        poolId: `integration-test-pool-${Date.now()}`,
        name: 'Integration Test Pool',
        asset: 'TEST',
        assetType: 'CryptoCurrency',
        priceUSD: 50,
        params: {
          baseRatePerYear: 0.02,
          multiplierPerYear: 0.1,
          jumpMultiplierPerYear: 0.3,
          kink: 0.8,
          maxLTV: 0.75,
          liquidationThreshold: 0.82,
          liquidationPenalty: 0.05,
          liquidationBonus: 0.025,
          supplyCap: 1_000_000,
          borrowCap: 500_000,
        },
      });

      expect(pool).not.toBeNull();
      expect(pool!.poolId).toContain('integration-test-pool');

      const updatedList = listPools();
      expect(updatedList.data.length).toBeGreaterThan(initialCount);
    });

    it('getPoolById returns pool with APY data', () => {
      const pool = getPoolById('usdc-main');
      expect(pool).not.toBeNull();
      expect(pool!.poolId).toBe('usdc-main');
      expect(pool).toHaveProperty('supplyAPY');
      expect(pool).toHaveProperty('borrowAPY');
      expect(pool).toHaveProperty('utilization');
    });

    it('getPoolById returns null for non-existent pool', () => {
      const pool = getPoolById('non-existent');
      expect(pool).toBeNull();
    });

    it('updates pool parameters', () => {
      const result = updatePoolParams('usdc-main', { maxLTV: 0.85 });
      expect(result).not.toBeNull();
      expect(result!.newParams.maxLTV).toBe(0.85);
    });

    it('pauses a pool', () => {
      const result = pausePool('usdc-main');
      expect(result).not.toBeNull();
      expect(result!.status).toBe('paused');
    });

    it('resumes a pool', () => {
      const result = resumePool('usdc-main');
      expect(result).not.toBeNull();
      expect(result!.status).toBe('active');
    });

    it('archives a pool', () => {
      const result = archivePool('eth-main');
      expect(result).not.toBeNull();
      expect(result!.status).toBe('paused');
    });
  });

  describe('Pool Filtering', () => {
    it('filters by status', () => {
      const result = listPools({ status: 'active' });
      expect(result.data).toBeDefined();
      result.data.forEach((p) => expect(p.status).toBe('active'));
    });

    it('filters by asset symbol', () => {
      const result = listPools({ asset: 'USDC' });
      expect(result.data).toBeDefined();
      result.data.forEach((p) => expect(p.asset).toBe('USDC'));
    });

    it('filters by search term', () => {
      const result = listPools({ search: 'usdc' });
      expect(result.data).toBeDefined();
    });

    it('paginates results', () => {
      const result = listPools({}, { page: 1, limit: 2 });
      expect(result.data.length).toBeLessThanOrEqual(2);
      expect(result).toHaveProperty('total');
    });
  });

  describe('Registry Integration', () => {
    it('seed pools are all present in registry', () => {
      const seedIds = ['usdc-main', 'wbtc-main', 'cc-main', 'tbill-2026', 'spy-2026'];
      seedIds.forEach((id) => {
        expect(registry.hasPool(id)).toBe(true);
      });
    });

    it('poolCount matches expected minimum', () => {
      expect(registry.poolCount()).toBeGreaterThanOrEqual(6);
    });

    it('getAssetPriceMap includes all pool assets', () => {
      const priceMap = registry.getAssetPriceMap();
      expect(priceMap).toHaveProperty('USDC');
      expect(priceMap).toHaveProperty('wBTC');
      expect(priceMap).toHaveProperty('ETH');
    });
  });
});
