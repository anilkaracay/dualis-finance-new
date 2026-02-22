import { createChildLogger } from '../config/logger.js';
import { registerJob } from './scheduler.js';

const log = createChildLogger('kyb-expiry-check');

/** Run daily — check for expiring KYB verifications. */
const INTERVAL_MS = 24 * 60 * 60 * 1_000; // 24 hours

async function kybExpiryCheckHandler(): Promise<void> {
  log.debug('Running KYB expiry check');

  // In production, this would:
  // 1. Query verified institutions from DB
  // 2. Check for KYB expirations:
  //    - 30 days before: send warning notification
  //    - 7 days before: send urgent notification
  //    - Expired: downgrade to restricted access, send notification
  // 3. Update institution status for expired entries
  // 4. Log all status changes for compliance audit trail

  // Mock: log check completed
  log.debug('KYB expiry check complete — no expirations found');
}

registerJob('kyb-expiry-check', INTERVAL_MS, kybExpiryCheckHandler);
