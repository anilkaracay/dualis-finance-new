/** Asset classification types supported by the protocol */
export type InstrumentType =
  | 'Stablecoin'
  | 'CryptoCurrency'
  | 'TokenizedEquity'
  | 'TokenizedBond'
  | 'TokenizedTreasury'
  | 'TokenizedReceivable'
  | 'LPToken';

/** On-chain asset representation */
export interface Asset {
  /** CIP-56 token administrator */
  tokenAdmin: string;
  /** Token symbol (e.g., "USDC", "wBTC") */
  symbol: string;
  /** Token amount (Decimal as string for precision) */
  amount: string;
  /** Asset classification */
  instrumentType: InstrumentType;
}

/** Interest rate model configuration */
export type InterestRateModel =
  | { type: 'FixedRate'; rate: string }
  | { type: 'VariableRate'; baseRate: string; multiplier: string; kink: string; jumpMultiplier: string }
  | { type: 'OracleLinked'; benchmarkId: string; spread: string };

/** Per-asset collateral configuration */
export interface CollateralConfig {
  /** Asset type this config applies to */
  instrumentType: InstrumentType;
  /** Maximum loan-to-value ratio (e.g., 0.75 = 75%) */
  loanToValue: string;
  /** Liquidation trigger threshold (e.g., 0.82) */
  liquidationThreshold: string;
  /** Liquidation penalty (e.g., 0.05 = 5%) */
  liquidationPenalty: string;
  /** Maximum borrowable amount, null if unlimited */
  borrowCap: string | null;
}

/** Health factor for a borrow position */
export interface HealthFactor {
  /** Health factor value (>1 safe, <1 liquidatable) */
  value: string;
  /** Total collateral in USD */
  collateralValueUSD: string;
  /** Total debt in USD */
  borrowValueUSD: string;
  /** Weighted loan-to-value ratio */
  weightedLTV: string;
  /** Calculation timestamp (ISO 8601) */
  timestamp: string;
}

/** Credit tier classification */
export type CreditTier = 'Diamond' | 'Gold' | 'Silver' | 'Bronze' | 'Unrated';

/** Canton contract wrapper for API responses */
export interface CantonContract<T> {
  /** Unique contract identifier */
  contractId: string;
  /** Daml template identifier */
  templateId: string;
  /** Contract payload data */
  payload: T;
  /** Contract signatories */
  signatories: string[];
  /** Contract observers */
  observers: string[];
  /** Contract creation timestamp (ISO 8601) */
  createdAt: string;
}
