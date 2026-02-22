// ============================================================================
// DUALIS FINANCE — Financial Mathematics Engine
// ============================================================================
// All rates are expressed as DECIMALS (e.g., 0.08 = 8%)
// All time is in SECONDS
// All amounts are in BASE UNITS (Canton uses decimal, not wei/satoshi)
// ============================================================================

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

export const SECONDS_PER_YEAR = 365.25 * 24 * 60 * 60; // 31,557,600
export const CLOSE_FACTOR_NORMAL = 0.50;
export const CLOSE_FACTOR_CRITICAL = 1.00;
export const CRITICAL_HF_THRESHOLD = 0.50;
export const RESERVE_SPLIT_LIQUIDATOR = 0.90;
export const RESERVE_SPLIT_PROTOCOL = 0.10;

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface InterestRateModelConfig {
  type: 'VariableRate';
  baseRate: number;        // Annual base rate (decimal)
  multiplier: number;      // Slope below kink (decimal)
  kink: number;            // Optimal utilization (0-1)
  jumpMultiplier: number;  // Slope above kink (decimal)
  reserveFactor: number;   // Protocol reserve cut (0-1)
}

export interface CollateralPositionInput {
  symbol: string;
  amount: number;
  priceUSD: number;
  loanToValue: number;
  liquidationThreshold: number;
  liquidationPenalty: number;
  collateralTier: 'crypto' | 'rwa' | 'tifa';
}

export interface DebtPositionInput {
  symbol: string;
  amount: number;
  priceUSD: number;
}

export type HealthFactorStatus = 'safe' | 'healthy' | 'caution' | 'danger' | 'liquidatable';

export interface HealthFactorResult {
  value: number;
  collateralValueUSD: number;
  weightedCollateralValueUSD: number;
  borrowValueUSD: number;
  weightedLTV: number;
  status: HealthFactorStatus;
}

export interface LiquidationCalcResult {
  isLiquidatable: boolean;
  maxDebtToRepay: number;
  collateralToSeize: number;
  liquidatorProfit: number;
  protocolFee: number;
}

export interface AccrualResult {
  newBorrowIndex: number;
  newSupplyIndex: number;
  interestAccrued: number;
  reserveAccrued: number;
  newTotalBorrows: number;
  newTotalReserves: number;
}

// ─── COLLATERAL TIER HAIRCUTS ───────────────────────────────────────────────

const COLLATERAL_TIER_HAIRCUTS: Record<string, number> = {
  crypto: 1.00,  // No haircut
  rwa: 0.95,     // 5% settlement risk
  tifa: 0.80,    // 20% illiquidity risk
};

// ─── UTILIZATION ────────────────────────────────────────────────────────────

/**
 * Calculate pool utilization rate.
 * U = totalBorrows / totalDeposits
 * Returns 0 for empty pools. Capped at 1.
 */
export function calculateUtilization(
  totalBorrows: number,
  totalDeposits: number,
): number {
  if (totalDeposits <= 0) return 0;
  return Math.min(totalBorrows / totalDeposits, 1);
}

// ─── INTEREST RATES (Jump Rate Model) ───────────────────────────────────────

/**
 * Calculate borrow APR using Jump Rate Model.
 * Piecewise linear: normal slope below kink, steep slope above.
 *
 * Below kink: baseRate + utilization * multiplier
 * Above kink: baseRate + kink * multiplier + (utilization - kink) * jumpMultiplier
 */
export function calculateBorrowRate(
  utilization: number,
  baseRate: number,
  multiplier: number,
  kink: number,
  jumpMultiplier: number,
): number {
  if (utilization <= kink) {
    return baseRate + utilization * multiplier;
  }
  return baseRate + kink * multiplier + (utilization - kink) * jumpMultiplier;
}

/**
 * Calculate borrow APR from a model config.
 */
export function calculateBorrowAPR(
  model: InterestRateModelConfig,
  utilization: number,
): number {
  return calculateBorrowRate(
    utilization,
    model.baseRate,
    model.multiplier,
    model.kink,
    model.jumpMultiplier,
  );
}

