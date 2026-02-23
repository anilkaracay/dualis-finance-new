import { desc, gte, count } from 'drizzle-orm';
import { getDb, schema } from '../db/client.js';
import { createChildLogger } from '../config/logger.js';
import type { AdminDashboardStats } from '@dualis/shared';

const log = createChildLogger('admin-dashboard-service');

// ---------------------------------------------------------------------------
// Mock fallback data (when DB unavailable)
// ---------------------------------------------------------------------------

const MOCK_STATS: AdminDashboardStats = {
  totalTVL: 45_200_000,
  tvlDelta24h: 2.4,
  activeLoans: 127,
  totalBorrowValue: 18_500_000,
  totalUsers: 1_842,
  newUsersThisWeek: 43,
  protocolRevenue: 156_000,
  revenueThisMonth: 12_400,
};

const MOCK_TVL_HISTORY = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10),
  tvl: 40_000_000 + Math.random() * 10_000_000,
  utilization: 0.5 + Math.random() * 0.3,
  borrowVolume: 1_000_000 + Math.random() * 500_000,
}));

const MOCK_REVENUE_HISTORY = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10),
  reserveFees: 200 + Math.random() * 300,
  liquidationFees: Math.random() * 100,
  totalRevenue: 250 + Math.random() * 350,
}));

const MOCK_ALERTS = [
  { id: 1, alertType: 'HIGH_UTILIZATION', asset: 'USDC', message: 'USDC pool utilization above 85%', severity: 'warning', timestamp: new Date().toISOString() },
  { id: 2, alertType: 'STALE_PRICE', asset: 'CC', message: 'CC price feed stale for 3 minutes', severity: 'warning', timestamp: new Date(Date.now() - 300000).toISOString() },
  { id: 3, alertType: 'CIRCUIT_BREAKER_TRIPPED', asset: 'TIFA-REC', message: 'TIFA-REC circuit breaker tripped: 12% deviation', severity: 'critical', timestamp: new Date(Date.now() - 600000).toISOString() },
];

const MOCK_POOL_OVERVIEW = [
  { poolId: 'usdc-main', name: 'USDC Main Pool', asset: 'USDC', status: 'active' as const, tvl: 25_000_000, totalBorrow: 12_500_000, utilization: 0.50, supplyAPY: 0.032, borrowAPY: 0.058, maxLTV: 0.80, liquidationThreshold: 0.85, createdAt: '2024-06-01' },
  { poolId: 'wbtc-main', name: 'wBTC Pool', asset: 'wBTC', status: 'active' as const, tvl: 10_000_000, totalBorrow: 3_500_000, utilization: 0.35, supplyAPY: 0.012, borrowAPY: 0.028, maxLTV: 0.73, liquidationThreshold: 0.80, createdAt: '2024-06-15' },
  { poolId: 'eth-main', name: 'ETH Pool', asset: 'ETH', status: 'active' as const, tvl: 8_200_000, totalBorrow: 4_100_000, utilization: 0.50, supplyAPY: 0.018, borrowAPY: 0.034, maxLTV: 0.75, liquidationThreshold: 0.82, createdAt: '2024-07-01' },
  { poolId: 'tbill-main', name: 'T-Bill Pool', asset: 'T-BILL', status: 'active' as const, tvl: 5_000_000, totalBorrow: 1_500_000, utilization: 0.30, supplyAPY: 0.042, borrowAPY: 0.052, maxLTV: 0.85, liquidationThreshold: 0.90, createdAt: '2024-08-01' },
  { poolId: 'cc-main', name: 'CC Token Pool', asset: 'CC', status: 'paused' as const, tvl: 2_000_000, totalBorrow: 900_000, utilization: 0.45, supplyAPY: 0.045, borrowAPY: 0.095, maxLTV: 0.55, liquidationThreshold: 0.65, createdAt: '2024-09-01' },
  { poolId: 'spy-main', name: 'SPY ETF Pool', asset: 'SPY', status: 'active' as const, tvl: 3_000_000, totalBorrow: 800_000, utilization: 0.27, supplyAPY: 0.015, borrowAPY: 0.032, maxLTV: 0.65, liquidationThreshold: 0.75, createdAt: '2024-10-01' },
];

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------

