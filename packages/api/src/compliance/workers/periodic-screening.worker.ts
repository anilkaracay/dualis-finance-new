import { Worker } from 'bullmq';
import { env } from '../../config/env.js';
import { createChildLogger } from '../../config/logger.js';
import { rescreenAllUserWallets } from '../services/aml.service.js';
import { calculateRiskAssessment } from '../services/risk.service.js';
import type { PeriodicScreeningJobData } from '../queue.js';

const log = createChildLogger('periodic-screening-worker');

let worker: Worker | null = null;

export function startPeriodicScreeningWorker(): void {
  worker = new Worker<PeriodicScreeningJobData>(
    'screening:periodic',
    async (job) => {
      const { userId, screeningType } = job.data;
      log.info({ userId, screeningType, jobId: job.id }, 'Processing periodic screening');

      if (screeningType === 'wallet' || screeningType === 'full') {
        await rescreenAllUserWallets(userId);
      }

      // Always recalculate risk
      await calculateRiskAssessment(userId, `periodic:${screeningType}`);
    },
    {
      connection: { url: env.REDIS_URL, maxRetriesPerRequest: null as unknown as number },
      concurrency: 3,
    },
  );

  worker.on('failed', (job, err) => {
    log.error({ err, jobId: job?.id }, 'Periodic screening job failed');
  });

  log.info('Periodic screening worker started');
}

export async function stopPeriodicScreeningWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    log.info('Periodic screening worker stopped');
  }
}
