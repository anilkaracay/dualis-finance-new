import { Worker } from 'bullmq';
import { createChildLogger } from '../../config/logger.js';
import { env } from '../../config/env.js';
import { deliver } from '../channels/webhook.channel.js';
import type { WebhookJobData } from '../queue.js';

const log = createChildLogger('webhook-worker');

let worker: Worker | null = null;

export function startWebhookWorker(): void {
  worker = new Worker<WebhookJobData>(
    'notification-webhook',
    async (job) => {
      const { notificationId, webhookEndpointId, url, secret, payload } = job.data;

      log.info(
        { jobId: job.id, notificationId, webhookEndpointId, attempt: job.attemptsMade + 1 },
        'Processing webhook job',
      );

      const result = await deliver(
        notificationId,
        webhookEndpointId,
        url,
        secret,
        payload,
        job.attemptsMade + 1,
      );

      if (!result.success) {
        throw new Error(result.error ?? `Webhook delivery failed (HTTP ${result.httpStatus})`);
      }

      return { httpStatus: result.httpStatus };
    },
    {
      connection: { url: env.REDIS_URL, maxRetriesPerRequest: null as unknown as number },
      concurrency: 10,
    },
  );

  worker.on('completed', (job) => {
    log.debug({ jobId: job.id }, 'Webhook job completed');
  });

  worker.on('failed', (job, err) => {
    log.error(
      { jobId: job?.id, err: err.message, attempt: job?.attemptsMade },
      'Webhook job failed',
    );
  });

  log.info('Webhook worker started');
}

export async function stopWebhookWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    log.info('Webhook worker stopped');
  }
}
