import { createChildLogger } from '../config/logger.js';
import type {
  AnalyticsHistoryParams,
  AnalyticsOverview,
  AnalyticsHistoryPoint,
} from '@dualis/shared';

const log = createChildLogger('analytics-service');

const MOCK_OVERVIEW: AnalyticsOverview = {
  tvl: 1_081_077_500,
  totalBorrowed: 490_221_800,
  totalFees24h: 142_350,
  totalFees7d: 985_420,
  totalLiquidations24h: 3,
  uniqueUsers24h: 1_847,
  totalTransactions24h: 12_456,
  avgHealthFactor: 1.92,
  secLendingVolume24h: 28_500_000,
  activeSecLendingDeals: 342,
  flashLoanVolume24h: 45_200_000,
  protocolRevenue30d: 4_125_800,
};

function generateHistory(
  metric: string,
  period: string
): AnalyticsHistoryPoint[] {
  const periodDays: Record<string, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
  };
  const days = periodDays[period] ?? 30;
  const now = Date.now();
  const points: AnalyticsHistoryPoint[] = [];

  const baseValues: Record<string, number> = {
    tvl: 1_081_077_500,
    borrowed: 490_221_800,
    fees: 142_350,
    users: 1_847,
    liquidations: 3,
  };
  const base = baseValues[metric] ?? baseValues['tvl'] ?? 1_081_077_500;

  for (let i = days; i >= 0; i--) {
    const ts = new Date(now - i * 86_400_000);
    const trend = 1 + (days - i) / days * 0.08; // slight upward trend
    const jitter = 1 + Math.sin(i * 0.4) * 0.03 + (Math.random() - 0.5) * 0.02;
    points.push({
      timestamp: ts.toISOString(),
      value: Number((base * trend * jitter).toFixed(2)),
    });
  }

  return points;
}

export function getOverview(): AnalyticsOverview {
  log.debug('Getting analytics overview');
  return MOCK_OVERVIEW;
}

export function getHistory(
  params: AnalyticsHistoryParams
): AnalyticsHistoryPoint[] {
  log.debug({ params }, 'Getting analytics history');
  return generateHistory(params.metric ?? 'tvl', params.period ?? '30d');
}
