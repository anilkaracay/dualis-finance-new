// ---------------------------------------------------------------------------
// Sanctions List Update Job — daily
// ---------------------------------------------------------------------------

import { createChildLogger } from '../config/logger.js';
import { env } from '../config/env.js';
import { registerJob } from './scheduler.js';
import { updateSanctionsList } from '../compliance/services/sanctions.service.js';
import { onSanctionsListUpdated } from '../compliance/hooks/compliance.hooks.js';

const log = createChildLogger('sanctions-list-update-job');

const SOURCES = ['ofac', 'eu', 'un', 'masak'];

/**
 * Download and update sanctions lists from all configured sources.
 */
export async function runSanctionsListUpdate(): Promise<void> {
  log.info('Starting sanctions list update');

  let totalAdded = 0;
  let totalUpdated = 0;
  let totalRemoved = 0;

  for (const source of SOURCES) {
    try {
      const result = await updateSanctionsList(source);
      totalAdded += result.added;
      totalUpdated += result.updated;
      totalRemoved += result.removed;
      log.info({ source, ...result }, 'Sanctions list source updated');
    } catch (err) {
      log.error({ err, source }, 'Failed to update sanctions list source');
    }
  }

  log.info({ totalAdded, totalUpdated, totalRemoved }, 'Sanctions list update complete');

  // Trigger re-screening if any entries were added or updated
  if (totalAdded > 0 || totalUpdated > 0) {
    await onSanctionsListUpdated().catch((err) => {
      log.warn({ err }, 'Failed to trigger post-update re-screening');
    });
  }
}

// Self-register with the scheduler
registerJob(
  'sanctions-list-update',
  env.COMPLIANCE_SANCTIONS_UPDATE_INTERVAL_MS,
  runSanctionsListUpdate,
);
