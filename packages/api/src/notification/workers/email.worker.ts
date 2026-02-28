import { Worker } from 'bullmq';
import { createChildLogger } from '../../config/logger.js';
import { env } from '../../config/env.js';
import { deliver } from '../channels/email.channel.js';
import type { EmailJobData } from '../queue.js';

const log = createChildLogger('email-worker');

let worker: Worker | null = null;

export function startEmailWorker(): void {
  worker = new Worker<EmailJobData>(
    'notification-email',
    async (job) => {
      const { notificationId, partyId, toAddress, templateId, templateData } = job.data;

      log.info(
        { jobId: job.id, notificationId, toAddress, templateId, attempt: job.attemptsMade + 1 },
        'Processing email job',
      );

      const result = await deliver(notificationId, partyId, toAddress, templateId, templateData);

      if (!result.success) {
        throw new Error(result.error ?? 'Email delivery failed');
      }

      return { resendId: result.resendId };
    },
    {
      connection: { url: env.REDIS_URL, maxRetriesPerRequest: null as unknown as number },
      concurrency: 5,
      limiter: { max: 50, duration: 60_000 }, // Max 50 emails/minute globally
    },
  );

  worker.on('completed', (job) => {
    log.debug({ jobId: job.id }, 'Email job completed');
  });

  worker.on('failed', (job, err) => {
    log.error(
      { jobId: job?.id, err: err.message, attempt: job?.attemptsMade },
      'Email job failed',
    );
  });

  log.info('Email worker started');
}

export async function stopEmailWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    log.info('Email worker stopped');
  }
}