/**
 * Calculate supply APR.
 * Suppliers earn a portion of borrow interest, reduced by reserve factor.
 */
export function calculateSupplyRate(
  borrowRate: number,
  utilization: number,
  protocolFeeRate: number = 0.001,
): number {
  return borrowRate * utilization * (1 - protocolFeeRate);
}

/**
 * Calculate supply APR from a model config.
 */
export function calculateSupplyAPR(
  model: InterestRateModelConfig,
  utilization: number,
): number {
  const borrowAPR = calculateBorrowAPR(model, utilization);
  return borrowAPR * utilization * (1 - model.reserveFactor);
}

/**
 * Calculate borrow APR adjusted for credit tier discount.
 */
export function calculateTierAdjustedBorrowAPR(
  model: InterestRateModelConfig,
  utilization: number,
  tierDiscount: number,
): number {
  const baseAPR = calculateBorrowAPR(model, utilization);
  return baseAPR * (1 - tierDiscount);
}

// ─── APR ↔ APY CONVERSION ──────────────────────────────────────────────────

/**
 * Convert APR to APY using continuous compounding approximation.
 * APY = e^APR - 1
 */
export function aprToApy(apr: number): number {
  return Math.exp(apr) - 1;
}

/**
 * Convert APY to APR.
 * APR = ln(1 + APY)
 */
export function apyToApr(apy: number): number {
  return Math.log(1 + apy);
}

/**
 * Legacy APY calculation: APY = (1 + rate/n)^n - 1
 * Kept for backward compatibility.
 */
export function calculateAPY(
  ratePerPeriod: number,
  periodsPerYear: number = 365,
): number {
  return Math.pow(1 + ratePerPeriod / periodsPerYear, periodsPerYear) - 1;
}

/**
 * Unified APY calculator — public API used by services.
 * @param model - Interest rate model configuration
 * @param utilization - Current utilization (0-1)
 * @param side - 'supply' or 'borrow'
 * @param tierDiscount - Optional credit tier rate discount (0-1)
 */
export function calculatePoolAPY(
  model: InterestRateModelConfig,
  utilization: number,
  side: 'supply' | 'borrow',
  tierDiscount: number = 0,
): number {
  let apr: number;

  if (side === 'supply') {
    apr = calculateSupplyAPR(model, utilization);
  } else {
    apr = calculateBorrowAPR(model, utilization);
    if (tierDiscount > 0) {
      apr = apr * (1 - tierDiscount);
    }
  }

  return aprToApy(apr);
}

/**
 * Convert annual rate to per-second rate.
 */
export function annualToPerSecond(annualRate: number): number {
  return annualRate / SECONDS_PER_YEAR;
}

// ─── INTEREST ACCRUAL (Index-Based) ─────────────────────────────────────────

/**
 * Accrue interest for a pool since last update.
 * Uses index-based system for O(1) updates.
 */
export function accrueInterest(
  model: InterestRateModelConfig,
  totalBorrows: number,
  totalDeposits: number,
  totalReserves: number,
  borrowIndex: number,
  supplyIndex: number,
  lastAccrualTimestamp: number,
  currentTimestamp: number,
): AccrualResult {
  const deltaTime = currentTimestamp - lastAccrualTimestamp;

  if (deltaTime <= 0) {
    return {
      newBorrowIndex: borrowIndex,
      newSupplyIndex: supplyIndex,
      interestAccrued: 0,
      reserveAccrued: 0,
      newTotalBorrows: totalBorrows,
      newTotalReserves: totalReserves,
    };
  }

  const utilization = calculateUtilization(totalBorrows, totalDeposits);
  const borrowRatePerSecond = annualToPerSecond(calculateBorrowAPR(model, utilization));
  const supplyRatePerSecond = annualToPerSecond(calculateSupplyAPR(model, utilization));

  const borrowInterestFactor = borrowRatePerSecond * deltaTime;
  const supplyInterestFactor = supplyRatePerSecond * deltaTime;

  const newBorrowIndex = borrowIndex * (1 + borrowInterestFactor);
  const newSupplyIndex = supplyIndex * (1 + supplyInterestFactor);

  const interestAccrued = totalBorrows * borrowInterestFactor;
  const reserveAccrued = interestAccrued * model.reserveFactor;

  return {
    newBorrowIndex,
    newSupplyIndex,
    interestAccrued,
    reserveAccrued,
    newTotalBorrows: totalBorrows + interestAccrued,
    newTotalReserves: totalReserves + reserveAccrued,
  };
}

