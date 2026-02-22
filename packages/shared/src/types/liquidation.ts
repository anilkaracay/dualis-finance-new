/** Liquidation tier classification */
export type LiquidationTier =
  | 'MarginCall'
  | 'SoftLiquidation'
  | 'ForcedLiquidation'
  | 'FullLiquidation';

/** Liquidation trigger contract */
export interface LiquidationTrigger {
  /** Unique trigger identifier */
  triggerId: string;
  /** Protocol operator party */
  protocolOperator: string;
  /** Liquidator party */
  liquidator: string;
  /** Borrower party */
  borrower: string;
  /** Borrow position being liquidated */
  borrowPositionId: string;
  /** Collateral position being seized */
  collateralPositionId: string;
  /** Health factor at trigger time (Decimal as string) */
  healthFactor: string;
  /** Liquidation tier */
  tier: LiquidationTier;
  /** Amount to liquidate (Decimal as string) */
  liquidationAmount: string;
  /** Reward for liquidator (Decimal as string) */
  liquidatorReward: string;
  /** Protocol penalty (Decimal as string) */
  protocolPenalty: string;
  /** Trigger timestamp (ISO 8601) */
  triggeredAt: string;
}

/** Result of an executed liquidation */
export interface LiquidationResult {
  /** Unique result identifier */
  resultId: string;
  /** Protocol operator party */
  protocolOperator: string;
  /** Liquidator party */
  liquidator: string;
  /** Borrower party */
  borrower: string;
  /** Liquidated borrow position */
  borrowPositionId: string;
  /** Amount of collateral seized (Decimal as string) */
  collateralSeized: string;
  /** Reward paid to liquidator (Decimal as string) */
  liquidatorRewardPaid: string;
  /** Fee paid to protocol (Decimal as string) */
  protocolFeePaid: string;
  /** Amount returned to borrower (Decimal as string) */
  returnedToBorrower: string;
  /** Execution timestamp (ISO 8601) */
  executedAt: string;
  /** Liquidation tier applied */
  tier: LiquidationTier;
}
