import { eq } from 'drizzle-orm';
import { getDb } from '../../db/client.js';
import { users } from '../../db/schema.js';
import { createChildLogger } from '../../config/logger.js';
import { getWalletScreeningQueue, getPeriodicScreeningQueue } from '../queue.js';

const log = createChildLogger('compliance-hooks');

export async function onWalletConnected(userId: string, walletAddress: string): Promise<void> {
  const queue = getWalletScreeningQueue();
  if (!queue) {
    log.debug('Wallet screening queue not available — skipping');
    return;
  }

  await queue.add(`wallet-${userId}-${walletAddress}`, { userId, walletAddress });
  log.debug({ userId, walletAddress }, 'Wallet screening job enqueued');
}

export async function onLargeTransaction(userId: string, amountUsd: number): Promise<void> {
  if (amountUsd < 50000) return;

  log.info({ userId, amountUsd }, 'Large transaction detected — enhanced screening');
  const queue = getPeriodicScreeningQueue();
  if (queue) {
    await queue.add(`enhanced-${userId}`, { userId, screeningType: 'full' }, { priority: 1 });
  }
}

export async function onProfileUpdated(userId: string, changes: Record<string, unknown>): Promise<void> {
  if (!changes.country) return;

  log.info({ userId, country: changes.country }, 'Country changed — re-assessing geo risk');
  const queue = getPeriodicScreeningQueue();
  if (queue) {
    await queue.add(`geo-${userId}`, { userId, screeningType: 'full' });
  }
}

export async function onSanctionsListUpdated(): Promise<void> {
  const db = getDb();
  if (!db) return;

  const activeUsers = await db
    .select({ userId: users.userId, displayName: users.displayName })
    .from(users)
    .where(eq(users.accountStatus, 'active'))
    .limit(1000);

  log.info({ count: activeUsers.length }, 'Re-checking users against updated sanctions list');

  const queue = getPeriodicScreeningQueue();
  if (!queue) return;

  for (const user of activeUsers) {
    await queue.add(`sanctions-recheck-${user.userId}`, {
      userId: user.userId,
      screeningType: 'sanctions',
    }, { delay: Math.random() * 3600_000 }); // Spread over 1 hour
  }
}