/**
 * Calculate a user's current balance using index ratio.
 */
export function calculateCurrentBalance(
  principal: number,
  indexAtEntry: number,
  currentIndex: number,
): number {
  if (indexAtEntry <= 0) return principal;
  return principal * (currentIndex / indexAtEntry);
}

/**
 * Calculate interest earned/owed since entry.
 */
export function calculateInterestDelta(
  principal: number,
  indexAtEntry: number,
  currentIndex: number,
): number {
  return calculateCurrentBalance(principal, indexAtEntry, currentIndex) - principal;
}

// ─── HEALTH FACTOR ──────────────────────────────────────────────────────────

/**
 * Calculate Health Factor for a multi-collateral position.
 * Accounts for collateral tier haircuts (crypto/rwa/tifa).
 *
 * HF = Σ(collateral_i × price_i × liqThreshold_i × tierHaircut_i) / Σ(debt_j × price_j)
 */
export function calculateHealthFactor(
  collaterals: CollateralPositionInput[] | Array<{ valueUSD: number; liquidationThreshold: number }>,
  debts: DebtPositionInput[] | number,
): HealthFactorResult | number {
  // Legacy signature: (collateralValues, totalBorrowValueUSD)
  if (typeof debts === 'number') {
    const collateralValues = collaterals as Array<{ valueUSD: number; liquidationThreshold: number }>;
    const totalBorrowValueUSD = debts;
    if (totalBorrowValueUSD === 0) return Infinity;
    const weightedCollateral = collateralValues.reduce(
      (sum, c) => sum + c.valueUSD * c.liquidationThreshold,
      0,
    );
    return weightedCollateral / totalBorrowValueUSD;
  }

  // New signature: full CollateralPositionInput[] + DebtPositionInput[]
  const collateralInputs = collaterals as CollateralPositionInput[];
  const debtInputs = debts as DebtPositionInput[];

  const collateralValueUSD = collateralInputs.reduce(
    (sum, c) => sum + c.amount * c.priceUSD,
    0,
  );

  const weightedCollateralValueUSD = collateralInputs.reduce((sum, c) => {
    const tierHaircut = COLLATERAL_TIER_HAIRCUTS[c.collateralTier] ?? 1;
    return sum + c.amount * c.priceUSD * c.liquidationThreshold * tierHaircut;
  }, 0);

  const borrowValueUSD = debtInputs.reduce(
    (sum, d) => sum + d.amount * d.priceUSD,
    0,
  );

  let value: number;
  if (borrowValueUSD <= 0) {
    value = Infinity;
  } else {
    value = weightedCollateralValueUSD / borrowValueUSD;
  }

  const weightedLTV = collateralValueUSD > 0
    ? borrowValueUSD / collateralValueUSD
    : 0;

  let status: HealthFactorStatus;
  if (value <= 1.0) status = 'liquidatable';
  else if (value <= 1.2) status = 'danger';
  else if (value <= 1.5) status = 'caution';
  else if (value <= 2.0) status = 'healthy';
  else status = 'safe';

  return {
    value: Number(isFinite(value) ? value.toFixed(4) : Infinity),
    collateralValueUSD: Number(collateralValueUSD.toFixed(2)),
    weightedCollateralValueUSD: Number(weightedCollateralValueUSD.toFixed(2)),
    borrowValueUSD: Number(borrowValueUSD.toFixed(2)),
    weightedLTV: Number(weightedLTV.toFixed(4)),
    status,
  };
}

