import { Worker } from 'bullmq';
import { env } from '../../config/env.js';
import { createChildLogger } from '../../config/logger.js';

const log = createChildLogger('compliance-cleanup-worker');

let worker: Worker | null = null;

export function startComplianceCleanupWorker(): void {
  worker = new Worker(
    'compliance:cleanup',
    async (job) => {
      log.info({ jobId: job.id, type: job.name }, 'Processing compliance cleanup');
      // Placeholder: process GDPR deletions past retention, archive old data, clean Redis keys
    },
    {
      connection: { url: env.REDIS_URL, maxRetriesPerRequest: null as unknown as number },
      concurrency: 1,
    },
  );

  worker.on('failed', (job, err) => {
    log.error({ err, jobId: job?.id }, 'Compliance cleanup job failed');
  });

  log.info('Compliance cleanup worker started');
}

export async function stopComplianceCleanupWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    log.info('Compliance cleanup worker stopped');
  }
}
