import { Worker } from 'bullmq';
import { env } from '../../config/env.js';
import { createChildLogger } from '../../config/logger.js';
import { checkSanctions } from '../services/sanctions.service.js';
import type { SanctionsScreeningJobData } from '../queue.js';

const log = createChildLogger('sanctions-screening-worker');

let worker: Worker | null = null;

export function startSanctionsScreeningWorker(): void {
  worker = new Worker<SanctionsScreeningJobData>(
    'screening-sanctions',
    async (job) => {
      const { name, nationality, dateOfBirth } = job.data;
      log.info({ name, jobId: job.id }, 'Processing sanctions screening');
      const opts: { nationality?: string; dateOfBirth?: string } = {};
      if (nationality) opts.nationality = nationality;
      if (dateOfBirth) opts.dateOfBirth = dateOfBirth;
      await checkSanctions(name, opts);
    },
    {
      connection: { url: env.REDIS_URL, maxRetriesPerRequest: null as unknown as number },
      concurrency: 5,
    },
  );

  worker.on('failed', (job, err) => {
    log.error({ err, jobId: job?.id }, 'Sanctions screening job failed');
  });

  log.info('Sanctions screening worker started');
}

export async function stopSanctionsScreeningWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    log.info('Sanctions screening worker stopped');
  }
}
