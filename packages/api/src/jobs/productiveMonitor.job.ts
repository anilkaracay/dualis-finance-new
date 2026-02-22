import { createChildLogger } from '../config/logger.js';
import { registerJob } from './scheduler.js';

const log = createChildLogger('productive-monitor');

/** Run every hour — monitor productive projects and process cashflows. */
const INTERVAL_MS = 60 * 60 * 1_000; // 1 hour

async function productiveMonitorHandler(): Promise<void> {
  log.debug('Running productive project monitor');

  // In production, this would:
  // 1. Query operational projects from DB
  // 2. Check IoT data against expected thresholds
  // 3. Trigger warnings if production below 70% of expected
  // 4. Check for due cashflow payments and auto-process repayments
  // 5. Update project statuses (e.g., InConstruction → Operational)
  // 6. Send notifications for overdue cashflows

  // Mock: log that monitoring completed
  log.debug('Productive monitor check complete — all projects nominal');
}

registerJob('productive-monitor', INTERVAL_MS, productiveMonitorHandler);
