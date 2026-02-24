import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/logger.js', () => ({
  createChildLogger: () => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  }),
}));

import {
  getAllPools, getPool, hasPool, getPoolRateModel, getPoolAssetSymbol,
  getPoolAssetPrice, getAllAssetSymbols, getAssetPriceMap,
  registerPool, setPoolActive, updateAssetPrice, poolCount,
} from '../poolRegistry';

describe('Pool Registry', () => {
  describe('Initial State', () => {
    it('has 6 seed pools', () => {
      expect(poolCount()).toBeGreaterThanOrEqual(6);
    });
    it('getAllPools returns all pools', () => {
      const pools = getAllPools();
      expect(pools.length).toBeGreaterThanOrEqual(6);
    });
    it('contains all expected pool IDs', () => {
      const ids = getAllPools().map(p => p.poolId);
      expect(ids).toContain('usdc-main');
      expect(ids).toContain('wbtc-main');
      expect(ids).toContain('eth-main');
      expect(ids).toContain('cc-main');
      expect(ids).toContain('tbill-2026');
      expect(ids).toContain('spy-2026');
    });
  });

  describe('getPool', () => {
    it('returns PoolState for valid poolId', () => {
      const pool = getPool('usdc-main');
      expect(pool).toBeDefined();
      expect(pool!.poolId).toBe('usdc-main');
      expect(pool!.asset.symbol).toBe('USDC');
    });
    it('returns undefined for non-existent poolId', () => {
      expect(getPool('non-existent')).toBeUndefined();
    });
  });

  describe('hasPool', () => {
    it('returns true for existing pool', () => {
      expect(hasPool('usdc-main')).toBe(true);
    });
    it('returns false for non-existent pool', () => {
      expect(hasPool('fake-pool')).toBe(false);
    });
  });

  describe('getPoolRateModel', () => {
    it('returns rate model for known pool', () => {
      const model = getPoolRateModel('usdc-main');
      expect(model).toHaveProperty('baseRate');
      expect(model).toHaveProperty('multiplier');
      expect(model).toHaveProperty('kink');
      expect(model).toHaveProperty('jumpMultiplier');
      expect(model).toHaveProperty('reserveFactor');
    });
    it('falls back to USDC defaults for unknown pool', () => {
      const model = getPoolRateModel('non-existent');
      expect(model.baseRate).toBe(0.02);
    });
  });

  describe('getPoolAssetSymbol', () => {
    it('returns correct symbol for each seed pool', () => {
      expect(getPoolAssetSymbol('usdc-main')).toBe('USDC');
      expect(getPoolAssetSymbol('wbtc-main')).toBe('wBTC');
      expect(getPoolAssetSymbol('eth-main')).toBe('ETH');
      expect(getPoolAssetSymbol('cc-main')).toBe('CC');
    });
    it('returns undefined for unknown pool', () => {
      expect(getPoolAssetSymbol('fake')).toBeUndefined();
    });
  });

  describe('getPoolAssetPrice', () => {
    it('returns correct price for stablecoin', () => {
      expect(getPoolAssetPrice('usdc-main')).toBe(1.0);
    });
    it('returns correct price for crypto', () => {
      expect(getPoolAssetPrice('wbtc-main')).toBe(62_450);
    });
    it('returns 1 for unknown pool (default)', () => {
      expect(getPoolAssetPrice('fake')).toBe(1);
    });
  });

  describe('getAllAssetSymbols', () => {
    it('returns unique symbols', () => {
      const symbols = getAllAssetSymbols();
      expect(symbols.length).toBeGreaterThanOrEqual(6);
      expect(new Set(symbols).size).toBe(symbols.length);
    });
    it('includes all seed pool symbols', () => {
      const symbols = getAllAssetSymbols();
      expect(symbols).toContain('USDC');
      expect(symbols).toContain('wBTC');
      expect(symbols).toContain('ETH');
    });
  });

  describe('getAssetPriceMap', () => {
    it('includes all pool assets', () => {
      const map = getAssetPriceMap();
      expect(map['USDC']).toBe(1.0);
      expect(map['wBTC']).toBe(62_450);
      expect(map['ETH']).toBe(3_420);
    });
    it('includes extra collateral assets', () => {
      const map = getAssetPriceMap();
      expect(map['T-BILL']).toBeDefined();
      expect(map['CC-REC']).toBeDefined();
      expect(map['SPY']).toBeDefined();
      expect(map['TIFA-REC']).toBeDefined();
    });
  });

  describe('registerPool', () => {
    it('registers a new pool successfully', () => {
      const initialCount = poolCount();
      const pool = registerPool({
        poolId: 'test-new-pool-reg',
        assetSymbol: 'TEST',
        assetType: 'Stablecoin',
        priceUSD: 1.0,
      });
      expect(pool.poolId).toBe('test-new-pool-reg');
      expect(pool.isActive).toBe(true);
      expect(pool.borrowIndex).toBe(1.0);
      expect(pool.supplyIndex).toBe(1.0);
      expect(poolCount()).toBe(initialCount + 1);
    });
    it('new pool is immediately visible', () => {
      expect(getPool('test-new-pool-reg')).toBeDefined();
      expect(hasPool('test-new-pool-reg')).toBe(true);
    });
    it('throws if poolId already exists', () => {
      expect(() => registerPool({
        poolId: 'usdc-main',
        assetSymbol: 'USDC2',
        assetType: 'Stablecoin',
        priceUSD: 1.0,
      })).toThrow('already exists');
    });
  });

  describe('setPoolActive', () => {
    it('pauses a pool', () => {
      setPoolActive('eth-main', false);
      expect(getPool('eth-main')!.isActive).toBe(false);
      setPoolActive('eth-main', true);
    });
    it('resumes a pool', () => {
      setPoolActive('eth-main', false);
      setPoolActive('eth-main', true);
      expect(getPool('eth-main')!.isActive).toBe(true);
    });
    it('returns false for non-existent pool', () => {
      expect(setPoolActive('fake', false)).toBe(false);
    });
  });

  describe('updateAssetPrice', () => {
    it('updates price for existing pool', () => {
      const original = getPool('eth-main')!.asset.priceUSD;
      expect(updateAssetPrice('eth-main', 4000)).toBe(true);
      expect(getPool('eth-main')!.asset.priceUSD).toBe(4000);
      updateAssetPrice('eth-main', original);
    });
    it('returns false for non-existent pool', () => {
      expect(updateAssetPrice('fake', 100)).toBe(false);
    });
  });
});
