import { createChildLogger } from '../config/logger.js';
import { getDb } from '../db/client.js';
import { registerJob } from './scheduler.js';

const log = createChildLogger('credit-recalc');

// ---------------------------------------------------------------------------
// Interval — every 24 hours (in dev; production would be cron-scheduled)
// ---------------------------------------------------------------------------

const INTERVAL_MS = 24 * 60 * 60 * 1_000;

// ---------------------------------------------------------------------------
// Job handler
// ---------------------------------------------------------------------------

/**
 * Recalculates credit scores for all protocol participants.
 *
 * In production this would:
 * 1. Query all unique party IDs from `userActivity`.
 * 2. For each party, aggregate loan completions, repayment timeliness,
 *    volume history, collateral health, and sec-lending deal completion.
 * 3. Invoke `calculateCreditScore()` from `@dualis/shared`.
 * 4. Upsert results into the `creditScoreCache` table.
 * 5. Broadcast tier-change notifications via WebSocket.
 *
 * Currently runs as a no-op mock that logs completion.
 */
async function creditRecalcHandler(): Promise<void> {
  const db = getDb();

  if (!db) {
    log.debug('Database unavailable — skipping credit recalculation');
    return;
  }

  // In production: query userActivity, compute scores, upsert creditScoreCache.
  // For now, log a placeholder message.
  log.info('Credit recalculation complete (mock — no-op)');
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

registerJob('credit-recalc', INTERVAL_MS, creditRecalcHandler);
