import { Worker } from 'bullmq';
import { env } from '../../config/env.js';
import { createChildLogger } from '../../config/logger.js';
import { screenWallet } from '../services/aml.service.js';
import type { WalletScreeningJobData } from '../queue.js';

const log = createChildLogger('wallet-screening-worker');

let worker: Worker | null = null;

export function startWalletScreeningWorker(): void {
  worker = new Worker<WalletScreeningJobData>(
    'screening:wallet',
    async (job) => {
      const { userId, walletAddress } = job.data;
      log.info({ userId, walletAddress, jobId: job.id }, 'Processing wallet screening');
      await screenWallet(userId, walletAddress);
    },
    {
      connection: { url: env.REDIS_URL, maxRetriesPerRequest: null as unknown as number },
      concurrency: 3,
    },
  );

  worker.on('failed', (job, err) => {
    log.error({ err, jobId: job?.id }, 'Wallet screening job failed');
  });

  log.info('Wallet screening worker started');
}

export async function stopWalletScreeningWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    log.info('Wallet screening worker stopped');
  }
}
