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

import { getAllPrices, getAssetPrice } from '../oracle.service';

describe('getAllPrices', () => {
  it('returns array of prices', () => {
    const prices = getAllPrices();
    expect(Array.isArray(prices)).toBe(true);
    expect(prices.length).toBeGreaterThan(0);
  });

  it('price entries have asset, price, and timestamp fields', () => {
    const prices = getAllPrices();
    prices.forEach((price) => {
      expect(price).toHaveProperty('asset');
      expect(price).toHaveProperty('price');
      expect(price).toHaveProperty('timestamp');
      expect(typeof price.asset).toBe('string');
      expect(typeof price.price).toBe('number');
      expect(typeof price.timestamp).toBe('string');
    });
  });

  it('includes common assets', () => {
    const prices = getAllPrices();
    const assets = prices.map((p) => p.asset);
    expect(assets).toContain('BTC');
    expect(assets).toContain('ETH');
    expect(assets).toContain('USDC');
  });

  it('price entries have confidence and source', () => {
    const prices = getAllPrices();
    prices.forEach((price) => {
      expect(price).toHaveProperty('confidence');
      expect(price).toHaveProperty('source');
      expect(price.confidence).toBeGreaterThan(0);
      expect(price.confidence).toBeLessThanOrEqual(1);
    });
  });
});

describe('getAssetPrice', () => {
  it('returns price for specific asset', () => {
    const result = getAssetPrice('BTC', {});
    expect(result).toHaveProperty('asset', 'BTC');
    expect(result).toHaveProperty('price');
    expect((result as { price: number }).price).toBeGreaterThan(0);
  });

  it('is case-insensitive for asset lookup', () => {
    const lower = getAssetPrice('btc', {});
    const upper = getAssetPrice('BTC', {});
    expect((lower as { asset: string }).asset).toBe((upper as { asset: string }).asset);
  });

  it('throws for non-existent asset', () => {
    expect(() => getAssetPrice('NONEXISTENT', {})).toThrow();
  });

  it('returns history when requested', () => {
    const result = getAssetPrice('ETH', { history: true, period: '24h' });
    expect(result).toHaveProperty('current');
    expect(result).toHaveProperty('history');
    const withHistory = result as { current: { asset: string }; history: Array<{ timestamp: string; price: number }> };
    expect(withHistory.current.asset).toBe('ETH');
    expect(Array.isArray(withHistory.history)).toBe(true);
    expect(withHistory.history.length).toBeGreaterThan(0);
  });

  it('history entries have timestamp and price', () => {
    const result = getAssetPrice('BTC', { history: true, period: '24h' });
    const withHistory = result as { history: Array<{ timestamp: string; price: number }> };
    const firstEntry = withHistory.history[0];
    expect(firstEntry).toBeDefined();
    if (firstEntry) {
      expect(firstEntry).toHaveProperty('timestamp');
      expect(firstEntry).toHaveProperty('price');
      expect(typeof firstEntry.timestamp).toBe('string');
      expect(typeof firstEntry.price).toBe('number');
    }
  });
});
