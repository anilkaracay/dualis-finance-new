/**
 * Per-asset collateral parameters.
 * Defines LTV, liquidation thresholds, penalties, and caps.
 */
export interface CollateralParamsConfig {
  loanToValue: number;
  liquidationThreshold: number;
  liquidationPenalty: number;
  borrowCap: number;
  supplyCap: number;
  isCollateralEnabled: boolean;
  isBorrowEnabled: boolean;
  /** Collateral tier classification for haircut calculations */
  collateralTier: 'crypto' | 'rwa' | 'tifa';
}

export const COLLATERAL_PARAMS: Record<string, CollateralParamsConfig> = {
  'USDC': {
    loanToValue: 0.80,
    liquidationThreshold: 0.85,
    liquidationPenalty: 0.04,
    borrowCap: 500_000_000,
    supplyCap: 1_000_000_000,
    isCollateralEnabled: true,
    isBorrowEnabled: true,
    collateralTier: 'crypto',
  },
  'wBTC': {
    loanToValue: 0.73,
    liquidationThreshold: 0.80,
    liquidationPenalty: 0.06,
    borrowCap: 50_000_000,
    supplyCap: 100_000_000,
    isCollateralEnabled: true,
    isBorrowEnabled: true,
    collateralTier: 'crypto',
  },
  'wETH': {
    loanToValue: 0.75,
    liquidationThreshold: 0.82,
    liquidationPenalty: 0.05,
    borrowCap: 100_000_000,
    supplyCap: 200_000_000,
    isCollateralEnabled: true,
    isBorrowEnabled: true,
    collateralTier: 'crypto',
  },
  'ETH': {
    loanToValue: 0.75,
    liquidationThreshold: 0.82,
    liquidationPenalty: 0.05,
    borrowCap: 100_000_000,
    supplyCap: 200_000_000,
    isCollateralEnabled: true,
    isBorrowEnabled: true,
    collateralTier: 'crypto',
  },
  'CC': {
    loanToValue: 0.55,
    liquidationThreshold: 0.65,
    liquidationPenalty: 0.08,
    borrowCap: 20_000_000,
    supplyCap: 50_000_000,
    isCollateralEnabled: true,
    isBorrowEnabled: true,
    collateralTier: 'crypto',
  },
  'RWA-TBILL': {
    loanToValue: 0.85,
    liquidationThreshold: 0.90,
    liquidationPenalty: 0.03,
    borrowCap: 200_000_000,
    supplyCap: 500_000_000,
    isCollateralEnabled: true,
    isBorrowEnabled: false,
    collateralTier: 'rwa',
  },
  'T-BILL': {
    loanToValue: 0.85,
    liquidationThreshold: 0.90,
    liquidationPenalty: 0.03,
    borrowCap: 200_000_000,
    supplyCap: 500_000_000,
    isCollateralEnabled: true,
    isBorrowEnabled: true,
    collateralTier: 'rwa',
  },
  'TIFA-REC': {
    loanToValue: 0.50,
    liquidationThreshold: 0.60,
    liquidationPenalty: 0.10,
    borrowCap: 0,
    supplyCap: 100_000_000,
    isCollateralEnabled: true,
    isBorrowEnabled: false,
    collateralTier: 'tifa',
  },
  'CC-REC': {
    loanToValue: 0.60,
    liquidationThreshold: 0.70,
    liquidationPenalty: 0.08,
    borrowCap: 50_000_000,
    supplyCap: 100_000_000,
    isCollateralEnabled: true,
    isBorrowEnabled: true,
    collateralTier: 'crypto',
  },
  'SPY': {
    loanToValue: 0.65,
    liquidationThreshold: 0.75,
    liquidationPenalty: 0.06,
    borrowCap: 50_000_000,
    supplyCap: 100_000_000,
    isCollateralEnabled: true,
    isBorrowEnabled: true,
    collateralTier: 'crypto',
  },
  'T-BILL-2026': {
    loanToValue: 0.85,
    liquidationThreshold: 0.90,
    liquidationPenalty: 0.03,
    borrowCap: 200_000_000,
    supplyCap: 500_000_000,
    isCollateralEnabled: true,
    isBorrowEnabled: true,
    collateralTier: 'rwa',
  },
  'SPY-2026': {
    loanToValue: 0.65,
    liquidationThreshold: 0.75,
    liquidationPenalty: 0.06,
    borrowCap: 50_000_000,
    supplyCap: 100_000_000,
    isCollateralEnabled: true,
    isBorrowEnabled: true,
    collateralTier: 'crypto',
  },
};

/**
 * Get collateral params for a given asset symbol.
 * Returns undefined if asset is not configured.
 */
export function getCollateralParams(symbol: string): CollateralParamsConfig | undefined {
  return COLLATERAL_PARAMS[symbol];
}
