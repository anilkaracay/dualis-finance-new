/**
 * Activity Service — System B (Internal Protocol Rewards)
 *
 * Manages point system, tier tracking, leaderboard, and activity logging
 * in PostgreSQL for gamification and reward distribution.
 */
import { eq, desc, sql, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { createChildLogger } from '../config/logger.js';
import { getDb } from '../db/client.js';
import {
  activityLogs,
  userRewards,
  rewardEpochs,
} from '../db/schema.js';

const log = createChildLogger('activity-service');

// ---------------------------------------------------------------------------
// Point system configuration
// ---------------------------------------------------------------------------

type ActivityType = 'deposit' | 'withdraw' | 'borrow' | 'repay' | 'add_collateral';

const POINT_CONFIG: Record<ActivityType, { base: number; per1000: number }> = {
  deposit:        { base: 100, per1000: 1 },
  withdraw:       { base: 50,  per1000: 0 },
  borrow:         { base: 150, per1000: 1 },
  repay:          { base: 200, per1000: 1 },
  add_collateral: { base: 75,  per1000: 0 },
};

// ---------------------------------------------------------------------------
// Tier thresholds
// ---------------------------------------------------------------------------

function resolveTier(totalPoints: number): { tier: string; multiplier: number } {
  if (totalPoints >= 20000) return { tier: 'diamond', multiplier: 2.0 };
  if (totalPoints >= 5000)  return { tier: 'gold',    multiplier: 1.5 };
  if (totalPoints >= 1000)  return { tier: 'silver',  multiplier: 1.25 };
  return { tier: 'bronze', multiplier: 1.0 };
}

// ---------------------------------------------------------------------------
// Point calculation
// ---------------------------------------------------------------------------

export function calculatePoints(
  activityType: ActivityType,
  amountUSD: number,
  multiplier: number,
): number {
  const config = POINT_CONFIG[activityType] ?? POINT_CONFIG.deposit;
  const volumeBonus = config.per1000 > 0 ? Math.floor(amountUSD / 1000) * config.per1000 : 0;
  return Math.floor((config.base + volumeBonus) * multiplier);
}

// ---------------------------------------------------------------------------
// Log activity
// ---------------------------------------------------------------------------

export interface LogActivityInput {
  activityType: ActivityType;
  userId?: string | undefined;
  partyId: string;
  poolId?: string | undefined;
  asset?: string | undefined;
  amount?: number | undefined;
  cantonOffset?: string | undefined;
  cantonContractId?: string | undefined;
  activityMarkerCreated?: boolean | undefined;
}

export async function logActivity(input: LogActivityInput): Promise<void> {
  const db = getDb();
  if (!db) {
    log.warn('Database not available — skipping activity log');
    return;
  }

  try {
    // Get user's current tier multiplier
    let multiplier = 1.0;
    if (input.userId) {
      const existing = await db
        .select({ tierMultiplier: userRewards.tierMultiplier })
        .from(userRewards)
        .where(eq(userRewards.userId, input.userId))
        .limit(1);
      const first = existing[0];
      if (first) {
        multiplier = parseFloat(first.tierMultiplier);
      }
    }

    // Calculate points
    const amountUSD = input.amount ?? 0;
    const points = calculatePoints(input.activityType as ActivityType, amountUSD, multiplier);

    // Get current epoch
    const currentEpochRows = await db
      .select({ epochNumber: rewardEpochs.epochNumber })
      .from(rewardEpochs)
      .where(eq(rewardEpochs.status, 'active'))
      .orderBy(desc(rewardEpochs.epochNumber))
      .limit(1);
    const epochNum = currentEpochRows[0]?.epochNumber ?? 1;

    // Insert activity log
    const activityId = nanoid();
    await db.insert(activityLogs).values({
      id: activityId,
      activityType: input.activityType,
      userId: input.userId ?? null,
      partyId: input.partyId,
      poolId: input.poolId ?? null,
      asset: input.asset ?? null,
      amount: input.amount?.toString() ?? null,
      cantonOffset: input.cantonOffset ?? null,
      cantonContractId: input.cantonContractId ?? null,
      activityMarkerCreated: input.activityMarkerCreated ?? false,
      rewardPoints: points,
      epoch: epochNum,
    });

    // Upsert user rewards
    if (input.userId) {
      await updateUserRewards(db, input.userId, points, amountUSD);
    }

    // Update epoch aggregates
    await db
      .update(rewardEpochs)
      .set({
        totalActivities: sql`${rewardEpochs.totalActivities} + 1`,
        totalVolume: sql`${rewardEpochs.totalVolume} + ${amountUSD.toString()}`,
        totalPoints: sql`${rewardEpochs.totalPoints} + ${points}`,
      })
      .where(eq(rewardEpochs.epochNumber, epochNum));

    log.debug(
      { activityType: input.activityType, points, userId: input.userId, epoch: epochNum },
      'Activity logged',
    );
  } catch (err) {
    log.error({ err, input: { type: input.activityType, userId: input.userId } }, 'Failed to log activity');
  }
}

// ---------------------------------------------------------------------------
// User rewards upsert + tier update
// ---------------------------------------------------------------------------

async function updateUserRewards(
  db: NonNullable<ReturnType<typeof getDb>>,
  userId: string,
  points: number,
  volumeUSD: number,
): Promise<void> {
  const existing = await db
    .select()
    .from(userRewards)
    .where(eq(userRewards.userId, userId))
    .limit(1);

  if (existing.length === 0) {
    // Insert new user reward record
    const { tier, multiplier } = resolveTier(points);
    await db.insert(userRewards).values({
      id: nanoid(),
      userId,
      totalPoints: points,
      totalActivities: 1,
      totalVolume: volumeUSD.toString(),
      tier,
      tierMultiplier: multiplier.toFixed(2),
      lastActivityAt: new Date(),
      updatedAt: new Date(),
    });
  } else {
    // Update existing
    const current = existing[0]!;
    const newTotalPoints = current.totalPoints + points;
    const { tier, multiplier } = resolveTier(newTotalPoints);

    await db
      .update(userRewards)
      .set({
        totalPoints: sql`${userRewards.totalPoints} + ${points}`,
        totalActivities: sql`${userRewards.totalActivities} + 1`,
        totalVolume: sql`${userRewards.totalVolume} + ${volumeUSD.toString()}`,
        tier,
        tierMultiplier: multiplier.toFixed(2),
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userRewards.userId, userId));
  }
}

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

export async function getUserRewardStats(userId: string) {
  const db = getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(userRewards)
    .where(eq(userRewards.userId, userId))
    .limit(1);

  return rows[0] ?? null;
}

export async function getActivities(filters: {
  userId?: string | undefined;
  partyId?: string | undefined;
  activityType?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}) {
  const db = getDb();
  if (!db) return { data: [], total: 0 };

  const conditions = [];
  if (filters.userId) conditions.push(eq(activityLogs.userId, filters.userId));
  if (filters.partyId) conditions.push(eq(activityLogs.partyId, filters.partyId));
  if (filters.activityType) conditions.push(eq(activityLogs.activityType, filters.activityType));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(activityLogs)
      .where(where)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(activityLogs)
      .where(where),
  ]);

  const countRow = countResult[0];
  return { data, total: countRow?.count ?? 0 };
}

