import { eq, and, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { createChildLogger } from '../../config/logger.js';
import { getDb, schema } from '../../db/client.js';
import { VoteDirection, ProposalStatus } from '@dualis/shared';
import { notificationBus } from '../../notification/notification.bus.js';

const log = createChildLogger('governance-vote');

function requireDb() {
  const db = getDb();
  if (!db) throw new Error('Database not available');
  return db;
}

export async function castVote(input: {
  proposalId: string;
  voterId: string;
  voterAddress: string;
  direction: VoteDirection;
}) {
  const db = requireDb();

  // 1) Proposal active?
  const [proposal] = await db.select().from(schema.governanceProposals)
    .where(eq(schema.governanceProposals.id, input.proposalId))
    .limit(1);
  if (!proposal) throw new Error('Proposal not found');
  if (proposal.status !== ProposalStatus.ACTIVE) throw new Error('Voting is not active');
  if (proposal.votingEndsAt && new Date() > proposal.votingEndsAt) {
    throw new Error('Voting period ended');
  }

  // 2) Snapshot weight
  const [snapshot] = await db.select().from(schema.governanceTokenSnapshots)
    .where(and(
      eq(schema.governanceTokenSnapshots.proposalId, input.proposalId),
      eq(schema.governanceTokenSnapshots.userId, input.voterId),
    ))
    .limit(1);
  if (!snapshot || parseFloat(snapshot.effectiveVotingPower) <= 0) {
    throw new Error('No voting power for this proposal');
  }
  const weight = snapshot.effectiveVotingPower;

  // 3) Existing vote?
  const [existing] = await db.select().from(schema.governanceVotes)
    .where(and(
      eq(schema.governanceVotes.proposalId, input.proposalId),
      eq(schema.governanceVotes.voterId, input.voterId),
    ))
    .limit(1);

  if (existing) {
    return changeVote(existing, input.direction);
  }

  // 4) Insert vote
  const [vote] = await db.insert(schema.governanceVotes).values({
    id: randomUUID(),
    proposalId: input.proposalId,
    voterId: input.voterId,
    voterAddress: input.voterAddress,
    direction: input.direction,
    weight,
  }).returning();

  // 5) Update counts
  await updateProposalVoteCounts(input.proposalId);

  log.info({ proposalId: input.proposalId, voterId: input.voterId, direction: input.direction }, 'Vote cast');

  // Notify proposer about the vote
  void notificationBus.emit({
    type: 'PROPOSAL_VOTED',
    category: 'governance',
    severity: 'info',
    partyId: proposal.proposerId,
    title: 'New Vote on Your Proposal',
    message: `A vote (${input.direction}) has been cast on "${proposal.title}" (${input.proposalId}).`,
    data: { proposalId: input.proposalId, direction: input.direction },
    link: `/governance/${input.proposalId}`,
    deduplicationKey: `vote:${input.proposalId}:${input.voterId}`,
  });

  return vote;
}

async function changeVote(
  existing: typeof schema.governanceVotes.$inferSelect,
  newDirection: VoteDirection,
) {
  const db = requireDb();
  if (existing.direction === newDirection) {
    throw new Error('Already voted in this direction');
  }

  const [updated] = await db.update(schema.governanceVotes)
    .set({
      direction: newDirection,
      previousDirection: existing.direction,
      changedAt: new Date(),
    })
    .where(eq(schema.governanceVotes.id, existing.id))
    .returning();

  await updateProposalVoteCounts(existing.proposalId);

  log.info({ proposalId: existing.proposalId, voterId: existing.voterId, from: existing.direction, to: newDirection }, 'Vote changed');
  return updated;
}

async function updateProposalVoteCounts(proposalId: string) {
  const db = requireDb();

  const [counts] = await db.select({
    forVotes: sql<string>`coalesce(sum(case when direction = 'FOR' then weight::numeric else 0 end), 0)::text`,
    againstVotes: sql<string>`coalesce(sum(case when direction = 'AGAINST' then weight::numeric else 0 end), 0)::text`,
    abstainVotes: sql<string>`coalesce(sum(case when direction = 'ABSTAIN' then weight::numeric else 0 end), 0)::text`,
    totalVoters: sql<number>`count(*)::int`,
  }).from(schema.governanceVotes)
    .where(eq(schema.governanceVotes.proposalId, proposalId));

  if (!counts) return;

  const totalVoted = parseFloat(counts.forVotes) + parseFloat(counts.againstVotes) + parseFloat(counts.abstainVotes);

  const [proposal] = await db.select({ quorumRequired: schema.governanceProposals.quorumRequired })
    .from(schema.governanceProposals)
    .where(eq(schema.governanceProposals.id, proposalId))
    .limit(1);

  await db.update(schema.governanceProposals).set({
    votesFor: counts.forVotes,
    votesAgainst: counts.againstVotes,
    votesAbstain: counts.abstainVotes,
    totalVoters: counts.totalVoters,
    quorumMet: proposal ? totalVoted >= parseFloat(proposal.quorumRequired) : false,
    updatedAt: new Date(),
  }).where(eq(schema.governanceProposals.id, proposalId));
}

export async function getVoteResults(proposalId: string) {
  const db = requireDb();

  const [proposal] = await db.select().from(schema.governanceProposals)
    .where(eq(schema.governanceProposals.id, proposalId))
    .limit(1);
  if (!proposal) throw new Error('Proposal not found');

  const allVotes = await db.select().from(schema.governanceVotes)
    .where(eq(schema.governanceVotes.proposalId, proposalId));

  return {
    proposalId,
    status: proposal.status,
    votesFor: proposal.votesFor,
    votesAgainst: proposal.votesAgainst,
    votesAbstain: proposal.votesAbstain,
    totalVoters: proposal.totalVoters,
    quorumRequired: proposal.quorumRequired,
    quorumMet: proposal.quorumMet,
    votes: allVotes,
  };
}

export async function getUserVote(proposalId: string, userId: string) {
  const db = requireDb();
  const [vote] = await db.select().from(schema.governanceVotes)
    .where(and(
      eq(schema.governanceVotes.proposalId, proposalId),
      eq(schema.governanceVotes.voterId, userId),
    ))
    .limit(1);
  return vote ?? null;
}
