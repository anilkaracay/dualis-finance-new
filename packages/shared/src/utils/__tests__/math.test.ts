import { describe, it, expect } from 'vitest';
import {
  calculateAPY,
  calculateUtilization,
  calculateBorrowRate,
  calculateSupplyRate,
  calculateHealthFactor,
  calculateWeightedLTV,
  calculateLiquidationPrice,
  calculateCreditScore,
  // New financial math engine functions
  calculateBorrowAPR,
  calculateSupplyAPR,
  calculateTierAdjustedBorrowAPR,
  calculatePoolAPY,
  aprToApy,
  apyToApr,
  annualToPerSecond,
  accrueInterest,
  calculateCurrentBalance,
  calculateInterestDelta,
  calculateMaxBorrowable,
  calculateLiquidation,
  generateRateCurve,
  simulatePriceImpact,
  findLiquidationPrice,
  formatRatePercent,
  formatUSD,
  formatHealthFactor,
  SECONDS_PER_YEAR,
  type InterestRateModelConfig,
  type CollateralPositionInput,
  type DebtPositionInput,
  type HealthFactorResult,
} from '../math';

// ─── Test Rate Model ────────────────────────────────────────────────────────

const USDC_MODEL: InterestRateModelConfig = {
  type: 'VariableRate',
  baseRate: 0.02,
  multiplier: 0.07,
  kink: 0.80,
  jumpMultiplier: 0.30,
  reserveFactor: 0.10,
};

const WBTC_MODEL: InterestRateModelConfig = {
  type: 'VariableRate',
  baseRate: 0.01,
  multiplier: 0.04,
  kink: 0.65,
  jumpMultiplier: 0.50,
  reserveFactor: 0.15,
};

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY FUNCTION TESTS (backward compatibility)
// ═══════════════════════════════════════════════════════════════════════════

describe('calculateAPY (legacy)', () => {
  it('returns 0 for zero rate', () => { expect(calculateAPY(0)).toBe(0); });
  it('calculates compound interest correctly', () => {
    const apy = calculateAPY(0.05);
    expect(apy).toBeGreaterThan(0.05);
    expect(apy).toBeLessThan(0.06);
  });
});

