import { Worker } from 'bullmq';
import { eq, and, gte, desc } from 'drizzle-orm';
import { createChildLogger } from '../../config/logger.js';
import { env } from '../../config/env.js';
import { getDb } from '../../db/client.js';
import * as schema from '../../db/schema.js';
import { getEmailQueue } from '../queue.js';
import type { EmailJobData } from '../queue.js';

const log = createChildLogger('digest-worker');

let worker: Worker | null = null;

export function startDigestWorker(): void {
  worker = new Worker(
    'notification:digest',
    async (job) => {
      log.info({ jobId: job.id }, 'Processing digest job');

      const db = getDb();
      if (!db) {
        log.warn('No DB — skipping digest');
        return;
      }

      const emailQueue = getEmailQueue();
      if (!emailQueue) {
        log.warn('No email queue — skipping digest');
        return;
      }

      try {
        // Find users with digest enabled
        const digestUsers = await db
          .select()
          .from(schema.notificationPreferences)
          .where(eq(schema.notificationPreferences.digestEnabled, true));

        log.info({ userCount: digestUsers.length }, 'Processing digests');

        for (const user of digestUsers) {
          try {
            await processUserDigest(db, emailQueue, user);
          } catch (err) {
            log.error({ err, partyId: user.partyId }, 'Failed to process digest for user');
          }
        }

        return { processed: digestUsers.length };
      } catch (err) {
        log.error({ err }, 'Digest job failed');
        throw err;
      }
    },
    {
      connection: { url: env.REDIS_URL, maxRetriesPerRequest: null as unknown as number },
      concurrency: 3,
    },
  );

  worker.on('completed', (job) => {
    log.debug({ jobId: job.id }, 'Digest job completed');
  });

  worker.on('failed', (job, err) => {
    log.error({ jobId: job?.id, err: err.message }, 'Digest job failed');
  });

  log.info('Digest worker started');
}

async function processUserDigest(
  db: NonNullable<ReturnType<typeof getDb>>,
  emailQueue: NonNullable<ReturnType<typeof getEmailQueue>>,
  user: typeof schema.notificationPreferences.$inferSelect,
): Promise<void> {
  const frequency = user.digestFrequency;
  const sinceDate = new Date();

  if (frequency === 'daily') {
    sinceDate.setDate(sinceDate.getDate() - 1);
  } else {
    sinceDate.setDate(sinceDate.getDate() - 7);
  }

  // Get notifications since last digest period
  const recentNotifs = await db
    .select()
    .from(schema.notifications)
    .where(
      and(
        eq(schema.notifications.partyId, user.partyId),
        gte(schema.notifications.createdAt, sinceDate),
      ),
    )
    .orderBy(desc(schema.notifications.createdAt))
    .limit(50);

  if (recentNotifs.length === 0) {
    log.debug({ partyId: user.partyId }, 'No notifications for digest — skipping');
    return;
  }

  const criticalCount = recentNotifs.filter((n) => n.severity === 'critical').length;
  const topEvents = recentNotifs.slice(0, 5).map((n) => ({
    title: n.title,
    message: n.message,
    severity: n.severity,
  }));

  const toAddress = user.emailAddress;
  if (!toAddress) {
    // Try users table
    const userRows = await db
      .select({ email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.partyId, user.partyId))
      .limit(1);

    if (userRows.length === 0) return;
    const email = userRows[0]!.email;
    if (!email) return;

    const jobData: EmailJobData = {
      notificationId: `digest_${Date.now()}`,
      partyId: user.partyId,
      toAddress: email,
      templateId: 'digest',
      templateData: {
        period: frequency === 'daily' ? 'Daily' : 'Weekly',
        totalNotifications: recentNotifs.length,
        criticalCount,
        topEvents,
      },
      severity: 'info',
    };

    await emailQueue.add('send-digest', jobData);
    return;
  }

  const jobData: EmailJobData = {
    notificationId: `digest_${Date.now()}`,
    partyId: user.partyId,
    toAddress,
    templateId: 'digest',
    templateData: {
      period: frequency === 'daily' ? 'Daily' : 'Weekly',
      totalNotifications: recentNotifs.length,
      criticalCount,
      topEvents,
    },
    severity: 'info',
  };

  await emailQueue.add('send-digest', jobData);
}

export async function stopDigestWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    log.info('Digest worker stopped');
  }
}
