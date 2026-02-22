import { createChildLogger } from '../config/logger.js';
import { getDb, schema } from '../db/client.js';
import { registerJob } from './scheduler.js';

const log = createChildLogger('analytics');

// ---------------------------------------------------------------------------
// Interval — every 15 minutes
// ---------------------------------------------------------------------------

const INTERVAL_MS = 15 * 60 * 1_000;

// ---------------------------------------------------------------------------
// Mock metrics generators
// ---------------------------------------------------------------------------

/** Generate slightly randomised mock protocol metrics. */
function generateMetrics() {
  const jitter = () => 1 + (Math.random() - 0.5) * 0.04; // +/- 2 %

  return {
    tvl: Number((965_677_500 * jitter()).toFixed(2)),
    totalBorrowed: Number((560_254_000 * jitter()).toFixed(2)),
    totalFees: Number((123_456 * jitter()).toFixed(2)),
    totalLiquidations: Number((45_000 * jitter()).toFixed(2)),
    uniqueUsers: Math.round(1_240 * jitter()),
    totalTransactions: Math.round(8_900 * jitter()),
    avgHealthFactor: Number((1.45 + (Math.random() - 0.5) * 0.1).toFixed(4)),
    secLendingVolume: Number((12_500_000 * jitter()).toFixed(2)),
    flashLoanVolume: Number((34_000_000 * jitter()).toFixed(2)),
    protocolRevenue: Number((89_000 * jitter()).toFixed(2)),
  };
}

// ---------------------------------------------------------------------------
// Job handler
// ---------------------------------------------------------------------------

async function analyticsHandler(): Promise<void> {
  const db = getDb();
  const metrics = generateMetrics();

  log.debug(
    {
      tvl: metrics.tvl,
      totalBorrowed: metrics.totalBorrowed,
      uniqueUsers: metrics.uniqueUsers,
    },
    'Protocol analytics aggregated',
  );

  if (!db) {
    log.debug('Database unavailable — analytics snapshot not persisted');
    return;
  }

  const today = new Date().toISOString().split('T')[0]!; // YYYY-MM-DD

  try {
    await db
      .insert(schema.protocolAnalytics)
      .values({
        date: today,
        tvl: metrics.tvl.toString(),
        totalBorrowed: metrics.totalBorrowed.toString(),
        totalFees: metrics.totalFees.toString(),
        totalLiquidations: metrics.totalLiquidations.toString(),
        uniqueUsers: metrics.uniqueUsers,
        totalTransactions: metrics.totalTransactions,
        avgHealthFactor: metrics.avgHealthFactor,
        secLendingVolume: metrics.secLendingVolume.toString(),
        flashLoanVolume: metrics.flashLoanVolume.toString(),
        protocolRevenue: metrics.protocolRevenue.toString(),
      });

    log.info({ date: today }, 'Analytics snapshot inserted');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    // Duplicate key on the unique `date` column is expected if the job fires
    // more than once per day — treat as a no-op.
    if (typeof message === 'string' && message.includes('duplicate key')) {
      log.debug({ date: today }, 'Analytics snapshot already exists for today');
    } else {
      log.warn({ err: message }, 'Failed to insert analytics snapshot');
    }
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

registerJob('analytics', INTERVAL_MS, analyticsHandler);
