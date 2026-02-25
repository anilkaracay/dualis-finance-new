/**
 * Background jobs barrel file.
 *
 * Importing this module causes every job to self-register with the scheduler.
 * Call {@link initScheduler} after import to start all registered jobs, and
 * {@link stopScheduler} during graceful shutdown to clear timers.
 */
import './oracleUpdate.job.js';
import './healthCheck.job.js';
import './interestAccrual.job.js';
import './creditRecalc.job.js';
import './analytics.job.js';
import './cleanup.job.js';

// Auth cleanup
import './authCleanup.job.js';

// Innovation jobs
import './compositeScoreRecalc.job.js';
import './productiveMonitor.job.js';
import './corporateActionProcessor.job.js';
import './kybExpiryCheck.job.js';

// Compliance jobs (MP21)
import './complianceScreening.job.js';
import './sanctionsListUpdate.job.js';

// Governance jobs (MP23)
import './governanceFinalization.job.js';

// Analytics & Reporting jobs (MP24)
import './analyticsSnapshot.job.js';

// Rewards jobs (MP25)
import './epochRotation.job.js';

export { initScheduler, stopScheduler } from './scheduler.js';
