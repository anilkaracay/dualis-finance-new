import { describe, it, expect } from 'vitest';
import { CREDIT_TIER_THRESHOLDS, CREDIT_TIER_PARAMS, LIQUIDATION_TIERS, SCORE_MAXES } from '../constants';

describe('CREDIT_TIER_THRESHOLDS', () => {
  it('covers full score range without gaps', () => {
    expect(CREDIT_TIER_THRESHOLDS.Unrated.min).toBe(0);
    expect(CREDIT_TIER_THRESHOLDS.Diamond.max).toBe(1000);
  });
  it('Diamond has highest min threshold', () => {
    expect(CREDIT_TIER_THRESHOLDS.Diamond.min).toBeGreaterThan(CREDIT_TIER_THRESHOLDS.Gold.min);
  });
  it('tiers are in descending order', () => {
    expect(CREDIT_TIER_THRESHOLDS.Diamond.min).toBeGreaterThan(CREDIT_TIER_THRESHOLDS.Gold.min);
    expect(CREDIT_TIER_THRESHOLDS.Gold.min).toBeGreaterThan(CREDIT_TIER_THRESHOLDS.Silver.min);
    expect(CREDIT_TIER_THRESHOLDS.Silver.min).toBeGreaterThan(CREDIT_TIER_THRESHOLDS.Bronze.min);
    expect(CREDIT_TIER_THRESHOLDS.Bronze.min).toBeGreaterThan(CREDIT_TIER_THRESHOLDS.Unrated.min);
  });
});

describe('CREDIT_TIER_PARAMS', () => {
  it('Diamond has lowest collateral ratio', () => {
    expect(CREDIT_TIER_PARAMS.Diamond.minCollateralRatio).toBeLessThan(CREDIT_TIER_PARAMS.Unrated.minCollateralRatio);
  });
  it('Diamond has highest maxLTV', () => {
    expect(CREDIT_TIER_PARAMS.Diamond.maxLTV).toBeGreaterThan(CREDIT_TIER_PARAMS.Unrated.maxLTV);
  });
});

describe('LIQUIDATION_TIERS', () => {
  it('has 4 tiers', () => { expect(LIQUIDATION_TIERS).toHaveLength(4); });
  it('FullLiquidation has 100% percent', () => {
    const full = LIQUIDATION_TIERS.find(t => t.tier === 'FullLiquidation');
    expect(full?.liquidationPercent).toBe(1.0);
  });
  it('MarginCall has 0% liquidation', () => {
    const mc = LIQUIDATION_TIERS.find(t => t.tier === 'MarginCall');
    expect(mc?.liquidationPercent).toBe(0);
  });
});

describe('SCORE_MAXES', () => {
  it('total equals 1000', () => { expect(SCORE_MAXES.total).toBe(1000); });
  it('component scores add up to total', () => {
    const sum = SCORE_MAXES.loanCompletion + SCORE_MAXES.repaymentTimeliness + SCORE_MAXES.volumeHistory + SCORE_MAXES.collateralHealth + SCORE_MAXES.securitiesLending;
    expect(sum).toBe(SCORE_MAXES.total);
  });
});
