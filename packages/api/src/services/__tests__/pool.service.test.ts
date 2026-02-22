import { describe, it, expect, vi } from 'vitest';

// Mock the logger before importing the service
vi.mock('../../config/logger.js', () => ({
  createChildLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { listPools, getPoolDetail } from '../pool.service';

describe('listPools', () => {
  it('returns array of pools', () => {
    const result = listPools({});
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
  });

  it('returns pagination metadata', () => {
    const result = listPools({});
    expect(result.pagination).toHaveProperty('total');
    expect(result.pagination).toHaveProperty('limit');
    expect(result.pagination).toHaveProperty('offset');
    expect(result.pagination).toHaveProperty('hasMore');
  });

  it('filters by assetType stablecoin', () => {
    const result = listPools({ assetType: 'stablecoin' });
    expect(result.data.length).toBeGreaterThan(0);
    result.data.forEach((pool) => {
      expect(pool.asset.type).toBe('Stablecoin');
    });
  });

  it('filters by assetType crypto', () => {
    const result = listPools({ assetType: 'crypto' });
    expect(result.data.length).toBeGreaterThan(0);
    result.data.forEach((pool) => {
      expect(pool.asset.type).toBe('CryptoCurrency');
    });
  });

  it('returns all pools when assetType is "all"', () => {
    const allResult = listPools({ assetType: 'all' });
    const defaultResult = listPools({});
    expect(allResult.data.length).toBe(defaultResult.data.length);
  });

  it('pool data has expected structure', () => {
    const result = listPools({});
    const pool = result.data[0];
    expect(pool).toBeDefined();
    if (pool) {
      expect(pool).toHaveProperty('poolId');
      expect(pool).toHaveProperty('asset');
      expect(pool).toHaveProperty('supplyAPY');
      expect(pool).toHaveProperty('borrowAPY');
      expect(pool).toHaveProperty('totalSupply');
      expect(pool).toHaveProperty('totalBorrow');
      expect(pool).toHaveProperty('utilization');
      expect(pool).toHaveProperty('isActive');
      expect(pool).toHaveProperty('contractId');
    }
  });
});

describe('getPoolDetail', () => {
  it('returns pool detail for valid poolId', () => {
    const detail = getPoolDetail('usdc-main');
    expect(detail).toHaveProperty('poolId', 'usdc-main');
    expect(detail).toHaveProperty('interestRateModel');
    expect(detail).toHaveProperty('collateralConfig');
    expect(detail).toHaveProperty('available');
  });

  it('throws for non-existent poolId', () => {
    expect(() => getPoolDetail('non-existent-pool')).toThrow();
  });

  it('detail includes base pool fields', () => {
    const detail = getPoolDetail('usdc-main');
    expect(detail).toHaveProperty('asset');
    expect(detail).toHaveProperty('supplyAPY');
    expect(detail).toHaveProperty('borrowAPY');
    expect(detail).toHaveProperty('totalSupply');
    expect(detail).toHaveProperty('totalBorrow');
  });

  it('interest rate model has expected fields', () => {
    const detail = getPoolDetail('usdc-main');
    const model = detail.interestRateModel;
    expect(model).toHaveProperty('type');
    expect(model).toHaveProperty('baseRate');
    expect(model).toHaveProperty('multiplier');
    expect(model).toHaveProperty('kink');
    expect(model).toHaveProperty('jumpMultiplier');
  });
});
