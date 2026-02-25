/**
 * Epoch Rotation Job — rotates reward epochs every 24 hours.
 *
 * 1. Closes the current active epoch (status → completed, set end_time)
 * 2. Creates a new epoch with incremented epoch_number
 * 3. Runs tier updates for all users
 */
import { eq, desc } from 'drizzle-orm';
import { createChildLogger } from '../config/logger.js';
import { registerJob } from './scheduler.js';
import { getDb } from '../db/client.js';
import { rewardEpochs } from '../db/schema.js';
import { updateAllUserTiers } from '../services/activity.service.js';

const log = createChildLogger('epoch-rotation');

const TWENTY_FOUR_HOURS = 86_400_000;

async function handler(): Promise<void> {
  const db = getDb();
  if (!db) {
    log.warn('Database not available — skipping epoch rotation');
    return;
  }

  try {
    // 1. Find current active epoch
    const activeEpochs = await db
      .select()
      .from(rewardEpochs)
      .where(eq(rewardEpochs.status, 'active'))
      .orderBy(desc(rewardEpochs.epochNumber))
      .limit(1);

    if (activeEpochs.length === 0) {
      // No active epoch — create the first one
      log.info('No active epoch found — creating epoch 1');
      await db.insert(rewardEpochs).values({
        epochNumber: 1,
        startTime: new Date(),
        status: 'active',
      });
      return;
    }

    const currentEpoch = activeEpochs[0]!;
    const now = new Date();
    const epochStart = new Date(currentEpoch.startTime);
    const elapsed = now.getTime() - epochStart.getTime();

    // Only rotate if 24 hours have passed
    if (elapsed < TWENTY_FOUR_HOURS) {
      log.debug(
        { epoch: currentEpoch.epochNumber, elapsedMs: elapsed },
        'Epoch not yet due for rotation',
      );
      return;
    }

    // 2. Close current epoch
    await db
      .update(rewardEpochs)
      .set({
        status: 'completed',
        endTime: now,
      })
      .where(eq(rewardEpochs.epochNumber, currentEpoch.epochNumber));

    log.info(
      {
        epoch: currentEpoch.epochNumber,
        totalActivities: currentEpoch.totalActivities,
        totalPoints: currentEpoch.totalPoints,
      },
      'Epoch completed',
    );

    // 3. Create next epoch
    const nextEpochNumber = currentEpoch.epochNumber + 1;
    await db.insert(rewardEpochs).values({
      epochNumber: nextEpochNumber,
      startTime: now,
      status: 'active',
    });

    log.info({ epoch: nextEpochNumber }, 'New epoch started');

    // 4. Run tier updates
    const tiersUpdated = await updateAllUserTiers();
    if (tiersUpdated > 0) {
      log.info({ tiersUpdated }, 'User tiers updated during epoch rotation');
    }
  } catch (err) {
    log.error({ err }, 'Epoch rotation failed');
  }
}

// Register with scheduler — check every hour, but only rotate if 24h elapsed
registerJob('epoch-rotation', 3_600_000, handler);
