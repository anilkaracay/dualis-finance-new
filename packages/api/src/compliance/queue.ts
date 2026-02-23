import { Queue } from 'bullmq';
import { createChildLogger } from '../config/logger.js';
import { env } from '../config/env.js';

const log = createChildLogger('compliance-queue');

const connection = {
  url: env.REDIS_URL,
  maxRetriesPerRequest: null as unknown as number,
};

let walletScreeningQueue: Queue | null = null;
let sanctionsScreeningQueue: Queue | null = null;
let periodicScreeningQueue: Queue | null = null;
let complianceCleanupQueue: Queue | null = null;

function createQueues(): void {
  try {
    walletScreeningQueue = new Queue('screening:wallet', {
      connection,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 60_000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    });

    sanctionsScreeningQueue = new Queue('screening:sanctions', {
      connection,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 60_000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    });

    periodicScreeningQueue = new Queue('screening:periodic', {
      connection,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 120_000 },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 2000 },
      },
    });

    complianceCleanupQueue = new Queue('compliance:cleanup', {
      connection,
      defaultJobOptions: {
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 100 },
      },
    });

    log.info('BullMQ compliance queues initialized');
  } catch (err) {
    log.warn({ err }, 'Failed to initialize compliance queues');
  }
}

export function getWalletScreeningQueue(): Queue | null { return walletScreeningQueue; }
export function getSanctionsScreeningQueue(): Queue | null { return sanctionsScreeningQueue; }
export function getPeriodicScreeningQueue(): Queue | null { return periodicScreeningQueue; }
export function getComplianceCleanupQueue(): Queue | null { return complianceCleanupQueue; }

export function initComplianceQueues(): void { createQueues(); }

export async function closeComplianceQueues(): Promise<void> {
  const queues = [walletScreeningQueue, sanctionsScreeningQueue, periodicScreeningQueue, complianceCleanupQueue];
  await Promise.allSettled(queues.map((q) => q?.close()));
  walletScreeningQueue = null;
  sanctionsScreeningQueue = null;
  periodicScreeningQueue = null;
  complianceCleanupQueue = null;
  log.info('BullMQ compliance queues closed');
}

export interface WalletScreeningJobData {
  userId: string;
  walletAddress: string;
  chain?: string;
}

export interface SanctionsScreeningJobData {
  userId: string;
  name: string;
  nationality?: string;
  dateOfBirth?: string;
}

export interface PeriodicScreeningJobData {
  userId: string;
  screeningType: 'full' | 'wallet' | 'sanctions';
}
