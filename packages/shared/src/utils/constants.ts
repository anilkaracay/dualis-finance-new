import type { CreditTier, LiquidationTier } from '../types';

/** Credit tier score thresholds */
export const CREDIT_TIER_THRESHOLDS: Record<CreditTier, { min: number; max: number }> = {
  Diamond: { min: 850, max: 1000 },
  Gold: { min: 700, max: 849 },
  Silver: { min: 500, max: 699 },
  Bronze: { min: 300, max: 499 },
  Unrated: { min: 0, max: 299 },
};

/** Credit tier parameters */
export const CREDIT_TIER_PARAMS: Record<CreditTier, {
  minCollateralRatio: number;
  maxLTV: number;
  rateDiscountBps: number;
}> = {
  Diamond: { minCollateralRatio: 1.10, maxLTV: 0.90, rateDiscountBps: -50 },
  Gold: { minCollateralRatio: 1.20, maxLTV: 0.83, rateDiscountBps: -25 },
  Silver: { minCollateralRatio: 1.35, maxLTV: 0.74, rateDiscountBps: 0 },
  Bronze: { minCollateralRatio: 1.50, maxLTV: 0.67, rateDiscountBps: 25 },
  Unrated: { minCollateralRatio: 1.75, maxLTV: 0.57, rateDiscountBps: 75 },
};

/** Liquidation tier thresholds based on health factor */
export const LIQUIDATION_TIERS: Array<{
  tier: LiquidationTier;
  hfMin: number;
  hfMax: number;
  liquidationPercent: number;
}> = [
  { tier: 'MarginCall', hfMin: 0.95, hfMax: 1.00, liquidationPercent: 0 },
  { tier: 'SoftLiquidation', hfMin: 0.90, hfMax: 0.95, liquidationPercent: 0.25 },
  { tier: 'ForcedLiquidation', hfMin: 0.85, hfMax: 0.90, liquidationPercent: 0.50 },
  { tier: 'FullLiquidation', hfMin: 0, hfMax: 0.85, liquidationPercent: 1.00 },
];

/** TIFA haircut schedule by debtor rating and days to maturity */
export const TIFA_HAIRCUTS: Record<string, Record<string, number>> = {
  'AAA/AA': { '<30': 0.10, '30-90': 0.15, '90-180': 0.20 },
  'A/BBB': { '<30': 0.20, '30-90': 0.25, '90-180': 0.30 },
  'BB/B': { '<30': 0.30, '30-90': 0.35, '90-180': 0.40 },
  'Unrated': { '<30': 0.40, '30-90': 0.45, '90-180': 0.50 },
};

/** DUAL token parameters */
export const DUAL_TOKEN = {
  name: 'Dualis Token',
  symbol: 'DUAL',
  standard: 'CIP-56',
  totalSupply: '1000000000',
  allocations: [
    { category: 'Protocol Development', percent: 25, amount: '250000000', vesting: '4yr linear, 12mo cliff' },
    { category: 'Ecosystem', percent: 20, amount: '200000000', vesting: '3yr linear, 6mo cliff' },
    { category: 'Community Rewards', percent: 25, amount: '250000000', vesting: 'Per epoch, usage-based' },
    { category: 'Treasury', percent: 15, amount: '150000000', vesting: 'DAO-controlled' },
    { category: 'Investors', percent: 10, amount: '100000000', vesting: '2yr linear, 6mo cliff' },
    { category: 'Advisors', percent: 5, amount: '50000000', vesting: '2yr linear, 12mo cliff' },
  ],
} as const;

/** Supported oracle feeds */
export const ORACLE_FEEDS = [
  { asset: 'ETH', feedId: 'eth-usd', source: 'Chainlink Data Streams', frequency: 'Sub-second' },
  { asset: 'BTC', feedId: 'btc-usd', source: 'Chainlink Data Streams', frequency: 'Sub-second' },
  { asset: 'CC', feedId: 'cc-usd', source: 'Chainlink Data Streams', frequency: 'Sub-second' },
  { asset: 'USDC', feedId: 'usdc-usd', source: 'Chainlink PoR', frequency: '1 hour' },
  { asset: 'USD1', feedId: 'usd1-usd', source: 'Chainlink PoR', frequency: '1 hour' },
  { asset: 'T-BILL-2026', feedId: 'tbill-2026-usd', source: 'Chainlink NAVLink + DTCC', frequency: '15 min' },
  { asset: 'T-NOTE-10Y', feedId: 'tnote-10y-usd', source: 'Chainlink NAVLink + DTCC', frequency: '15 min' },
  { asset: 'SPY-2026', feedId: 'spy-2026-usd', source: 'Chainlink + market data', frequency: 'Real-time' },
  { asset: 'TIFA RWA', feedId: 'tifa-rwa-usd', source: 'TIFA Oracle + Chainlink', frequency: 'Daily' },
] as const;

/** Protocol defaults */
export const PROTOCOL_DEFAULTS = {
  protocolFeeRate: 0.001,
  flashLoanFeeRate: 0.0009,
  minCollateralRatio: 1.10,
  liquidationIncentive: 0.05,
  maxOracleStalenessSec: 300,
} as const;

/** Score calculation max values */
export const SCORE_MAXES = {
  loanCompletion: 300,
  repaymentTimeliness: 250,
  volumeHistory: 200,
  collateralHealth: 150,
  securitiesLending: 100,
  total: 1000,
} as const;
