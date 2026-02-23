// ---------------------------------------------------------------------------
// Compliance Periodic Re-screening Job — daily at 02:00 UTC
// ---------------------------------------------------------------------------

import { lte, eq, and, isNotNull } from 'drizzle-orm';
import { getDb } from '../db/client.js';
import { users } from '../db/schema.js';
import { createChildLogger } from '../config/logger.js';
import { env } from '../config/env.js';
import { registerJob } from './scheduler.js';
import { getPeriodicScreeningQueue } from '../compliance/queue.js';

const log = createChildLogger('compliance-screening-job');

/**
 * Check for users due for re-screening and enqueue jobs.
 */
export async function runComplianceScreening(): Promise<void> {
  const db = getDb();
  if (!db) {
    log.warn('DB unavailable — skipping compliance screening');
    return;
  }

  const queue = getPeriodicScreeningQueue();
  if (!queue) {
    log.warn('Periodic screening queue unavailable — skipping');
    return;
  }

  const now = new Date();

  // Find users whose next screening date has passed
  const dueUsers = await db
    .select({
      userId: users.userId,
      complianceRiskLevel: users.complianceRiskLevel,
    })
    .from(users)
    .where(
      and(
        lte(users.nextScreeningAt, now),
        isNotNull(users.nextScreeningAt),
        eq(users.accountStatus, 'active'),
      ),
    )
    .limit(500);

  if (dueUsers.length === 0) {
    log.debug('No users due for compliance re-screening');
    return;
  }

  log.info({ count: dueUsers.length }, 'Enqueueing periodic compliance re-screenings');

  for (const user of dueUsers) {
    await queue.add(
      `periodic-${user.userId}`,
      {
        userId: user.userId,
        screeningType: 'full',
      },
      { delay: Math.random() * 600_000 }, // Spread over 10 minutes
    );
  }

  log.info({ count: dueUsers.length }, 'Periodic screening jobs enqueued');
}

// Self-register with the scheduler
registerJob(
  'compliance-screening',
  env.COMPLIANCE_PERIODIC_SCREENING_INTERVAL_MS,
  runComplianceScreening,
);