export async function getActivityStats() {
  const db = getDb();
  if (!db) return null;

  const rows = await db
    .select({
      totalActivities: sql<number>`count(*)::int`,
      totalVolume: sql<string>`coalesce(sum(${activityLogs.amount}), 0)`,
      totalPoints: sql<number>`coalesce(sum(${activityLogs.rewardPoints}), 0)::int`,
      uniqueUsers: sql<number>`count(distinct ${activityLogs.userId})::int`,
    })
    .from(activityLogs);

  return rows[0] ?? null;
}

export async function getLeaderboard(limit = 20) {
  const db = getDb();
  if (!db) return [];

  return db
    .select({
      userId: userRewards.userId,
      totalPoints: userRewards.totalPoints,
      totalActivities: userRewards.totalActivities,
      totalVolume: userRewards.totalVolume,
      tier: userRewards.tier,
      tierMultiplier: userRewards.tierMultiplier,
      lastActivityAt: userRewards.lastActivityAt,
    })
    .from(userRewards)
    .orderBy(desc(userRewards.totalPoints))
    .limit(limit);
}

export async function getEpochs(limit = 30) {
  const db = getDb();
  if (!db) return [];

  return db
    .select()
    .from(rewardEpochs)
    .orderBy(desc(rewardEpochs.epochNumber))
    .limit(limit);
}

export async function getEpochByNumber(epochNumber: number) {
  const db = getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(rewardEpochs)
    .where(eq(rewardEpochs.epochNumber, epochNumber))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Update all user tiers based on current points.
 * Called by epoch rotation job.
 */
export async function updateAllUserTiers(): Promise<number> {
  const db = getDb();
  if (!db) return 0;

  const allUsers = await db.select().from(userRewards);
  let updated = 0;

  for (const user of allUsers) {
    const { tier, multiplier } = resolveTier(user.totalPoints);
    if (user.tier !== tier) {
      await db
        .update(userRewards)
        .set({
          tier,
          tierMultiplier: multiplier.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(userRewards.userId, user.userId));
      updated++;
    }
  }

  return updated;
}
