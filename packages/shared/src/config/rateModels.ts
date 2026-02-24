import type { InterestRateModelConfig } from '../utils/math';

/**
 * Asset-specific interest rate model configurations.
 * Each pool has unique rate parameters tuned to its risk profile.
 */
export const RATE_MODELS: Record<string, InterestRateModelConfig> = {
  // === STABLECOINS (Low volatility, high demand) ===
  'USDC': {
    type: 'VariableRate',
    baseRate: 0.02,
    multiplier: 0.07,
    kink: 0.80,
    jumpMultiplier: 0.30,
    reserveFactor: 0.10,
  },
  'USDT': {
    type: 'VariableRate',
    baseRate: 0.02,
    multiplier: 0.07,
    kink: 0.80,
    jumpMultiplier: 0.30,
    reserveFactor: 0.10,
  },

  // === MAJOR CRYPTO (Higher volatility, collateral assets) ===
  'wBTC': {
    type: 'VariableRate',
    baseRate: 0.01,
    multiplier: 0.04,
    kink: 0.65,
    jumpMultiplier: 0.50,
    reserveFactor: 0.15,
  },
  'wETH': {
    type: 'VariableRate',
    baseRate: 0.01,
    multiplier: 0.04,
    kink: 0.65,
    jumpMultiplier: 0.50,
    reserveFactor: 0.15,
  },
  'ETH': {
    type: 'VariableRate',
    baseRate: 0.01,
    multiplier: 0.04,
    kink: 0.65,
    jumpMultiplier: 0.50,
    reserveFactor: 0.15,
  },

  // === CANTON NATIVE (CC Token) ===
  'CC': {
    type: 'VariableRate',
    baseRate: 0.03,
    multiplier: 0.10,
    kink: 0.60,
    jumpMultiplier: 0.80,
    reserveFactor: 0.20,
  },

  // === RWA (Real World Assets — tokenized bonds, treasuries) ===
  'RWA-TBILL': {
    type: 'VariableRate',
    baseRate: 0.04,
    multiplier: 0.03,
    kink: 0.90,
    jumpMultiplier: 0.15,
    reserveFactor: 0.05,
  },
  'T-BILL': {
    type: 'VariableRate',
    baseRate: 0.04,
    multiplier: 0.03,
    kink: 0.90,
    jumpMultiplier: 0.15,
    reserveFactor: 0.05,
  },

  // === TIFA Receivables (Turkey receivables tokens) ===
  'TIFA-REC': {
    type: 'VariableRate',
    baseRate: 0.08,
    multiplier: 0.12,
    kink: 0.70,
    jumpMultiplier: 0.60,
    reserveFactor: 0.15,
  },

  // === CC-Receivable (Canton receivables) ===
  'CC-REC': {
    type: 'VariableRate',
    baseRate: 0.03,
    multiplier: 0.06,
    kink: 0.70,
    jumpMultiplier: 0.25,
    reserveFactor: 0.15,
  },

  // === SPY (Tokenized Equity) ===
  'SPY': {
    type: 'VariableRate',
    baseRate: 0.02,
    multiplier: 0.05,
    kink: 0.75,
    jumpMultiplier: 0.18,
    reserveFactor: 0.10,
  },
  'SPY-2026': {
    type: 'VariableRate',
    baseRate: 0.02,
    multiplier: 0.05,
    kink: 0.75,
    jumpMultiplier: 0.18,
    reserveFactor: 0.10,
  },

  // === T-BILL-2026 (Alias for T-BILL) ===
  'T-BILL-2026': {
    type: 'VariableRate',
    baseRate: 0.04,
    multiplier: 0.03,
    kink: 0.90,
    jumpMultiplier: 0.15,
    reserveFactor: 0.05,
  },
};

const USDC_FALLBACK: InterestRateModelConfig = {
  type: 'VariableRate',
  baseRate: 0.02,
  multiplier: 0.07,
  kink: 0.80,
  jumpMultiplier: 0.30,
  reserveFactor: 0.10,
};

/**
 * Get the rate model for a given asset symbol.
 * Falls back to USDC config as default.
 */
export function getRateModel(symbol: string): InterestRateModelConfig {
  return RATE_MODELS[symbol] ?? USDC_FALLBACK;
}
