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

import { getScore, getHistory } from '../credit.service';

describe('getScore', () => {
  it('returns score between 0 and 1000', () => {
    const result = getScore('test-party-id');
    expect(result.rawScore).toBeGreaterThanOrEqual(0);
    expect(result.rawScore).toBeLessThanOrEqual(1000);
  });

  it('has expected fields', () => {
    const result = getScore('test-party-id');
    expect(result).toHaveProperty('rawScore');
    expect(result).toHaveProperty('creditTier');
    expect(result).toHaveProperty('breakdown');
    expect(result).toHaveProperty('tierBenefits');
    expect(result).toHaveProperty('lastUpdated');
  });

  it('has valid credit tier', () => {
    const result = getScore('test-party-id');
    const validTiers = ['Diamond', 'Gold', 'Silver', 'Bronze', 'Unrated'];
    expect(validTiers).toContain(result.creditTier);
  });

  it('breakdown contains all score components', () => {
    const result = getScore('test-party-id');
    expect(result.breakdown).toHaveProperty('loanCompletion');
    expect(result.breakdown).toHaveProperty('repaymentTimeliness');
    expect(result.breakdown).toHaveProperty('volumeHistory');
    expect(result.breakdown).toHaveProperty('collateralHealth');
    expect(result.breakdown).toHaveProperty('securitiesLending');
  });

  it('each breakdown component has score and max', () => {
    const result = getScore('test-party-id');
    const components = Object.values(result.breakdown);
    components.forEach((component) => {
      expect(component).toHaveProperty('score');
      expect(component).toHaveProperty('max');
      expect(component.score).toBeLessThanOrEqual(component.max);
    });
  });

  it('tier benefits include collateral and LTV info', () => {
    const result = getScore('test-party-id');
    expect(result.tierBenefits).toHaveProperty('minCollateralRatio');
    expect(result.tierBenefits).toHaveProperty('maxLTV');
    expect(result.tierBenefits).toHaveProperty('rateDiscount');
  });
});

describe('getHistory', () => {
  it('returns array of data points', () => {
    const result = getHistory('test-party-id', { period: '3m' });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('history points have expected fields', () => {
    const result = getHistory('test-party-id', { period: '3m' });
    const point = result[0];
    expect(point).toBeDefined();
    if (point) {
      expect(point).toHaveProperty('timestamp');
      expect(point).toHaveProperty('score');
      expect(point).toHaveProperty('tier');
      expect(point).toHaveProperty('event');
    }
  });

  it('different periods return data spanning the requested time range', () => {
    const short = getHistory('test-party-id', { period: '3m' });
    const long = getHistory('test-party-id', { period: 'all' });
    // Both should return data points
    expect(short.length).toBeGreaterThan(0);
    expect(long.length).toBeGreaterThan(0);
    // The 'all' period should have an earlier first timestamp than '3m'
    const shortFirst = new Date(short[0]!.timestamp).getTime();
    const longFirst = new Date(long[0]!.timestamp).getTime();
    expect(longFirst).toBeLessThan(shortFirst);
  });
});
