import { describe, it, expect, beforeEach } from 'vitest';
import { updateTWAP, getTWAP, clearTWAPData } from '../twap';

// Mock logger
import { vi } from 'vitest';
vi.mock('../../config/logger.js', () => ({
  createChildLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('TWAP calculator', () => {
  beforeEach(() => {
    clearTWAPData();
  });

  it('returns null for unknown asset', () => {
    expect(getTWAP('UNKNOWN')).toBeNull();
  });

  it('first sample creates TWAP data', () => {
    const now = Date.now();
    const result = updateTWAP('ETH', 3000, now);

    expect(result.sampleCount).toBe(1);
    expect(result.lastSampleTs).toBe(now);
    // Single sample: all windows return the same value
    expect(result.price5m).toBe(3000);
    expect(result.price15m).toBe(3000);
    expect(result.price1h).toBe(3000);
  });

  it('calculates TWAP with multiple samples', () => {
    const base = Date.now();
    // Add prices over time: 3000, 3100, 3200
    updateTWAP('ETH', 3000, base);
    updateTWAP('ETH', 3100, base + 30_000); // +30s
    const result = updateTWAP('ETH', 3200, base + 60_000); // +60s

    expect(result.sampleCount).toBe(3);
    // 5m window should contain all 3 samples
    expect(result.price5m).not.toBeNull();
    // TWAP should be between min and max
    expect(result.price5m!).toBeGreaterThanOrEqual(3000);
    expect(result.price5m!).toBeLessThanOrEqual(3200);
  });

  it('prunes samples older than 1 hour', () => {
    const base = Date.now();
    const oneHourAgo = base - 61 * 60 * 1000; // 61 minutes ago

    // Add old sample
    updateTWAP('BTC', 50000, oneHourAgo);
    // Add recent sample
    const result = updateTWAP('BTC', 60000, base);

    // Old sample should be pruned
    expect(result.sampleCount).toBe(1);
    expect(result.price5m).toBe(60000);
  });

  it('getTWAP returns current state without adding sample', () => {
    const now = Date.now();
    updateTWAP('USDC', 1.0, now);
    updateTWAP('USDC', 1.001, now + 10_000);

    const result = getTWAP('USDC');
    expect(result).not.toBeNull();
    expect(result!.sampleCount).toBe(2);
  });

  it('handles rapid updates', () => {
    const now = Date.now();
    for (let i = 0; i < 10; i++) {
      updateTWAP('RAPID', 100 + i, now + i * 1000);
    }

    const result = getTWAP('RAPID');
    expect(result).not.toBeNull();
    expect(result!.sampleCount).toBe(10);
    expect(result!.price5m).not.toBeNull();
  });

  it('clearTWAPData resets all state', () => {
    updateTWAP('ETH', 3000, Date.now());
    expect(getTWAP('ETH')).not.toBeNull();

    clearTWAPData();
    expect(getTWAP('ETH')).toBeNull();
  });
});
