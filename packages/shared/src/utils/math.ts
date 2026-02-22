/**
 * Calculate Annual Percentage Yield from a variable interest rate model.
 * Uses the compound interest formula: APY = (1 + rate/n)^n - 1
 * where n is the number of compounding periods per year.
 */
export function calculateAPY(ratePerPeriod: number, periodsPerYear: number = 365): number {
  return Math.pow(1 + ratePerPeriod / periodsPerYear, periodsPerYear) - 1;
}

/**
 * Calculate the utilization rate of a lending pool.
 * utilization = totalBorrows / totalDeposits
 */
export function calculateUtilization(totalBorrows: number, totalDeposits: number): number {
  if (totalDeposits === 0) return 0;
  return totalBorrows / totalDeposits;
}

/**
 * Calculate the borrow interest rate based on the utilization and rate model.
 * Below kink: baseRate + utilization * multiplier
 * Above kink: baseRate + kink * multiplier + (utilization - kink) * jumpMultiplier
 */
export function calculateBorrowRate(
  utilization: number,
  baseRate: number,
  multiplier: number,
  kink: number,
  jumpMultiplier: number
): number {
  if (utilization <= kink) {
    return baseRate + utilization * multiplier;
  }
  return baseRate + kink * multiplier + (utilization - kink) * jumpMultiplier;
}

/**
 * Calculate the supply interest rate.
 * supplyRate = borrowRate * utilization * (1 - protocolFeeRate)
 */
export function calculateSupplyRate(
  borrowRate: number,
  utilization: number,
  protocolFeeRate: number = 0.001
): number {
  return borrowRate * utilization * (1 - protocolFeeRate);
}

/**
 * Calculate health factor for a borrow position.
 * HF = (sum of collateral_i * liquidationThreshold_i) / totalBorrowValue
 */
export function calculateHealthFactor(
  collateralValues: Array<{ valueUSD: number; liquidationThreshold: number }>,
  totalBorrowValueUSD: number
): number {
  if (totalBorrowValueUSD === 0) return Infinity;

  const weightedCollateral = collateralValues.reduce(
    (sum, c) => sum + c.valueUSD * c.liquidationThreshold,
    0
  );

  return weightedCollateral / totalBorrowValueUSD;
}

/**
 * Calculate weighted loan-to-value ratio.
 * weightedLTV = totalBorrowValue / totalCollateralValue
 */
export function calculateWeightedLTV(
  totalBorrowValueUSD: number,
  totalCollateralValueUSD: number
): number {
  if (totalCollateralValueUSD === 0) return 0;
  return totalBorrowValueUSD / totalCollateralValueUSD;
}

/**
 * Calculate the liquidation price for a specific collateral asset.
 * The price at which the health factor drops to 1.0.
 */
export function calculateLiquidationPrice(
  borrowValueUSD: number,
  collateralAmount: number,
  liquidationThreshold: number,
  otherCollateralWeightedValue: number = 0
): number {
  if (collateralAmount === 0 || liquidationThreshold === 0) return 0;
  return (borrowValueUSD - otherCollateralWeightedValue) / (collateralAmount * liquidationThreshold);
}

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
  const { loansCompleted, loansDefaulted, onTimeRepayments, lateRepayments, totalVolumeRepaid, lowestHealthFactor, secLendingDealsCompleted } = params;

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
