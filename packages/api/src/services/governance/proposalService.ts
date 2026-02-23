import { eq, desc, and, sql, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { createChildLogger } from '../../config/logger.js';
import { getDb, schema } from '../../db/client.js';
import {
  ProposalType,
  ProposalStatus,
  GOVERNANCE,
  DEFAULT_GOVERNANCE_CONFIG,
} from '@dualis/shared';
import type { ProposalPayload } from '@dualis/shared';
import { notificationBus } from '../../notification/notification.bus.js';

const log = createChildLogger('governance-proposal');

function requireDb() {
  const db = getDb();
  if (!db) throw new Error('Database not available');
  return db;
}

export async function createProposal(input: {
  proposerId: string;
  proposerAddress: string;
  title: string;
  description: string;
  discussionUrl?: string | null;
  type: ProposalType;
  payload: ProposalPayload;
}) {
  const db = requireDb();

  // 1) DUAL balance check
  const balance = await db.select().from(schema.dualTokenBalances)
    .where(eq(schema.dualTokenBalances.userId, input.proposerId))
    .limit(1);
  const threshold = parseFloat(DEFAULT_GOVERNANCE_CONFIG.proposalThreshold);
  if (!balance[0] || parseFloat(balance[0].balance) < threshold) {
    throw new Error(`Minimum ${threshold} DUAL required to create proposal`);
  }

  // 2) Active proposal limit
  const [activeResult] = await db.select({ count: sql<number>`count(*)::int` })
    .from(schema.governanceProposals)
    .where(inArray(schema.governanceProposals.status, [ProposalStatus.DRAFT, ProposalStatus.ACTIVE]));
  if ((activeResult?.count ?? 0) >= GOVERNANCE.MAX_ACTIVE_PROPOSALS) {
    throw new Error(`Maximum ${GOVERNANCE.MAX_ACTIVE_PROPOSALS} active proposals allowed`);
  }

  // 3) Parameter cooldown
  if (input.type === ProposalType.PARAMETER_CHANGE) {
    const recent = await db.select().from(schema.governanceProposals)
      .where(and(
        eq(schema.governanceProposals.type, ProposalType.PARAMETER_CHANGE),
        eq(schema.governanceProposals.status, ProposalStatus.EXECUTED),
        sql`executed_at > now() - interval '${sql.raw(String(GOVERNANCE.PARAMETER_COOLDOWN_DAYS))} days'`
      )).limit(1);
    if (recent.length > 0) {
      throw new Error(`Parameter cooldown: wait ${GOVERNANCE.PARAMETER_COOLDOWN_DAYS} days`);
    }
  }

  // 4) DIP number
  const [lastProposal] = await db.select({
    maxNum: sql<number>`coalesce(max(proposal_number), 0)::int`,
  }).from(schema.governanceProposals);
  const proposalNumber = (lastProposal?.maxNum ?? 0) + 1;
  const proposalId = `${GOVERNANCE.PROPOSAL_PREFIX}-${proposalNumber}`;

  // 5) Quorum calculation
  const totalSupply = await getTotalDualSupply();
  const quorumPct = DEFAULT_GOVERNANCE_CONFIG.quorumPercentage[input.type];
  const quorumRequired = (totalSupply * quorumPct) / 100;

  // 6) Timing
  const votingPeriodDays = DEFAULT_GOVERNANCE_CONFIG.votingPeriodDays[input.type];
  const timelockHours = DEFAULT_GOVERNANCE_CONFIG.timelockHours[input.type];
  const now = new Date();
  const votingEndsAt = new Date(now.getTime() + votingPeriodDays * 86400000);
  const timelockEndsAt = new Date(votingEndsAt.getTime() + timelockHours * 3600000);
  const executionDeadline = new Date(
    timelockEndsAt.getTime() + DEFAULT_GOVERNANCE_CONFIG.executionWindowDays * 86400000
  );

  // 7) Snapshot
  await takeSnapshot(proposalId, proposalNumber);

  // 8) DB insert
  const [proposal] = await db.insert(schema.governanceProposals).values({
    id: proposalId,
    proposalNumber,
    proposerId: input.proposerId,
    proposerAddress: input.proposerAddress,
    title: input.title,
    description: input.description,
    discussionUrl: input.discussionUrl,
    type: input.type,
    payload: input.payload as unknown as Record<string, unknown>,
    status: ProposalStatus.ACTIVE,
    snapshotBlock: proposalNumber,
    votingStartsAt: now,
    votingEndsAt,
    timelockEndsAt,
    executionDeadline,
    quorumRequired: quorumRequired.toFixed(8),
  }).returning();

  log.info({ proposalId, type: input.type }, 'Proposal created');

  // Emit notification
  void notificationBus.emit({
    type: 'PROPOSAL_CREATED',
    category: 'governance',
    severity: 'info',
    partyId: input.proposerId,
    title: 'Proposal Created',
    message: `Your proposal "${input.title}" (${proposalId}) has been created and is now active for voting.`,
    data: { proposalId, type: input.type },
    link: `/governance/${proposalId}`,
  });

  return proposal;
}

async function takeSnapshot(proposalId: string, snapshotBlock: number) {
  const db = requireDb();
  const allBalances = await db.select().from(schema.dualTokenBalances);
  if (allBalances.length === 0) return;

  const snapshots = allBalances.map(b => ({
    id: randomUUID(),
    proposalId,
    userId: b.userId,
    userAddress: b.userAddress,
    balance: b.balance,
    delegatedTo: null as string | null,
    receivedDelegation: b.totalDelegatedIn,
    effectiveVotingPower: b.effectiveVotingPower,
    snapshotBlock,
  }));

  await db.insert(schema.governanceTokenSnapshots).values(snapshots);
  log.debug({ proposalId, count: snapshots.length }, 'Snapshot taken');
}

export async function listProposals(filters: {
  status?: string | undefined;
  type?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}) {
  const db = requireDb();
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 20, 50);
  const offset = (page - 1) * limit;

  const conditions = [];
  if (filters.status && filters.status !== 'all') {
    conditions.push(eq(schema.governanceProposals.status, filters.status));
  }
  if (filters.type) {
    conditions.push(eq(schema.governanceProposals.type, filters.type));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, [countResult]] = await Promise.all([
    db.select().from(schema.governanceProposals)
      .where(where)
      .orderBy(desc(schema.governanceProposals.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` })
      .from(schema.governanceProposals)
      .where(where),
  ]);

  return {
    items,
    total: countResult?.count ?? 0,
    page,
    limit,
  };
}

export async function getProposal(proposalId: string) {
  const db = requireDb();
  const [proposal] = await db.select().from(schema.governanceProposals)
    .where(eq(schema.governanceProposals.id, proposalId))
    .limit(1);
  if (!proposal) throw new Error('Proposal not found');
  return proposal;
}

export async function cancelProposal(proposalId: string, userId: string) {
  const db = requireDb();
  const proposal = await getProposal(proposalId);

  if (proposal.proposerId !== userId) throw new Error('Only proposer can cancel');
  if (proposal.status !== ProposalStatus.ACTIVE) throw new Error('Can only cancel active proposals');

  const [updated] = await db.update(schema.governanceProposals)
    .set({
      status: ProposalStatus.CANCELLED,
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.governanceProposals.id, proposalId))
    .returning();

  log.info({ proposalId }, 'Proposal cancelled');
  return updated;
}

export async function getGovernanceConfig() {
  return DEFAULT_GOVERNANCE_CONFIG;
}

async function getTotalDualSupply(): Promise<number> {
  const db = requireDb();
  const [result] = await db.select({
    total: sql<string>`coalesce(sum(balance::numeric), 0)::text`,
  }).from(schema.dualTokenBalances);
  return parseFloat(result?.total || '0');
}
