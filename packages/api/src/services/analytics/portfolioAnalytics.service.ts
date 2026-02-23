import { createChildLogger } from '../../config/logger.js';
import type {
  UserPortfolio,
  UserTransaction,
  TaxReportSummary,
  TimeSeriesPoint,
  AnalyticsTimeRange,
  PnlBreakdown,
} from '@dualis/shared';

const log = createChildLogger('portfolio-analytics-service');

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function generatePortfolioHistory(
  days: number,
  baseValue: number,
): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const now = Date.now();
  const stepMs = 86_400_000;

  for (let i = days; i >= 0; i--) {
    const ts = new Date(now - i * stepMs);
    const trend = 1 + (days - i) / days * 0.12;
    const noise = 1 + Math.sin(i * 0.2) * 0.03 + (Math.random() - 0.5) * 0.02;
    points.push({
      timestamp: ts.toISOString(),
      value: Number((baseValue * trend * noise).toFixed(2)),
    });
  }
  return points;
}

// ---------------------------------------------------------------------------
// Portfolio
// ---------------------------------------------------------------------------

export function getUserPortfolio(
  userId: string,
  range: AnalyticsTimeRange = '30d',
): UserPortfolio {
  log.debug({ userId, range }, 'Getting user portfolio');

  const rangeMap: Record<AnalyticsTimeRange, number> = {
    '7d': 7, '30d': 30, '90d': 90, '1y': 365,
  };
  const days = rangeMap[range];

  const totalSupplied = 125_000 + Math.random() * 10_000;
  const totalBorrowed = 45_000 + Math.random() * 5_000;
  const interestEarned = 4_567;
  const interestPaid = 1_234;
  const unrealized = 1_123;

  return {
    totalSupplyUsd: totalSupplied,
    totalBorrowUsd: totalBorrowed,
    netWorthUsd: totalSupplied - totalBorrowed,
    totalInterestEarned: interestEarned,
    totalInterestPaid: interestPaid,
    netInterestUsd: interestEarned - interestPaid,
    unrealizedPnl: unrealized,
    totalPnl: interestEarned - interestPaid + unrealized,
    avgHealthFactor: 1.85,
    lowestHealthFactor: 1.42,
    supplyPositions: [
      { poolId: 'pool_usdc', asset: 'USDC', amount: 50_000, valueUsd: 50_000, apy: 0.035, interestEarned: 1_750 },
      { poolId: 'pool_eth', asset: 'ETH', amount: 20, valueUsd: 56_000, apy: 0.032, interestEarned: 1_792 },
      { poolId: 'pool_wbtc', asset: 'WBTC', amount: 0.3, valueUsd: 19_000, apy: 0.025, interestEarned: 1_025 },
    ],
    borrowPositions: [
      { poolId: 'pool_usdc', asset: 'USDC', amount: 30_000, valueUsd: 30_000, apy: 0.068, interestPaid: 824, healthFactor: 1.85 },
      { poolId: 'pool_usd1', asset: 'USD1', amount: 15_000, valueUsd: 15_000, apy: 0.075, interestPaid: 410, healthFactor: 1.62 },
    ],
    portfolioValueHistory: generatePortfolioHistory(days, totalSupplied - totalBorrowed),
    pnlHistory: generatePortfolioHistory(days, interestEarned - interestPaid),
  };
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

const MOCK_TRANSACTIONS: UserTransaction[] = [
  { id: 'tx_1', type: 'deposit', poolId: 'pool_usdc', asset: 'USDC', amount: 50_000, amountUsd: 50_000, createdAt: '2026-02-20T10:30:00Z' },
  { id: 'tx_2', type: 'deposit', poolId: 'pool_eth', asset: 'ETH', amount: 20, amountUsd: 56_000, createdAt: '2026-02-18T14:15:00Z' },
  { id: 'tx_3', type: 'borrow', poolId: 'pool_usdc', asset: 'USDC', amount: 30_000, amountUsd: 30_000, createdAt: '2026-02-17T09:00:00Z' },
  { id: 'tx_4', type: 'deposit', poolId: 'pool_wbtc', asset: 'WBTC', amount: 0.3, amountUsd: 19_000, createdAt: '2026-02-15T16:45:00Z' },
  { id: 'tx_5', type: 'borrow', poolId: 'pool_usd1', asset: 'USD1', amount: 15_000, amountUsd: 15_000, createdAt: '2026-02-14T11:20:00Z' },
  { id: 'tx_6', type: 'repay', poolId: 'pool_usdc', asset: 'USDC', amount: 5_000, amountUsd: 5_000, createdAt: '2026-02-10T08:30:00Z' },
  { id: 'tx_7', type: 'withdraw', poolId: 'pool_usdc', asset: 'USDC', amount: 10_000, amountUsd: 10_000, createdAt: '2026-02-05T13:00:00Z' },
  { id: 'tx_8', type: 'deposit', poolId: 'pool_usdc', asset: 'USDC', amount: 25_000, amountUsd: 25_000, createdAt: '2026-01-28T09:15:00Z' },
  { id: 'tx_9', type: 'liquidation', poolId: 'pool_eth', asset: 'ETH', amount: 2, amountUsd: 5_600, createdAt: '2026-01-20T22:00:00Z' },
  { id: 'tx_10', type: 'deposit', poolId: 'pool_tbill', asset: 'T-BILL', amount: 10_000, amountUsd: 10_000, createdAt: '2026-01-15T10:00:00Z' },
];

export function getUserTransactions(
  userId: string,
  limit = 20,
  offset = 0,
): { transactions: UserTransaction[]; total: number } {
  log.debug({ userId, limit, offset }, 'Getting user transactions');
  return {
    transactions: MOCK_TRANSACTIONS.slice(offset, offset + limit),
    total: MOCK_TRANSACTIONS.length,
  };
}

// ---------------------------------------------------------------------------
// P&L Breakdown
// ---------------------------------------------------------------------------

export function getPnlBreakdown(userId: string): PnlBreakdown[] {
  log.debug({ userId }, 'Getting P&L breakdown');

  return [
    { poolId: 'pool_usdc', asset: 'USDC', interestEarned: 1_750, interestPaid: 824, netPnl: 926, unrealizedPnl: 0 },
    { poolId: 'pool_eth', asset: 'ETH', interestEarned: 1_792, interestPaid: 0, netPnl: 1_792, unrealizedPnl: 890 },
    { poolId: 'pool_wbtc', asset: 'WBTC', interestEarned: 1_025, interestPaid: 0, netPnl: 1_025, unrealizedPnl: 233 },
    { poolId: 'pool_usd1', asset: 'USD1', interestEarned: 0, interestPaid: 410, netPnl: -410, unrealizedPnl: 0 },
  ];
}

// ---------------------------------------------------------------------------
// Tax Report
// ---------------------------------------------------------------------------

export function getTaxReport(userId: string, year = 2025): TaxReportSummary {
  log.debug({ userId, year }, 'Generating tax report');

  return {
    year,
    interestEarned: 4_567,
    interestPaid: 1_234,
    liquidationLosses: 560,
    netIncome: 2_773,
    entries: [
      { date: `${year}-01-15`, type: 'Interest Earned', asset: 'USDC', amount: 145.50, usdValue: 145.50, fee: 0, runningBalance: 145.50 },
      { date: `${year}-02-15`, type: 'Interest Earned', asset: 'USDC', amount: 152.30, usdValue: 152.30, fee: 0, runningBalance: 297.80 },
      { date: `${year}-02-15`, type: 'Interest Paid', asset: 'USDC', amount: -68.50, usdValue: -68.50, fee: 0, runningBalance: 229.30 },
      { date: `${year}-03-15`, type: 'Interest Earned', asset: 'ETH', amount: 0.05, usdValue: 140.00, fee: 0, runningBalance: 369.30 },
      { date: `${year}-04-10`, type: 'Liquidation Loss', asset: 'ETH', amount: -2, usdValue: -560.00, fee: 28.00, runningBalance: -218.70 },
      { date: `${year}-05-15`, type: 'Interest Earned', asset: 'WBTC', amount: 0.002, usdValue: 127.00, fee: 0, runningBalance: -91.70 },
      { date: `${year}-06-15`, type: 'Interest Earned', asset: 'USDC', amount: 165.20, usdValue: 165.20, fee: 0, runningBalance: 73.50 },
    ],
  };
}
