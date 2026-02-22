// ============================================================================
// Oracle Update Background Job
// ============================================================================
// Runs the oracle pipeline on a configurable interval.
// Replaces the previous mock random-jitter price generator.

import { env } from '../config/env.js';
import { createChildLogger } from '../config/logger.js';
import { registerJob } from './scheduler.js';
import { initOracle, runOracleCycle } from '../oracle/oracle.service.js';

const log = createChildLogger('oracle-update');

/** Shutdown handle from oracle init */
let oracleShutdown: (() => Promise<void>) | null = null;

/**
 * Initialize the oracle pipeline and register the update job.
 */
function initOracleJob(): void {
  const handle = initOracle();
  oracleShutdown = handle.shutdown;
  log.info('Oracle pipeline initialized');
}

/**
 * Job handler: runs a single oracle cycle.
 */
async function oracleUpdateHandler(): Promise<void> {
  // Lazy init on first tick
  if (!oracleShutdown) {
    initOracleJob();
  }

  await runOracleCycle();
}

/**
 * Gracefully shut down the oracle pipeline (Binance WS, etc.).
 * Called during server shutdown.
 */
export async function shutdownOracle(): Promise<void> {
  if (oracleShutdown) {
    await oracleShutdown();
    oracleShutdown = null;
  }
}

// Register with the scheduler
registerJob('oracle-update', env.ORACLE_UPDATE_INTERVAL_MS, oracleUpdateHandler);
