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

export { initScheduler, stopScheduler } from './scheduler.js';
