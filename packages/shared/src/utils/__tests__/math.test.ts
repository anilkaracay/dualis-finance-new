import { describe, it, expect } from 'vitest';
import { calculateAPY, calculateUtilization, calculateBorrowRate, calculateSupplyRate, calculateHealthFactor, calculateWeightedLTV, calculateLiquidationPrice, calculateCreditScore } from '../math';

describe('calculateAPY', () => {
  it('returns 0 for zero rate', () => { expect(calculateAPY(0)).toBe(0); });
  it('calculates compound interest correctly', () => {
    const apy = calculateAPY(0.05);
    expect(apy).toBeGreaterThan(0.05); // Compound > simple
    expect(apy).toBeLessThan(0.06);
  });
});

describe('calculateUtilization', () => {
  it('returns 0 when no deposits', () => { expect(calculateUtilization(100, 0)).toBe(0); });
  it('calculates ratio correctly', () => { expect(calculateUtilization(75, 100)).toBe(0.75); });
  it('can be > 1 if borrows exceed deposits', () => { expect(calculateUtilization(120, 100)).toBe(1.2); });
});

describe('calculateBorrowRate', () => {
  it('uses base rate below kink', () => {
    const rate = calculateBorrowRate(0.5, 0.02, 0.1, 0.8, 0.5);
    expect(rate).toBeCloseTo(0.02 + 0.5 * 0.1);
  });
  it('applies jump multiplier above kink', () => {
    const rate = calculateBorrowRate(0.9, 0.02, 0.1, 0.8, 0.5);
    const expected = 0.02 + 0.8 * 0.1 + (0.9 - 0.8) * 0.5;
    expect(rate).toBeCloseTo(expected);
  });
});

describe('calculateSupplyRate', () => {
  it('returns 0 for zero utilization', () => { expect(calculateSupplyRate(0.05, 0)).toBe(0); });
  it('calculates correctly', () => {
    const rate = calculateSupplyRate(0.05, 0.8, 0.001);
    expect(rate).toBeCloseTo(0.05 * 0.8 * 0.999);
  });
});

describe('calculateHealthFactor', () => {
  it('returns Infinity for zero borrow', () => { expect(calculateHealthFactor([{ valueUSD: 100, liquidationThreshold: 0.8 }], 0)).toBe(Infinity); });
  it('calculates weighted HF correctly', () => {
    const hf = calculateHealthFactor([{ valueUSD: 200, liquidationThreshold: 0.85 }], 100);
    expect(hf).toBeCloseTo(1.7);
  });
  it('handles multiple collateral assets', () => {
    const hf = calculateHealthFactor([
      { valueUSD: 100, liquidationThreshold: 0.8 },
      { valueUSD: 100, liquidationThreshold: 0.9 },
    ], 100);
    expect(hf).toBeCloseTo(1.7);
  });
});

describe('calculateWeightedLTV', () => {
  it('returns 0 for zero collateral', () => { expect(calculateWeightedLTV(100, 0)).toBe(0); });
  it('calculates ratio correctly', () => { expect(calculateWeightedLTV(75, 100)).toBe(0.75); });
});

describe('calculateLiquidationPrice', () => {
  it('returns 0 for zero collateral amount', () => { expect(calculateLiquidationPrice(100, 0, 0.8)).toBe(0); });
  it('calculates price correctly', () => {
    const price = calculateLiquidationPrice(1000, 10, 0.8, 0);
    expect(price).toBeCloseTo(125);
  });
});

describe('calculateCreditScore', () => {
  it('returns 0 for zero activity', () => {
    expect(calculateCreditScore({
      loansCompleted: 0, loansDefaulted: 0, onTimeRepayments: 0,
      lateRepayments: 0, totalVolumeRepaid: 0, lowestHealthFactor: 0, secLendingDealsCompleted: 0,
    })).toBe(0);
  });
  it('returns max score for perfect history', () => {
    const score = calculateCreditScore({
      loansCompleted: 100, loansDefaulted: 0, onTimeRepayments: 100,
      lateRepayments: 0, totalVolumeRepaid: 1_000_000_000, lowestHealthFactor: 2.0, secLendingDealsCompleted: 20,
    });
    expect(score).toBeGreaterThan(800);
    expect(score).toBeLessThanOrEqual(1000);
  });
  it('penalizes defaults', () => {
    const good = calculateCreditScore({ loansCompleted: 10, loansDefaulted: 0, onTimeRepayments: 10, lateRepayments: 0, totalVolumeRepaid: 10000, lowestHealthFactor: 1.5, secLendingDealsCompleted: 0 });
    const bad = calculateCreditScore({ loansCompleted: 5, loansDefaulted: 5, onTimeRepayments: 10, lateRepayments: 0, totalVolumeRepaid: 10000, lowestHealthFactor: 1.5, secLendingDealsCompleted: 0 });
    expect(good).toBeGreaterThan(bad);
  });
});