/**
 * Calculate weighted LTV ratio.
 */
export function calculateWeightedLTV(
  totalBorrowValueUSD: number,
  totalCollateralValueUSD: number,
): number {
  if (totalCollateralValueUSD === 0) return 0;
  return totalBorrowValueUSD / totalCollateralValueUSD;
}

// ─── MAXIMUM BORROWABLE ────────────────────────────────────────────────────

/**
 * Calculate maximum additional amount a user can borrow (in USD).
 * Accounts for existing debts, credit tier limits, and collateral tier haircuts.
 */
export function calculateMaxBorrowable(
  collaterals: CollateralPositionInput[],
  existingDebts: DebtPositionInput[],
  tierMaxLTV: number,
): number {
  const maxBorrowCapacity = collaterals.reduce((sum, c) => {
    const effectiveLTV = Math.min(c.loanToValue, tierMaxLTV);
    const tierHaircut = COLLATERAL_TIER_HAIRCUTS[c.collateralTier] ?? 1;
    return sum + c.amount * c.priceUSD * effectiveLTV * tierHaircut;
  }, 0);

  const existingDebtUSD = existingDebts.reduce(
    (sum, d) => sum + d.amount * d.priceUSD,
    0,
  );

  return Math.max(0, maxBorrowCapacity - existingDebtUSD);
}

// ─── LIQUIDATION ────────────────────────────────────────────────────────────

/**
 * Calculate the liquidation price for a specific collateral asset.
 * The price at which the health factor drops to 1.0.
 */
export function calculateLiquidationPrice(
  borrowValueUSD: number,
  collateralAmount: number,
  liquidationThreshold: number,
  otherCollateralWeightedValue: number = 0,
): number {
  if (collateralAmount === 0 || liquidationThreshold === 0) return 0;
  return (borrowValueUSD - otherCollateralWeightedValue) / (collateralAmount * liquidationThreshold);
}

/**
 * Calculate liquidation parameters for an underwater position.
 */
export function calculateLiquidation(
  collateral: CollateralPositionInput,
  debtToRepay: number,
  debtPriceUSD: number,
  totalDebtUSD: number,
  healthFactor: number,
): LiquidationCalcResult {
  if (healthFactor >= 1.0) {
    return {
      isLiquidatable: false,
      maxDebtToRepay: 0,
      collateralToSeize: 0,
      liquidatorProfit: 0,
      protocolFee: 0,
    };
  }

  const closeFactor = healthFactor < CRITICAL_HF_THRESHOLD
    ? CLOSE_FACTOR_CRITICAL
    : CLOSE_FACTOR_NORMAL;

  const maxDebtToRepay = totalDebtUSD * closeFactor / debtPriceUSD;
  const actualDebtToRepay = Math.min(debtToRepay, maxDebtToRepay);
  const debtRepaidUSD = actualDebtToRepay * debtPriceUSD;

  const collateralSeizedUSD = debtRepaidUSD * (1 + collateral.liquidationPenalty);
  const collateralToSeize = collateralSeizedUSD / collateral.priceUSD;

  const totalPenalty = debtRepaidUSD * collateral.liquidationPenalty;
  const liquidatorProfit = totalPenalty * RESERVE_SPLIT_LIQUIDATOR;
  const protocolFee = totalPenalty * RESERVE_SPLIT_PROTOCOL;

  return {
    isLiquidatable: true,
    maxDebtToRepay,
    collateralToSeize,
    liquidatorProfit,
    protocolFee,
  };
}

// ─── RATE CURVE GENERATION (for charts) ─────────────────────────────────────

/**
 * Generate rate curve data points for visualization.
 * Returns array of {utilization, borrowAPY, supplyAPY} from 0% to 100%.
 */
export function generateRateCurve(
  model: InterestRateModelConfig,
  points: number = 100,
): Array<{ utilization: number; borrowAPY: number; supplyAPY: number }> {
  const curve: Array<{ utilization: number; borrowAPY: number; supplyAPY: number }> = [];

  for (let i = 0; i <= points; i++) {
    const utilization = i / points;
    curve.push({
      utilization,
      borrowAPY: calculatePoolAPY(model, utilization, 'borrow'),
      supplyAPY: calculatePoolAPY(model, utilization, 'supply'),
    });
  }

  return curve;
}

