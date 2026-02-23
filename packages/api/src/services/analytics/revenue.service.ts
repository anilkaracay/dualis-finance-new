import { createChildLogger } from '../../config/logger.js';
import type {
  RevenueSummary,
  RevenueBreakdown,
  RevenueByPool,
  TimeSeriesPoint,
} from '@dualis/shared';

const log = createChildLogger('revenue-service');

// ---------------------------------------------------------------------------
// Revenue Summary
// ---------------------------------------------------------------------------

export function getRevenueSummary(): RevenueSummary {
  log.debug('Getting revenue summary');

  const total30d = 125_400;
  const total7d = 32_100;

  const breakdown: RevenueBreakdown[] = [
    { type: 'interest_spread', amount: 98_200, percentage: 78.3 },
    { type: 'liquidation_fee', amount: 18_600, percentage: 14.8 },
    { type: 'flash_loan_fee', amount: 8_600, percentage: 6.9 },
  ];

  const byPool: RevenueByPool[] = [
    { poolId: 'pool_eth', asset: 'ETH', amount: 45_200, percentage: 36.0 },
    { poolId: 'pool_usdc', asset: 'USDC', amount: 38_600, percentage: 30.8 },
    { poolId: 'pool_wbtc', asset: 'WBTC', amount: 22_100, percentage: 17.6 },
    { poolId: 'pool_usd1', asset: 'USD1', amount: 12_400, percentage: 9.9 },
    { poolId: 'pool_tbill', asset: 'T-BILL', amount: 5_800, percentage: 4.6 },
    { poolId: 'pool_spy', asset: 'SPY', amount: 1_300, percentage: 1.0 },
  ];

  // Daily revenue (30 days)
  const dailyRevenue: TimeSeriesPoint[] = [];
  const now = Date.now();
  for (let i = 30; i >= 0; i--) {
    const ts = new Date(now - i * 86_400_000);
    const base = 4_180;
    const trend = 1 + (30 - i) / 30 * 0.05;
    const noise = 1 + (Math.random() - 0.5) * 0.3;
    dailyRevenue.push({
      timestamp: ts.toISOString(),
      value: Number((base * trend * noise).toFixed(2)),
    });
  }

  // Projected monthly: current TVL × avg utilization × reserve factor
  const projectedMonthly = 153_000_000 * 0.65 * 0.001 * 30;

  return {
    totalAllTime: 2_845_600,
    total30d,
    total7d,
    breakdown,
    byPool,
    dailyRevenue,
    projectedMonthly: Number(projectedMonthly.toFixed(2)),
  };
}
