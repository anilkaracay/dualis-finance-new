import { eq, and, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { createChildLogger } from '../../config/logger.js';
import { getDb, schema } from '../../db/client.js';

const log = createChildLogger('governance-delegation');

function requireDb() {
  const db = getDb();
  if (!db) throw new Error('Database not available');
  return db;
}

export async function delegate(input: {
  delegatorId: string;
  delegatorAddress: string;
  delegateeId: string;
  delegateeAddress: string;
}) {
  const db = requireDb();

  if (input.delegatorId === input.delegateeId) {
    throw new Error('Cannot delegate to yourself');
  }

  // Check existing active delegation
  const [existing] = await db.select().from(schema.governanceDelegations)
    .where(and(
      eq(schema.governanceDelegations.delegatorId, input.delegatorId),
      eq(schema.governanceDelegations.isActive, true),
    ))
    .limit(1);
  if (existing) {
    throw new Error('Already delegating. Undelegate first.');
  }

  // Balance check
  const [balance] = await db.select().from(schema.dualTokenBalances)
    .where(eq(schema.dualTokenBalances.userId, input.delegatorId))
    .limit(1);
  if (!balance || parseFloat(balance.balance) <= 0) {
    throw new Error('No DUAL balance to delegate');
  }

  // Chain delegation prevention
  const [delegateesDelegation] = await db.select().from(schema.governanceDelegations)
    .where(and(
      eq(schema.governanceDelegations.delegatorId, input.delegateeId),
      eq(schema.governanceDelegations.isActive, true),
    ))
    .limit(1);
  if (delegateesDelegation) {
    throw new Error('No chain delegation allowed');
  }

  // Create delegation
  const [delegation] = await db.insert(schema.governanceDelegations).values({
    id: randomUUID(),
    delegatorId: input.delegatorId,
    delegatorAddress: input.delegatorAddress,
    delegateeId: input.delegateeId,
    delegateeAddress: input.delegateeAddress,
    amount: balance.balance,
    isActive: true,
  }).returning();

  // Update effective voting power
  await recalculateVotingPower(input.delegatorId);
  await recalculateVotingPower(input.delegateeId);

  log.info({ delegatorId: input.delegatorId, delegateeId: input.delegateeId }, 'Delegation created');
  return delegation;
}

export async function undelegate(delegatorId: string) {
  const db = requireDb();

  const [existing] = await db.select().from(schema.governanceDelegations)
    .where(and(
      eq(schema.governanceDelegations.delegatorId, delegatorId),
      eq(schema.governanceDelegations.isActive, true),
    ))
    .limit(1);

  if (!existing) throw new Error('No active delegation');

  const [updated] = await db.update(schema.governanceDelegations)
    .set({ isActive: false, revokedAt: new Date() })
    .where(eq(schema.governanceDelegations.id, existing.id))
    .returning();

  // Recalculate voting power for both parties
  await recalculateVotingPower(existing.delegatorId);
  await recalculateVotingPower(existing.delegateeId);

  log.info({ delegatorId, delegateeId: existing.delegateeId }, 'Delegation revoked');
  return updated;
}

export async function getDelegations(userId: string) {
  const db = requireDb();

  const [given] = await db.select().from(schema.governanceDelegations)
    .where(and(
      eq(schema.governanceDelegations.delegatorId, userId),
      eq(schema.governanceDelegations.isActive, true),
    ))
    .limit(1);

  const received = await db.select().from(schema.governanceDelegations)
    .where(and(
      eq(schema.governanceDelegations.delegateeId, userId),
      eq(schema.governanceDelegations.isActive, true),
    ));

  return { given: given ?? null, received };
}

export async function getVotingPower(userId: string) {
  const db = requireDb();

  const [balance] = await db.select().from(schema.dualTokenBalances)
    .where(eq(schema.dualTokenBalances.userId, userId))
    .limit(1);

  return {
    balance: balance?.balance ?? '0',
    delegatedOut: balance?.totalDelegatedOut ?? '0',
    delegatedIn: balance?.totalDelegatedIn ?? '0',
    effectiveVotingPower: balance?.effectiveVotingPower ?? '0',
  };
}

async function recalculateVotingPower(userId: string) {
  const db = requireDb();

  const [balance] = await db.select().from(schema.dualTokenBalances)
    .where(eq(schema.dualTokenBalances.userId, userId))
    .limit(1);
  if (!balance) return;

  // Delegated out
  const [delegatedOut] = await db.select({
    total: sql<string>`coalesce(sum(amount::numeric), 0)::text`,
  }).from(schema.governanceDelegations)
    .where(and(
      eq(schema.governanceDelegations.delegatorId, userId),
      eq(schema.governanceDelegations.isActive, true),
    ));

  // Delegated in
  const [delegatedIn] = await db.select({
    total: sql<string>`coalesce(sum(amount::numeric), 0)::text`,
  }).from(schema.governanceDelegations)
    .where(and(
      eq(schema.governanceDelegations.delegateeId, userId),
      eq(schema.governanceDelegations.isActive, true),
    ));

  const bal = parseFloat(balance.balance);
  const out = parseFloat(delegatedOut?.total ?? '0');
  const inAmt = parseFloat(delegatedIn?.total ?? '0');
  const effective = bal - out + inAmt;

  await db.update(schema.dualTokenBalances).set({
    totalDelegatedOut: out.toFixed(8),
    totalDelegatedIn: inAmt.toFixed(8),
    effectiveVotingPower: Math.max(0, effective).toFixed(8),
    updatedAt: new Date(),
  }).where(eq(schema.dualTokenBalances.userId, userId));
}
