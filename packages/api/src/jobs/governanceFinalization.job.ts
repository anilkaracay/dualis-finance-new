import { createChildLogger } from '../config/logger.js';
import { getDb } from '../db/client.js';
import { registerJob } from './scheduler.js';
import { finalizeExpiredProposals } from '../services/governance/executionService.js';

const log = createChildLogger('governance-finalization');

// ---------------------------------------------------------------------------
// Interval — every 5 minutes
// ---------------------------------------------------------------------------

const INTERVAL_MS = 5 * 60 * 1_000;

// ---------------------------------------------------------------------------
// Job handler
// ---------------------------------------------------------------------------

/**
 * Periodically finalizes governance proposals whose voting period has ended.
 *
 * - ACTIVE proposals past votingEndsAt are resolved to PASSED, REJECTED, or
 *   QUORUM_NOT_MET based on vote tally and quorum status.
 * - Passed proposals are auto-queued for timelock execution.
 * - Execution queue items past their deadline are marked EXPIRED.
 */
async function governanceFinalizationHandler(): Promise<void> {
  const db = getDb();

  if (!db) {
    log.debug('Database unavailable — governance finalization skipped');
    return;
  }

  await finalizeExpiredProposals();
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

registerJob('governance-finalization', INTERVAL_MS, governanceFinalizationHandler);
