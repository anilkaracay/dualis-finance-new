import { Queue } from 'bullmq';
import { createChildLogger } from '../config/logger.js';
import { env } from '../config/env.js';

const log = createChildLogger('notification-queue');

// ---------------------------------------------------------------------------
// BullMQ connection options — reuse existing Redis URL
// ---------------------------------------------------------------------------

const connection = {
  url: env.REDIS_URL,
  maxRetriesPerRequest: null as unknown as number,
};

// ---------------------------------------------------------------------------
// Queue definitions
// ---------------------------------------------------------------------------

let emailQueue: Queue | null = null;
let webhookQueue: Queue | null = null;
let digestQueue: Queue | null = null;
let cleanupQueue: Queue | null = null;

function createQueues(): void {
  try {
    emailQueue = new Queue('notification:email', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 30_000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    });

    webhookQueue = new Queue('notification:webhook', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 30_000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    });

    digestQueue = new Queue('notification:digest', {
      connection,
      defaultJobOptions: {
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    });

    cleanupQueue = new Queue('notification:cleanup', {
      connection,
      defaultJobOptions: {
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 100 },
      },
    });

    log.info('BullMQ notification queues initialized');
  } catch (err) {
    log.warn({ err }, 'Failed to initialize BullMQ queues — notification delivery degraded');
  }
}

// ---------------------------------------------------------------------------
// Public accessors
// ---------------------------------------------------------------------------

export function getEmailQueue(): Queue | null {
  return emailQueue;
}

export function getWebhookQueue(): Queue | null {
  return webhookQueue;
}

export function getDigestQueue(): Queue | null {
  return digestQueue;
}

export function getCleanupQueue(): Queue | null {
  return cleanupQueue;
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export function initNotificationQueues(): void {
  createQueues();
}

export async function closeNotificationQueues(): Promise<void> {
  const queues = [emailQueue, webhookQueue, digestQueue, cleanupQueue];
  await Promise.allSettled(queues.map((q) => q?.close()));
  emailQueue = null;
  webhookQueue = null;
  digestQueue = null;
  cleanupQueue = null;
  log.info('BullMQ notification queues closed');
}

// ---------------------------------------------------------------------------
// Job data types
// ---------------------------------------------------------------------------

export interface EmailJobData {
  notificationId: string;
  partyId: string;
  toAddress: string;
  templateId: string;
  templateData: Record<string, unknown>;
  severity: string;
}

export interface WebhookJobData {
  notificationId: string;
  webhookEndpointId: string;
  payload: Record<string, unknown>;
  secret: string;
  url: string;
}
