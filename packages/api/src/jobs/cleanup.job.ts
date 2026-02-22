import { createChildLogger } from '../config/logger.js';
import { getDb } from '../db/client.js';
import { registerJob } from './scheduler.js';

const log = createChildLogger('cleanup');

// ---------------------------------------------------------------------------
// Interval — every 24 hours
// ---------------------------------------------------------------------------

const INTERVAL_MS = 24 * 60 * 60 * 1_000;

// ---------------------------------------------------------------------------
// Retention windows
// ---------------------------------------------------------------------------

/** Pool snapshots older than this are pruned. */
const POOL_SNAPSHOT_RETENTION_DAYS = 90;

/** Price history records older than this are pruned. */
const PRICE_HISTORY_RETENTION_DAYS = 30;

// ---------------------------------------------------------------------------
// Job handler
// ---------------------------------------------------------------------------

/**
 * Cleans up stale data from the analytics tables.
 *
 * In production this would execute `DELETE` queries against `poolSnapshots`
 * and `priceHistory` for records exceeding the retention window. The SQL
 * would look roughly like:
 *
 * ```sql
 * DELETE FROM pool_snapshots
 *  WHERE timestamp < NOW() - INTERVAL '90 days';
 *
 * DELETE FROM price_history
 *  WHERE timestamp < NOW() - INTERVAL '30 days';
 * ```
 *
 * Currently this runs as a mock that logs the intended action.
 */
async function cleanupHandler(): Promise<void> {
  const db = getDb();

  if (!db) {
    log.debug('Database unavailable — cleanup skipped');
    return;
  }

  // In production: execute pruning queries via Drizzle `delete()` with
  // `lt(schema.poolSnapshots.timestamp, cutoffDate)`.

  const poolSnapshotCutoff = new Date(
    Date.now() - POOL_SNAPSHOT_RETENTION_DAYS * 24 * 60 * 60 * 1_000,
  ).toISOString();

  const priceHistoryCutoff = new Date(
    Date.now() - PRICE_HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1_000,
  ).toISOString();

  log.info(
    {
      poolSnapshotCutoff,
      priceHistoryCutoff,
      poolSnapshotRetentionDays: POOL_SNAPSHOT_RETENTION_DAYS,
      priceHistoryRetentionDays: PRICE_HISTORY_RETENTION_DAYS,
    },
    'Cleanup complete (mock — no rows deleted)',
  );
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

registerJob('cleanup', INTERVAL_MS, cleanupHandler);
