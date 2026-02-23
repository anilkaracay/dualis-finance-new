import { createChildLogger } from '../../config/logger.js';
import type {
  ProtocolHealthDashboard,
  HfDistributionBucket,
  TimeSeriesPoint,
  AnalyticsTimeRange,
} from '@dualis/shared';
import { getHealthScoreRating } from '@dualis/shared';

const log = createChildLogger('protocol-health-service');

// ---------------------------------------------------------------------------
// Health Factor Distribution
// ---------------------------------------------------------------------------

function generateHfDistribution(): HfDistributionBucket[] {
  return [
    { range: '> 2.0', count: 456, volumeUsd: 42_500_000 },
    { range: '1.5 - 2.0', count: 234, volumeUsd: 18_200_000 },
    { range: '1.2 - 1.5', count: 89, volumeUsd: 6_800_000 },
    { range: '1.0 - 1.2', count: 23, volumeUsd: 1_200_000 },
    { range: '<= 1.0', count: 2, volumeUsd: 85_000 },
  ];
}

// ---------------------------------------------------------------------------
// Protocol Health Dashboard
// ---------------------------------------------------------------------------

export function getProtocolHealth(): ProtocolHealthDashboard {
  log.debug('Getting protocol health dashboard');

  const healthScore = 87;
  return {
    healthScore,
    rating: getHealthScoreRating(healthScore),
    badDebtRatio: 0.0002,
    reserveCoverage: 0.065,
    avgHealthFactor: 1.85,
    hfDistribution: generateHfDistribution(),
    hfDangerCount: 25,
    hfDangerVolumeUsd: 1_285_000,
    liquidationEfficiency: 0.96,
    oracleUptime: 0.998,
    concentrationRisk: 0.28,
  };
}

// ---------------------------------------------------------------------------
// Health Score History
// ---------------------------------------------------------------------------

export function getHealthScoreHistory(range: AnalyticsTimeRange = '30d'): TimeSeriesPoint[] {
  const rangeMap: Record<AnalyticsTimeRange, number> = {
    '7d': 7 * 24 * 4, '30d': 30 * 24 * 4, '90d': 90 * 24, '1y': 365,
  };
  const points = Math.min(200, rangeMap[range]);
  const now = Date.now();
  const result: TimeSeriesPoint[] = [];

  for (let i = points; i >= 0; i--) {
    const ts = new Date(now - i * 15 * 60_000);
    const base = 85 + Math.sin(i * 0.05) * 5;
    const noise = (Math.random() - 0.5) * 4;
    result.push({
      timestamp: ts.toISOString(),
      value: Math.round(Math.min(100, Math.max(0, base + noise))),
    });
  }

  return result;
}
