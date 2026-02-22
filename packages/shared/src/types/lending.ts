import type { Asset, InterestRateModel, HealthFactor, CreditTier } from './core';

/** Lending pool contract */
export interface LendingPool {
  /** Unique pool identifier */
  poolId: string;
  /** Protocol operator party */
  protocolOperator: string;
  /** Pool's underlying asset */
  asset: Asset;
  /** Total deposited amount */
  totalDeposits: string;
  /** Total borrowed amount */
  totalBorrows: string;
  /** Protocol reserves */
  totalReserves: string;
  /** Interest rate calculation model */
  interestRateModel: InterestRateModel;
  /** Last interest accrual timestamp (ISO 8601) */
  lastAccrualTimestamp: string;
  /** Compound borrow index */
  accumulatedBorrowIndex: string;
  /** Compound supply index */
  accumulatedSupplyIndex: string;
  /** List of depositor parties */
  depositors: string[];
  /** Pool active flag */
  isActive: boolean;
}

/** Individual lending position */
export interface LendingPosition {
  /** Position identifier (format: "{poolId}-{lenderParty}") */
  positionId: string;
  /** Reference to parent pool */
  pool: LendingPool;
  /** Depositor party */
  lender: string;
  /** Original deposit amount */
  depositedAmount: string;
  /** Pool shares owned */
  shares: string;
  /** Deposit timestamp (ISO 8601) */
  depositTimestamp: string;
  /** Last reward claim timestamp (ISO 8601) */
  lastClaimTimestamp: string;
}

/** Collateral position for a borrow */
export interface CollateralPosition {
  /** Position identifier */
  positionId: string;
  /** Protocol operator party */
  protocolOperator: string;
  /** Borrower party */
  borrower: string;
  /** Deposited collateral assets */
  collateralAssets: Asset[];
  /** USD value per collateral asset */
  collateralValuesUSD: string[];
  /** Total collateral value in USD */
  totalCollateralUSD: string;
  /** Whether collateral is locked for a borrow */
  lockedForBorrow: boolean;
  /** Last oracle valuation timestamp (ISO 8601) */
  oracleTimestamp: string;
}

/** Active borrow position */
export interface BorrowPosition {
  /** Position identifier */
  positionId: string;
  /** Protocol operator party */
  protocolOperator: string;
  /** Borrower party */
  borrower: string;
  /** Source lending pool identifier */
  lendingPoolId: string;
  /** Linked collateral position identifier */
  collateralPositionId: string;
  /** Borrowed asset */
  borrowedAsset: Asset;
  /** Original borrow amount */
  borrowedAmountPrincipal: string;
  /** Borrow index at position creation */
  borrowIndexAtOpen: string;
  /** Borrow timestamp (ISO 8601) */
  borrowTimestamp: string;
  /** Accumulated interest */
  interestAccrued: string;
  /** Current health factor */
  healthFactor: HealthFactor;
  /** Borrower's credit tier at time of borrow */
  creditTier: CreditTier;
  /** Whether health factor is below 1.0 */
  isLiquidatable: boolean;
}
