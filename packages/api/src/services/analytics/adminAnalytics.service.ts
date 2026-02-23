import { createChildLogger } from '../../config/logger.js';
import type {
  AdminAnalyticsOverview,
  UserAnalytics,
  CohortRow,
  TimeSeriesPoint,
} from '@dualis/shared';
import { getPoolRankings } from './poolAnalytics.service.js';
import { getProtocolHealth } from './protocolHealth.service.js';
import { getRevenueSummary } from './revenue.service.js';

const log = createChildLogger('admin-analytics-service');

// ---------------------------------------------------------------------------
// TVL History
// ---------------------------------------------------------------------------

function generateTvlHistory(days: number): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const now = Date.now();
  const base = 153_000_000;

  for (let i = days; i >= 0; i--) {
    const ts = new Date(now - i * 86_400_000);
    const trend = 1 + (days - i) / days * 0.08;
    const noise = 1 + Math.sin(i * 0.15) * 0.02 + (Math.random() - 0.5) * 0.015;
    points.push({
      timestamp: ts.toISOString(),
      value: Number((base * trend * noise).toFixed(2)),
    });
  }
  return points;
}

// ---------------------------------------------------------------------------
// User Analytics
// ---------------------------------------------------------------------------

function generateCohortRetention(): CohortRow[] {
  const months = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02'];
  return months.map((cohort, idx) => {
    const retention: number[] = [];
    let rate = 1.0;
    const maxMonths = months.length - idx;
    for (let m = 0; m < maxMonths; m++) {
      retention.push(Number(rate.toFixed(2)));
      rate *= (0.65 + Math.random() * 0.15);
    }
    return { cohort, retention };
  });
}

function getUserAnalytics(): UserAnalytics {
  return {
    dau: 847,
    wau: 2_156,
    mau: 4_823,
    cohortRetention: generateCohortRetention(),
  };
}

// ---------------------------------------------------------------------------
// Admin Overview
// ---------------------------------------------------------------------------

export function getAdminAnalyticsOverview(): AdminAnalyticsOverview {
  log.debug('Getting admin analytics overview');

  const health = getProtocolHealth();

  return {
    tvlUsd: 153_000_000,
    tvlChange7d: 0.052,
    totalUsers: 4_823,
    dailyActiveUsers: 847,
    volume24h: 12_500_000,
    revenue30d: 125_400,
    tvlHistory: generateTvlHistory(90),
    revenueSummary: getRevenueSummary(),
    protocolHealth: health,
    poolComparison: getPoolRankings('tvl'),
    hfDistribution: health.hfDistribution,
    userAnalytics: getUserAnalytics(),
  };
}
