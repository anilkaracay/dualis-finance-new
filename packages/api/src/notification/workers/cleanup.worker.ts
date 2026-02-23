import { Worker } from 'bullmq';
import { lt } from 'drizzle-orm';
import { createChildLogger } from '../../config/logger.js';
import { env } from '../../config/env.js';
import { getDb } from '../../db/client.js';
import * as schema from '../../db/schema.js';

const log = createChildLogger('cleanup-worker');

let worker: Worker | null = null;

export function startCleanupWorker(): void {
  worker = new Worker(
    'notification:cleanup',
    async (job) => {
      const start = Date.now();
      log.info({ jobId: job.id }, 'Processing cleanup job');

      const db = getDb();
      if (!db) {
        log.warn('No DB — skipping cleanup');
        return;
      }

      try {
        // 1. Delete old notifications (retention: NOTIFICATION_RETENTION_DAYS)
        const notifCutoff = new Date();
        notifCutoff.setDate(notifCutoff.getDate() - env.NOTIFICATION_RETENTION_DAYS);

        const deletedNotifs = await db
          .delete(schema.notifications)
          .where(lt(schema.notifications.createdAt, notifCutoff))
          .returning({ id: schema.notifications.id });

        // 2. Delete old email delivery logs
        const logCutoff = new Date();
        logCutoff.setDate(logCutoff.getDate() - env.NOTIFICATION_DELIVERY_LOG_RETENTION_DAYS);

        const deletedEmailLogs = await db
          .delete(schema.emailDeliveryLog)
          .where(lt(schema.emailDeliveryLog.sentAt, logCutoff))
          .returning({ id: schema.emailDeliveryLog.id });

        // 3. Delete old webhook delivery logs
        const deletedWebhookLogs = await db
          .delete(schema.webhookDeliveryLog)
          .where(lt(schema.webhookDeliveryLog.deliveredAt, logCutoff))
          .returning({ id: schema.webhookDeliveryLog.id });

        const durationMs = Date.now() - start;

        log.info(
          {
            deletedNotifications: deletedNotifs.length,
            deletedEmailLogs: deletedEmailLogs.length,
            deletedWebhookLogs: deletedWebhookLogs.length,
            durationMs,
          },
          'Cleanup completed',
        );

        return {
          deletedNotifications: deletedNotifs.length,
          deletedEmailLogs: deletedEmailLogs.length,
          deletedWebhookLogs: deletedWebhookLogs.length,
          durationMs,
        };
      } catch (err) {
        log.error({ err }, 'Cleanup job failed');
        throw err;
      }
    },
    {
      connection: { url: env.REDIS_URL, maxRetriesPerRequest: null as unknown as number },
      concurrency: 1,
    },
  );

  worker.on('completed', (job) => {
    log.debug({ jobId: job.id }, 'Cleanup job completed');
  });

  worker.on('failed', (job, err) => {
    log.error({ jobId: job?.id, err: err.message }, 'Cleanup job failed');
  });

  log.info('Cleanup worker started');
}

export async function stopCleanupWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    log.info('Cleanup worker stopped');
  }
}
