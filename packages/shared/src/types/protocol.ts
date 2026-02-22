import type { CollateralConfig, InterestRateModel } from './core';

/** Protocol-wide configuration */
export interface ProtocolConfig {
  /** Protocol operator party */
  protocolOperator: string;
  /** Protocol version string */
  version: string;
  /** Per-asset-type collateral parameters */
  collateralConfigs: CollateralConfig[];
  /** Pool to interest rate model mapping */
  interestRateModels: Array<[string, InterestRateModel]>;
  /** Protocol fee rate (e.g., 0.001 = 0.1%) */
  protocolFeeRate: string;
  /** Flash loan fee rate (e.g., 0.0009) */
  flashLoanFeeRate: string;
  /** Global minimum collateral ratio (e.g., 1.10) */
  minCollateralRatio: string;
  /** Liquidator reward incentive (e.g., 0.05) */
  liquidationIncentive: string;
  /** Oracle provider party */
  oracleProvider: string;
  /** Credit assessor party */
  creditAssessor: string;
  /** Protocol treasury party */
  treasuryAddress: string;
  /** Emergency pause flag */
  paused: boolean;
  /** Last config update timestamp (ISO 8601) */
  lastUpdated: string;
}

/** TIFA collateral bridge */
export interface TIFACollateralBridge {
  /** Bridge identifier */
  bridgeId: string;
  /** Protocol operator party */
  protocolOperator: string;
  /** Borrower party */
  borrower: string;
  /** TIFA token administrator party */
  tifaTokenAdmin: string;
  /** Receivable identifier */
  receivableId: string;
  /** Original invoice value in USD (Decimal as string) */
  originalInvoiceValueUSD: string;
  /** Discounted value in USD (Decimal as string) */
  discountedValueUSD: string;
  /** Maturity date (ISO 8601) */
  maturityDate: string;
  /** Debtor credit rating */
  debtorCreditRating: string;
  /** Haircut percentage (Decimal as string) */
  haircut: string;
  /** Effective collateral value in USD (Decimal as string) */
  effectiveCollateralUSD: string;
  /** Bridge status */
  status: BridgeStatus;
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
}

/** TIFA bridge status */
export type BridgeStatus =
  | 'Pending'
  | 'Active'
  | 'Matured'
  | 'Released'
  | 'Liquidated';