export async function getDashboardStats(): Promise<AdminDashboardStats> {
  const db = getDb();
  if (!db) return MOCK_STATS;

  try {
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const [userCount, newUsers] = await Promise.all([
      db.select({ count: count() }).from(schema.users),
      db.select({ count: count() }).from(schema.users).where(gte(schema.users.createdAt, weekAgo)),
    ]);

    return {
      ...MOCK_STATS,
      totalUsers: userCount[0]?.count ?? MOCK_STATS.totalUsers,
      newUsersThisWeek: newUsers[0]?.count ?? MOCK_STATS.newUsersThisWeek,
    };
  } catch (err) {
    log.warn({ err }, 'Failed to fetch dashboard stats, using mock data');
    return MOCK_STATS;
  }
}

// ---------------------------------------------------------------------------
// TVL history
// ---------------------------------------------------------------------------

export async function getTVLHistory(period: string = '30d') {
  const db = getDb();
  if (!db) return MOCK_TVL_HISTORY;

  const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30;
  const from = new Date(Date.now() - days * 86400000);

  try {
    const rows = await db
      .select()
      .from(schema.poolSnapshots)
      .where(gte(schema.poolSnapshots.timestamp, from))
      .orderBy(schema.poolSnapshots.timestamp);

    if (rows.length === 0) return MOCK_TVL_HISTORY;

    // Aggregate by date
    const byDate = new Map<string, { tvl: number; utilization: number; count: number; borrowVolume: number }>();
    for (const row of rows) {
      const date = row.timestamp?.toISOString().slice(0, 10) ?? '';
      const entry = byDate.get(date) ?? { tvl: 0, utilization: 0, count: 0, borrowVolume: 0 };
      entry.tvl += parseFloat(row.totalSupply ?? '0');
      entry.borrowVolume += parseFloat(row.totalBorrow ?? '0');
      entry.utilization += Number(row.utilization ?? 0);
      entry.count += 1;
      byDate.set(date, entry);
    }

    return Array.from(byDate.entries()).map(([date, data]) => ({
      date,
      tvl: data.tvl,
      utilization: data.count > 0 ? data.utilization / data.count : 0,
      borrowVolume: data.borrowVolume,
    }));
  } catch (err) {
    log.warn({ err }, 'Failed to fetch TVL history, using mock data');
    return MOCK_TVL_HISTORY;
  }
}

// ---------------------------------------------------------------------------
// Revenue history
// ---------------------------------------------------------------------------

export async function getRevenueHistory(period: string = '30d') {
  const db = getDb();
  if (!db) return MOCK_REVENUE_HISTORY;

  const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30;
  const from = new Date(Date.now() - days * 86400000);

  try {
    const rows = await db
      .select()
      .from(schema.protocolAnalytics)
      .where(gte(schema.protocolAnalytics.date, from.toISOString().slice(0, 10)))
      .orderBy(schema.protocolAnalytics.date);

    if (rows.length === 0) return MOCK_REVENUE_HISTORY;

    return rows.map((row) => ({
      date: row.date,
      reserveFees: parseFloat(row.totalFees ?? '0') * 0.7,
      liquidationFees: parseFloat(row.totalLiquidations ?? '0') * 0.05,
      totalRevenue: parseFloat(row.protocolRevenue ?? '0'),
    }));
  } catch (err) {
    log.warn({ err }, 'Failed to fetch revenue history, using mock data');
    return MOCK_REVENUE_HISTORY;
  }
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export async function getSystemAlerts(limit: number = 20) {
  const db = getDb();
  if (!db) return MOCK_ALERTS;

  try {
    const rows = await db
      .select()
      .from(schema.oracleAlerts)
      .orderBy(desc(schema.oracleAlerts.timestamp))
      .limit(limit);

    if (rows.length === 0) return MOCK_ALERTS;

    return rows.map((row) => ({
      id: row.id,
      alertType: row.alertType,
      asset: row.asset,
      message: row.message,
      severity: row.severity,
      timestamp: row.timestamp?.toISOString() ?? new Date().toISOString(),
    }));
  } catch (err) {
    log.warn({ err }, 'Failed to fetch system alerts, using mock data');
    return MOCK_ALERTS;
  }
}

// ---------------------------------------------------------------------------
// Pool overview (for dashboard table)
// ---------------------------------------------------------------------------

export function getPoolOverview() {
  return MOCK_POOL_OVERVIEW;
}
