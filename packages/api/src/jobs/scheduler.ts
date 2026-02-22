import { createChildLogger } from '../config/logger.js';

const log = createChildLogger('scheduler');

/** Describes a recurring background job managed by the scheduler. */
interface ScheduledJob {
  /** Human-readable job name for logging. */
  name: string;
  /** Interval between executions in milliseconds. */
  intervalMs: number;
  /** Async handler invoked on each tick. */
  handler: () => Promise<void>;
  /** Handle returned by `setInterval`, used for cleanup. */
  timer?: ReturnType<typeof setInterval> | undefined;
  /** Whether the job is currently executing (prevents overlap). */
  running: boolean;
}

const jobs: ScheduledJob[] = [];

/**
 * Register a named background job with the scheduler.
 *
 * Jobs are not started until {@link initScheduler} is called. Each job runs
 * at most once concurrently — if a previous invocation is still in progress
 * when the timer fires, the tick is skipped.
 */
export function registerJob(
  name: string,
  intervalMs: number,
  handler: () => Promise<void>,
): void {
  jobs.push({ name, intervalMs, handler, running: false });
}

/**
 * Execute a single job tick with overlap protection and error handling.
 */
async function runJob(job: ScheduledJob): Promise<void> {
  if (job.running) {
    log.debug({ job: job.name }, 'Skipping — previous execution still in progress');
    return;
  }

  job.running = true;
  const start = Date.now();

  try {
    await job.handler();
    log.debug({ job: job.name, durationMs: Date.now() - start }, 'Job completed');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log.error({ err: message, job: job.name }, 'Job execution failed');
  } finally {
    job.running = false;
  }
}

/**
 * Start all registered jobs.
 *
 * Each job is invoked once immediately and then on its configured interval.
 */
export function initScheduler(): void {
  log.info({ jobCount: jobs.length }, 'Starting scheduler');

  for (const job of jobs) {
    // Fire immediately (non-blocking)
    void runJob(job);

    // Schedule recurring execution
    job.timer = setInterval(() => {
      void runJob(job);
    }, job.intervalMs);

    log.info(
      { name: job.name, intervalMs: job.intervalMs },
      'Job registered and started',
    );
  }
}

/**
 * Stop all scheduled jobs and clear the registry.
 *
 * Safe to call multiple times.
 */
export function stopScheduler(): void {
  for (const job of jobs) {
    if (job.timer) {
      clearInterval(job.timer);
      job.timer = undefined;
    }
  }
  jobs.length = 0;
  log.info('Scheduler stopped');
}
