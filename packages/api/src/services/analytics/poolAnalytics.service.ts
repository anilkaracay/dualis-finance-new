import { createChildLogger } from '../../config/logger.js';
import type {
  AnalyticsTimeRange,
  AnalyticsMetric,
  TimeSeriesPoint,
  PoolAnalyticsSummary,
  PoolRanking,
} from '@dualis/shared';

const log = createChildLogger('pool-analytics-service');

// ---------------------------------------------------------------------------
// Mock data (Canton not live yet — will query DB snapshots in production)
// ---------------------------------------------------------------------------

const MOCK_POOLS = [
  { id: 'pool_usdc', asset: 'USDC', tvl: 35_000_000, supply: 48_000_000, borrows: 31_000_000, util: 0.72, supplyApy: 0.035, borrowApy: 0.068, depositors: 342, borrowers: 156, reserve: 960_000 },
  { id: 'pool_eth', asset: 'ETH', tvl: 45_000_000, supply: 62_000_000, borrows: 42_000_000, util: 0.68, supplyApy: 0.032, borrowApy: 0.062, depositors: 528, borrowers: 234, reserve: 1_240_000 },
  { id: 'pool_wbtc', asset: 'WBTC', tvl: 30_000_000, supply: 40_000_000, borrows: 22_000_000, util: 0.55, supplyApy: 0.025, borrowApy: 0.055, depositors: 189, borrowers: 98, reserve: 800_000 },
  { id: 'pool_usd1', asset: 'USD1', tvl: 15_000_000, supply: 19_000_000, borrows: 14_800_000, util: 0.78, supplyApy: 0.042, borrowApy: 0.075, depositors: 124, borrowers: 87, reserve: 380_000 },
  { id: 'pool_tbill', asset: 'T-BILL', tvl: 20_000_000, supply: 22_000_000, borrows: 18_700_000, util: 0.85, supplyApy: 0.045, borrowApy: 0.058, depositors: 67, borrowers: 42, reserve: 440_000 },
  { id: 'pool_spy', asset: 'SPY', tvl: 8_000_000, supply: 10_000_000, borrows: 4_200_000, util: 0.42, supplyApy: 0.018, borrowApy: 0.048, depositors: 45, borrowers: 23, reserve: 200_000 },
];

// ---------------------------------------------------------------------------
// Time Series Generator
// ---------------------------------------------------------------------------

function getTimeConfig(range: AnalyticsTimeRange) {
  const configs: Record<AnalyticsTimeRange, { points: number; stepMs: number }> = {
    '7d':  { points: 168, stepMs: 3_600_000 },         // hourly
    '30d': { points: 180, stepMs: 4 * 3_600_000 },     // 4-hourly
    '90d': { points: 90, stepMs: 86_400_000 },          // daily
    '1y':  { points: 52, stepMs: 7 * 86_400_000 },     // weekly
  };
  return configs[range];
}

export function getPoolTimeSeries(
  poolId: string,
  metric: AnalyticsMetric,
  range: AnalyticsTimeRange,
): TimeSeriesPoint[] {
  log.debug({ poolId, metric, range }, 'Getting pool time series');

  const pool = MOCK_POOLS.find(p => p.id === poolId);
  if (!pool) return [];

  const baseValues: Record<AnalyticsMetric, number> = {
    tvl: pool.tvl,
    supply_apy: pool.supplyApy,
    borrow_apy: pool.borrowApy,
    utilization: pool.util,
  };
  const base = baseValues[metric];
  const config = getTimeConfig(range);
  const now = Date.now();
  const points: TimeSeriesPoint[] = [];

  for (let i = config.points; i >= 0; i--) {
    const ts = new Date(now - i * config.stepMs);
    const trend = 1 + (config.points - i) / config.points * 0.05;
    const noise = 1 + Math.sin(i * 0.3) * 0.02 + (Math.random() - 0.5) * 0.015;
    points.push({
      timestamp: ts.toISOString(),
      value: Number((base * trend * noise).toFixed(6)),
    });
  }

  return points;
}

// ---------------------------------------------------------------------------
// Pool Analytics Summary
// ---------------------------------------------------------------------------

export function getPoolAnalyticsSummary(poolId: string): PoolAnalyticsSummary | null {
  const pool = MOCK_POOLS.find(p => p.id === poolId);
  if (!pool) return null;

  return {
    poolId: pool.id,
    asset: pool.asset,
    tvlUsd: pool.tvl,
    totalSupplyUsd: pool.supply,
    totalBorrowUsd: pool.borrows,
    availableLiquidityUsd: pool.supply - pool.borrows,
    utilization: pool.util,
    supplyApy: pool.supplyApy,
    borrowApy: pool.borrowApy,
    depositorCount: pool.depositors,
    borrowerCount: pool.borrowers,
    reserveUsd: pool.reserve,
    tvlChange7d: 0.032 + (Math.random() - 0.5) * 0.02,
    tvlChange30d: 0.085 + (Math.random() - 0.5) * 0.04,
    avgSupplyApy7d: pool.supplyApy * (1 + (Math.random() - 0.5) * 0.1),
    avgBorrowApy7d: pool.borrowApy * (1 + (Math.random() - 0.5) * 0.1),
  };
}

export function getAllPoolAnalytics(): PoolAnalyticsSummary[] {
  return MOCK_POOLS.map(p => getPoolAnalyticsSummary(p.id)!);
}

// ---------------------------------------------------------------------------
// Pool Ranking
// ---------------------------------------------------------------------------

export function getPoolRankings(
  sortBy: 'tvl' | 'supplyApy' | 'tvlGrowth' | 'depositors' | 'utilization' = 'tvl'
): PoolRanking[] {
  const rankings: PoolRanking[] = MOCK_POOLS.map(p => ({
    poolId: p.id,
    asset: p.asset,
    tvlUsd: p.tvl,
    supplyApy: p.supplyApy,
    tvlGrowth30d: 0.05 + Math.random() * 0.1,
    depositorCount: p.depositors,
    utilization: p.util,
  }));

  const sortMap: Record<string, (a: PoolRanking, b: PoolRanking) => number> = {
    tvl: (a, b) => b.tvlUsd - a.tvlUsd,
    supplyApy: (a, b) => b.supplyApy - a.supplyApy,
    tvlGrowth: (a, b) => b.tvlGrowth30d - a.tvlGrowth30d,
    depositors: (a, b) => b.depositorCount - a.depositorCount,
    utilization: (a, b) => Math.abs(0.75 - a.utilization) - Math.abs(0.75 - b.utilization),
  };

  rankings.sort(sortMap[sortBy] ?? sortMap['tvl']!);
  return rankings;
}