describe('calculateUtilization', () => {
  it('returns 0 when no deposits', () => { expect(calculateUtilization(100, 0)).toBe(0); });
  it('calculates ratio correctly', () => { expect(calculateUtilization(75, 100)).toBe(0.75); });
  it('caps at 1 if borrows exceed deposits', () => { expect(calculateUtilization(120, 100)).toBe(1); });
  it('handles negative deposits as 0', () => { expect(calculateUtilization(50, -10)).toBe(0); });
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

describe('calculateHealthFactor (legacy overload)', () => {
  it('returns Infinity for zero borrow', () => {
    expect(calculateHealthFactor([{ valueUSD: 100, liquidationThreshold: 0.8 }], 0)).toBe(Infinity);
  });
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

// ═══════════════════════════════════════════════════════════════════════════
// NEW FINANCIAL MATH ENGINE TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Jump Rate Model (calculateBorrowAPR)', () => {
  it('returns baseRate at 0% utilization', () => {
    expect(calculateBorrowAPR(USDC_MODEL, 0)).toBeCloseTo(0.02);
  });

  it('calculates correctly at 50% utilization (below kink)', () => {
    // 0.02 + 0.50 * 0.07 = 0.055
    expect(calculateBorrowAPR(USDC_MODEL, 0.50)).toBeCloseTo(0.055);
  });

  it('calculates correctly at kink (80%)', () => {
    // 0.02 + 0.80 * 0.07 = 0.076
    expect(calculateBorrowAPR(USDC_MODEL, 0.80)).toBeCloseTo(0.076);
  });

  it('applies jump multiplier above kink (90%)', () => {
    // 0.02 + 0.80 * 0.07 + (0.90 - 0.80) * 0.30 = 0.076 + 0.03 = 0.106
    expect(calculateBorrowAPR(USDC_MODEL, 0.90)).toBeCloseTo(0.106);
  });

  it('calculates at 100% utilization', () => {
    // 0.02 + 0.80 * 0.07 + (1.00 - 0.80) * 0.30 = 0.076 + 0.06 = 0.136
    expect(calculateBorrowAPR(USDC_MODEL, 1.00)).toBeCloseTo(0.136);
  });

  it('monotonically increases', () => {
    let prev = 0;
    for (let u = 0; u <= 1; u += 0.05) {
      const rate = calculateBorrowAPR(USDC_MODEL, u);
      expect(rate).toBeGreaterThanOrEqual(prev);
      prev = rate;
    }
  });
});

describe('calculateSupplyAPR', () => {
  it('returns 0 at 0% utilization', () => {
    expect(calculateSupplyAPR(USDC_MODEL, 0)).toBe(0);
  });

  it('calculates correctly at 80% utilization', () => {
    // borrowAPR = 0.076, supplyAPR = 0.076 * 0.80 * (1 - 0.10) = 0.054720
    const supplyAPR = calculateSupplyAPR(USDC_MODEL, 0.80);
    expect(supplyAPR).toBeCloseTo(0.076 * 0.80 * 0.90, 4);
  });

  it('is always less than borrow rate', () => {
    for (let u = 0.01; u <= 1; u += 0.1) {
      const borrowAPR = calculateBorrowAPR(USDC_MODEL, u);
      const supplyAPR = calculateSupplyAPR(USDC_MODEL, u);
      expect(supplyAPR).toBeLessThan(borrowAPR);
    }
  });
});

describe('calculateTierAdjustedBorrowAPR', () => {
  it('applies Diamond 25% discount', () => {
    const base = calculateBorrowAPR(USDC_MODEL, 0.80); // 0.076
    const adjusted = calculateTierAdjustedBorrowAPR(USDC_MODEL, 0.80, 0.25);
    expect(adjusted).toBeCloseTo(base * 0.75);
  });

  it('no discount for Bronze (0%)', () => {
    const base = calculateBorrowAPR(USDC_MODEL, 0.80);
    const adjusted = calculateTierAdjustedBorrowAPR(USDC_MODEL, 0.80, 0.00);
    expect(adjusted).toBeCloseTo(base);
  });
});

describe('APR/APY conversion', () => {
  it('aprToApy converts correctly', () => {
    // e^0.05 - 1 ≈ 0.05127
    expect(aprToApy(0.05)).toBeCloseTo(0.05127, 4);
  });

  it('apyToApr is the inverse of aprToApy', () => {
    const apr = 0.10;
    const apy = aprToApy(apr);
    const backToApr = apyToApr(apy);
    expect(backToApr).toBeCloseTo(apr, 10);
  });

  it('APY is always >= APR for positive rates', () => {
    for (const apr of [0.01, 0.05, 0.10, 0.20, 0.50]) {
      expect(aprToApy(apr)).toBeGreaterThanOrEqual(apr);
    }
  });

  it('handles 0%', () => {
    expect(aprToApy(0)).toBe(0);
    expect(apyToApr(0)).toBe(0);
  });
});

describe('calculatePoolAPY', () => {
  it('returns APY for supply side', () => {
    const apy = calculatePoolAPY(USDC_MODEL, 0.80, 'supply');
    expect(apy).toBeGreaterThan(0);
    expect(apy).toBeLessThan(0.10);
  });

  it('returns APY for borrow side', () => {
    const apy = calculatePoolAPY(USDC_MODEL, 0.80, 'borrow');
    expect(apy).toBeGreaterThan(0.07);
    expect(apy).toBeLessThan(0.10);
  });

  it('applies tier discount on borrow side', () => {
    const baseAPY = calculatePoolAPY(USDC_MODEL, 0.80, 'borrow', 0);
    const discountedAPY = calculatePoolAPY(USDC_MODEL, 0.80, 'borrow', 0.25);
    expect(discountedAPY).toBeLessThan(baseAPY);
  });

  it('tier discount does not affect supply side', () => {
    const normalSupply = calculatePoolAPY(USDC_MODEL, 0.80, 'supply', 0);
    const withDiscount = calculatePoolAPY(USDC_MODEL, 0.80, 'supply', 0.25);
    expect(withDiscount).toBeCloseTo(normalSupply);
  });
});

describe('annualToPerSecond', () => {
  it('converts annual rate to per-second', () => {
    const perSecond = annualToPerSecond(0.05);
    expect(perSecond * SECONDS_PER_YEAR).toBeCloseTo(0.05, 10);
  });
});

describe('accrueInterest', () => {
  it('returns unchanged state when deltaTime = 0', () => {
    const result = accrueInterest(USDC_MODEL, 100, 200, 5, 1.0, 1.0, 1000, 1000);
    expect(result.newBorrowIndex).toBe(1.0);
    expect(result.newSupplyIndex).toBe(1.0);
    expect(result.interestAccrued).toBe(0);
    expect(result.newTotalBorrows).toBe(100);
  });

  it('accrues positive interest over time', () => {
    const oneDay = 86400;
    const result = accrueInterest(USDC_MODEL, 100_000, 200_000, 5_000, 1.0, 1.0, 0, oneDay);
    expect(result.newBorrowIndex).toBeGreaterThan(1.0);
    expect(result.newSupplyIndex).toBeGreaterThan(1.0);
    expect(result.interestAccrued).toBeGreaterThan(0);
    expect(result.newTotalBorrows).toBeGreaterThan(100_000);
  });

  it('reserves accrue at reserveFactor rate', () => {
    const oneDay = 86400;
    const result = accrueInterest(USDC_MODEL, 100_000, 200_000, 0, 1.0, 1.0, 0, oneDay);
    expect(result.reserveAccrued).toBeCloseTo(result.interestAccrued * USDC_MODEL.reserveFactor, 2);
  });

  it('borrow index grows faster than supply index', () => {
    const oneYear = SECONDS_PER_YEAR;
    const result = accrueInterest(USDC_MODEL, 80_000, 100_000, 0, 1.0, 1.0, 0, oneYear);
    expect(result.newBorrowIndex).toBeGreaterThan(result.newSupplyIndex);
  });
});

describe('calculateCurrentBalance', () => {
  it('returns principal when indices are equal', () => {
    expect(calculateCurrentBalance(10_000, 1.0, 1.0)).toBe(10_000);
  });

  it('grows balance when index increases', () => {
    const balance = calculateCurrentBalance(10_000, 1.0, 1.0824);
    expect(balance).toBeCloseTo(10_824);
  });

  it('returns principal for zero entry index', () => {
    expect(calculateCurrentBalance(10_000, 0, 1.5)).toBe(10_000);
  });
});

describe('calculateInterestDelta', () => {
  it('returns 0 when no index change', () => {
    expect(calculateInterestDelta(10_000, 1.0, 1.0)).toBe(0);
  });

  it('returns positive interest for growing index', () => {
    const delta = calculateInterestDelta(10_000, 1.0, 1.05);
    expect(delta).toBeCloseTo(500);
  });
});

describe('calculateHealthFactor (new overload)', () => {
  const makeCollateral = (overrides: Partial<CollateralPositionInput> = {}): CollateralPositionInput => ({
    symbol: 'ETH',
    amount: 10,
    priceUSD: 3000,
    loanToValue: 0.75,
    liquidationThreshold: 0.82,
    liquidationPenalty: 0.05,
    collateralTier: 'crypto',
    ...overrides,
  });

  const makeDebt = (overrides: Partial<DebtPositionInput> = {}): DebtPositionInput => ({
    symbol: 'USDC',
    amount: 15_000,
    priceUSD: 1,
    ...overrides,
  });

  it('returns Infinity for no debts', () => {
    const result = calculateHealthFactor([makeCollateral()], []) as HealthFactorResult;
    expect(result.value).toBe(Infinity);
    expect(result.status).toBe('safe');
  });

  it('calculates correct HF for single collateral', () => {
    // ETH: 10 * 3000 = 30,000. Weighted: 30,000 * 0.82 = 24,600. Debt: 15,000
    // HF = 24,600 / 15,000 = 1.64 — falls in "healthy" range (1.5-2.0)
    const result = calculateHealthFactor([makeCollateral()], [makeDebt()]) as HealthFactorResult;
    expect(result.value).toBeCloseTo(1.64, 1);
    expect(result.status).toBe('healthy');
  });

  it('classifies danger zone correctly', () => {
    const result = calculateHealthFactor(
      [makeCollateral({ amount: 5 })],  // 5 * 3000 * 0.82 = 12,300
      [makeDebt({ amount: 11_000 })],   // HF = 12,300 / 11,000 ≈ 1.118
    ) as HealthFactorResult;
    expect(result.status).toBe('danger');
  });

  it('classifies liquidatable correctly', () => {
    const result = calculateHealthFactor(
      [makeCollateral({ amount: 5 })],  // 5 * 3000 * 0.82 = 12,300
      [makeDebt({ amount: 13_000 })],   // HF = 12,300 / 13,000 ≈ 0.946
    ) as HealthFactorResult;
    expect(result.value).toBeLessThan(1.0);
    expect(result.status).toBe('liquidatable');
  });

  it('applies RWA haircut correctly', () => {
    const rwaCollateral = makeCollateral({ collateralTier: 'rwa' });
    const cryptoCollateral = makeCollateral({ collateralTier: 'crypto' });
    const debt = [makeDebt()];

    const rwaResult = calculateHealthFactor([rwaCollateral], debt) as HealthFactorResult;
    const cryptoResult = calculateHealthFactor([cryptoCollateral], debt) as HealthFactorResult;

    // RWA gets 5% haircut so HF should be lower
    expect(rwaResult.value).toBeLessThan(cryptoResult.value);
  });

  it('applies TIFA haircut correctly', () => {
    const tifaCollateral = makeCollateral({ collateralTier: 'tifa' });
    const cryptoCollateral = makeCollateral({ collateralTier: 'crypto' });
    const debt = [makeDebt()];

    const tifaResult = calculateHealthFactor([tifaCollateral], debt) as HealthFactorResult;
    const cryptoResult = calculateHealthFactor([cryptoCollateral], debt) as HealthFactorResult;

    // TIFA gets 20% haircut
    expect(tifaResult.value).toBeLessThan(cryptoResult.value);
    expect(tifaResult.weightedCollateralValueUSD).toBeCloseTo(
      cryptoResult.weightedCollateralValueUSD * 0.80,
    );
  });

  it('handles multi-collateral positions', () => {
    const collaterals: CollateralPositionInput[] = [
      makeCollateral({ symbol: 'wBTC', amount: 1, priceUSD: 60_000, liquidationThreshold: 0.80 }),
      makeCollateral({ symbol: 'CC', amount: 50_000, priceUSD: 0.50, liquidationThreshold: 0.65 }),
    ];
    const debts: DebtPositionInput[] = [makeDebt({ amount: 40_000 })];

    // wBTC: 60,000 * 0.80 = 48,000. CC: 25,000 * 0.65 = 16,250
    // HF = (48,000 + 16,250) / 40,000 = 1.60625
    const result = calculateHealthFactor(collaterals, debts) as HealthFactorResult;
    expect(result.value).toBeCloseTo(1.6063, 2);
    expect(result.collateralValueUSD).toBeCloseTo(85_000);
  });
});

describe('calculateMaxBorrowable', () => {
  const makeCollateral = (): CollateralPositionInput => ({
    symbol: 'ETH',
    amount: 10,
    priceUSD: 3000,
    loanToValue: 0.75,
    liquidationThreshold: 0.82,
    liquidationPenalty: 0.05,
    collateralTier: 'crypto',
  });

  it('calculates with no existing debts', () => {
    // 10 ETH * $3000 * min(0.75, 0.85) * 1.0 = 10 * 3000 * 0.75 = $22,500
    const max = calculateMaxBorrowable([makeCollateral()], [], 0.85);
    expect(max).toBeCloseTo(22_500);
  });

  it('subtracts existing debt', () => {
    const existingDebt: DebtPositionInput = { symbol: 'USDC', amount: 10_000, priceUSD: 1 };
    const max = calculateMaxBorrowable([makeCollateral()], [existingDebt], 0.85);
    expect(max).toBeCloseTo(12_500);
  });

  it('applies tier LTV cap when lower than asset LTV', () => {
    // Unrated tier: maxLTV = 0.50, asset LTV = 0.75
    // effectiveLTV = min(0.75, 0.50) = 0.50
    // 10 * 3000 * 0.50 = 15,000
    const max = calculateMaxBorrowable([makeCollateral()], [], 0.50);
    expect(max).toBeCloseTo(15_000);
  });

  it('returns 0 when over-borrowed', () => {
    const existingDebt: DebtPositionInput = { symbol: 'USDC', amount: 25_000, priceUSD: 1 };
    const max = calculateMaxBorrowable([makeCollateral()], [existingDebt], 0.85);
    expect(max).toBe(0);
  });
});

describe('calculateLiquidation', () => {
  const collateral: CollateralPositionInput = {
    symbol: 'wBTC',
    amount: 1,
    priceUSD: 60_000,
    loanToValue: 0.73,
    liquidationThreshold: 0.80,
    liquidationPenalty: 0.06,
    collateralTier: 'crypto',
  };

  it('returns not liquidatable when HF >= 1.0', () => {
    const result = calculateLiquidation(collateral, 10_000, 1, 50_000, 1.5);
    expect(result.isLiquidatable).toBe(false);
    expect(result.collateralToSeize).toBe(0);
  });

  it('calculates liquidation correctly for underwater position', () => {
    // HF = 0.9, closeFactor = 50%, totalDebt = $50,000
    // maxDebtToRepay = 50,000 * 0.50 / 1 = 25,000
    // debtToRepay = min(10,000, 25,000) = 10,000
    // collateralSeized = 10,000 * 1.06 / 60,000 = 0.17667 BTC
    const result = calculateLiquidation(collateral, 10_000, 1, 50_000, 0.9);
    expect(result.isLiquidatable).toBe(true);
    expect(result.collateralToSeize).toBeCloseTo(0.17667, 4);
    expect(result.liquidatorProfit).toBeCloseTo(600 * 0.90);
    expect(result.protocolFee).toBeCloseTo(600 * 0.10);
  });

  it('allows full liquidation when HF < 0.5', () => {
    // closeFactor = 100% for critical positions
    const result = calculateLiquidation(collateral, 100_000, 1, 50_000, 0.3);
    expect(result.maxDebtToRepay).toBeCloseTo(50_000); // 100% of debt
  });
});

describe('generateRateCurve', () => {
  it('generates correct number of points', () => {
    const curve = generateRateCurve(USDC_MODEL, 50);
    expect(curve).toHaveLength(51); // 0 to 50 inclusive
  });

  it('starts at 0% utilization and ends at 100%', () => {
    const curve = generateRateCurve(USDC_MODEL, 100);
    expect(curve[0]!.utilization).toBe(0);
    expect(curve[100]!.utilization).toBe(1);
  });

  it('shows kink in the curve', () => {
    const curve = generateRateCurve(USDC_MODEL, 100);

    // Rate increase should be steeper above kink
    const slopeBelowKink = curve[80]!.borrowAPY - curve[79]!.borrowAPY;
    const slopeAboveKink = curve[81]!.borrowAPY - curve[80]!.borrowAPY;
    expect(slopeAboveKink).toBeGreaterThan(slopeBelowKink);
  });

  it('supply APY is always less than borrow APY', () => {
    const curve = generateRateCurve(USDC_MODEL, 100);
    for (let i = 1; i <= 100; i++) {
      expect(curve[i]!.supplyAPY).toBeLessThan(curve[i]!.borrowAPY);
    }
  });
});

describe('simulatePriceImpact', () => {
  const collaterals: CollateralPositionInput[] = [{
    symbol: 'ETH', amount: 10, priceUSD: 3000,
    loanToValue: 0.75, liquidationThreshold: 0.82, liquidationPenalty: 0.05, collateralTier: 'crypto',
  }];
  const debts: DebtPositionInput[] = [{ symbol: 'USDC', amount: 15_000, priceUSD: 1 }];

  it('HF decreases with negative price change', () => {
    const before = calculateHealthFactor(collaterals, debts) as HealthFactorResult;
    const after = simulatePriceImpact(collaterals, debts, -0.20);
    expect(after.value).toBeLessThan(before.value);
  });

  it('HF increases with positive price change', () => {
    const before = calculateHealthFactor(collaterals, debts) as HealthFactorResult;
    const after = simulatePriceImpact(collaterals, debts, 0.20);
    expect(after.value).toBeGreaterThan(before.value);
  });
});

describe('findLiquidationPrice', () => {
  const collaterals: CollateralPositionInput[] = [{
    symbol: 'ETH', amount: 10, priceUSD: 3000,
    loanToValue: 0.75, liquidationThreshold: 0.82, liquidationPenalty: 0.05, collateralTier: 'crypto',
  }];
  const debts: DebtPositionInput[] = [{ symbol: 'USDC', amount: 15_000, priceUSD: 1 }];

  it('returns a negative percentage', () => {
    const drop = findLiquidationPrice(collaterals, debts);
    expect(drop).toBeLessThan(0);
    expect(drop).toBeGreaterThan(-1);
  });

  it('applying the drop gives HF near 1.0', () => {
    const drop = findLiquidationPrice(collaterals, debts, 0.001);
    const result = simulatePriceImpact(collaterals, debts, drop);
    expect(result.value).toBeCloseTo(1.0, 0);
  });

  it('returns 0 for already liquidatable position', () => {
    const bigDebt: DebtPositionInput[] = [{ symbol: 'USDC', amount: 30_000, priceUSD: 1 }];
    expect(findLiquidationPrice(collaterals, bigDebt)).toBe(0);
  });
});

describe('formatRatePercent', () => {
  it('formats correctly', () => {
    expect(formatRatePercent(0.0824)).toBe('8.24%');
    expect(formatRatePercent(0.002, 1)).toBe('0.2%');
  });
});

describe('formatUSD', () => {
  it('formats billions', () => { expect(formatUSD(1_500_000_000)).toBe('$1.50B'); });
  it('formats millions', () => { expect(formatUSD(2_500_000)).toBe('$2.50M'); });
  it('formats thousands', () => { expect(formatUSD(5_000)).toBe('$5.00K'); });
  it('formats small values', () => { expect(formatUSD(42.50)).toBe('$42.50'); });
});

describe('formatHealthFactor', () => {
  it('shows infinity symbol for infinite HF', () => {
    const result = formatHealthFactor(Infinity);
    expect(result.text).toBe('\u221E');
    expect(result.color).toBe('#22C55E');
  });

  it('shows green for safe HF', () => {
    expect(formatHealthFactor(2.5).color).toBe('#22C55E');
  });

  it('shows yellow for caution HF', () => {
    expect(formatHealthFactor(1.3).color).toBe('#F59E0B');
  });

  it('shows red for danger HF', () => {
    expect(formatHealthFactor(1.1).color).toBe('#EF4444');
  });

  it('shows red for liquidatable HF', () => {
    expect(formatHealthFactor(0.9).color).toBe('#EF4444');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATION / SCENARIO TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Full lending scenario', () => {
  it('Alice deposits USDC, Bob borrows, interest accrues, HF computed', () => {
    // Setup: USDC pool with 200k deposits, 80k borrows
    const totalDeposits = 200_000;
    const totalBorrows = 80_000;

    // Step 1: Calculate utilization
    const utilization = calculateUtilization(totalBorrows, totalDeposits);
    expect(utilization).toBeCloseTo(0.40);

    // Step 2: Calculate rates
    const borrowAPR = calculateBorrowAPR(USDC_MODEL, utilization);
    const supplyAPR = calculateSupplyAPR(USDC_MODEL, utilization);
    expect(borrowAPR).toBeCloseTo(0.02 + 0.40 * 0.07); // 0.048
    expect(supplyAPR).toBeLessThan(borrowAPR);

    // Step 3: Bob's collateral is 2 ETH @ $3,420
    const collaterals: CollateralPositionInput[] = [{
      symbol: 'ETH', amount: 2, priceUSD: 3_420,
      loanToValue: 0.75, liquidationThreshold: 0.82, liquidationPenalty: 0.05,
      collateralTier: 'crypto',
    }];
    const debts: DebtPositionInput[] = [{ symbol: 'USDC', amount: 4_000, priceUSD: 1 }];

    const hf = calculateHealthFactor(collaterals, debts) as HealthFactorResult;
    // 2 * 3420 * 0.82 / 4000 = 5608.8 / 4000 = 1.4022
    expect(hf.value).toBeCloseTo(1.4022, 1);
    expect(hf.status).toBe('caution');

    // Step 4: Accrue 30 days of interest
    const thirtyDays = 30 * 86400;
    const accrual = accrueInterest(USDC_MODEL, totalBorrows, totalDeposits, 0, 1.0, 1.0, 0, thirtyDays);
    expect(accrual.newTotalBorrows).toBeGreaterThan(totalBorrows);
    expect(accrual.newBorrowIndex).toBeGreaterThan(1.0);

    // Step 5: Bob's balance grows with interest
    const bobDebtNow = calculateCurrentBalance(4_000, 1.0, accrual.newBorrowIndex);
    expect(bobDebtNow).toBeGreaterThan(4_000);
  });
});

describe('Asset-specific rate model differences', () => {
  it('wBTC has lower base rate than USDC', () => {
    expect(WBTC_MODEL.baseRate).toBeLessThan(USDC_MODEL.baseRate);
  });

  it('wBTC has higher jump multiplier than USDC', () => {
    expect(WBTC_MODEL.jumpMultiplier).toBeGreaterThan(USDC_MODEL.jumpMultiplier);
  });

  it('wBTC has lower kink than USDC', () => {
    expect(WBTC_MODEL.kink).toBeLessThan(USDC_MODEL.kink);
  });

  it('at same utilization, USDC has lower borrow rate below kink', () => {
    const util = 0.50;
    const usdcRate = calculateBorrowAPR(USDC_MODEL, util);
    const wbtcRate = calculateBorrowAPR(WBTC_MODEL, util);
    // USDC: 0.02 + 0.50 * 0.07 = 0.055
    // wBTC: 0.01 + 0.50 * 0.04 = 0.030
    expect(wbtcRate).toBeLessThan(usdcRate);
  });
});