// ─── POSITION SIMULATION (for UI sliders) ──────────────────────────────────

/**
 * Simulate what happens at different price levels.
 * Used by frontend's "Price Impact" slider component.
 */
export function simulatePriceImpact(
  collaterals: CollateralPositionInput[],
  debts: DebtPositionInput[],
  priceChangePercent: number,
): HealthFactorResult {
  const adjustedCollaterals = collaterals.map(c => ({
    ...c,
    priceUSD: c.priceUSD * (1 + priceChangePercent),
  }));

  return calculateHealthFactor(adjustedCollaterals, debts) as HealthFactorResult;
}

/**
 * Find the price drop percentage that triggers liquidation.
 * Binary search for the exact threshold.
 */
export function findLiquidationPrice(
  collaterals: CollateralPositionInput[],
  debts: DebtPositionInput[],
  tolerance: number = 0.001,
): number {
  let low = -1;
  let high = 0;

  const current = calculateHealthFactor(collaterals, debts) as HealthFactorResult;
  if (current.value <= 1.0) return 0;

  const worst = simulatePriceImpact(collaterals, debts, -0.99);
  if (worst.value > 1.0) return -1;

  while (high - low > tolerance) {
    const mid = (low + high) / 2;
    const result = simulatePriceImpact(collaterals, debts, mid);

    if (result.value > 1.0) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return low;
}

// ─── CREDIT SCORE ───────────────────────────────────────────────────────────

/**
 * Calculate credit score based on the protocol's scoring formula.
 */
export function calculateCreditScore(params: {
  loansCompleted: number;
  loansDefaulted: number;
  onTimeRepayments: number;
  lateRepayments: number;
  totalVolumeRepaid: number;
  lowestHealthFactor: number;
  secLendingDealsCompleted: number;
}): number {
  const {
    loansCompleted, loansDefaulted, onTimeRepayments, lateRepayments,
    totalVolumeRepaid, lowestHealthFactor, secLendingDealsCompleted,
  } = params;

  const totalLoans = loansCompleted + loansDefaulted;
  const completionScore = totalLoans > 0 ? (loansCompleted / totalLoans) * 300 : 0;

  const totalRepayments = onTimeRepayments + lateRepayments;
  const timelinessScore = totalRepayments > 0 ? (onTimeRepayments / totalRepayments) * 250 : 0;

  const volumeScore = Math.min(200, Math.log10(totalVolumeRepaid + 1) * 40);

  let healthScore = 0;
  if (lowestHealthFactor >= 1.5) healthScore = 150;
  else if (lowestHealthFactor >= 1.2) healthScore = 100;
  else if (lowestHealthFactor >= 1.0) healthScore = 50;

  const secLendingScore = Math.min(100, secLendingDealsCompleted * 10);

  return Math.round(completionScore + timelinessScore + volumeScore + healthScore + secLendingScore);
}

// ─── FORMATTING UTILITIES ───────────────────────────────────────────────────

/**
 * Format a decimal rate as a percentage string.
 */
export function formatRatePercent(rate: number, decimals: number = 2): string {
  return `${(rate * 100).toFixed(decimals)}%`;
}

/**
 * Format USD value with appropriate precision.
 */
export function formatUSD(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

/**
 * Format health factor with color status.
 */
export function formatHealthFactor(hf: number): { text: string; color: string } {
  if (!isFinite(hf)) return { text: '\u221E', color: '#22C55E' };

  const text = hf.toFixed(2);
  let color: string;

  if (hf > 2.0) color = '#22C55E';
  else if (hf > 1.5) color = '#22C55E';
  else if (hf > 1.2) color = '#F59E0B';
  else if (hf > 1.0) color = '#EF4444';
  else color = '#EF4444';

  return { text, color };
}
