import { eq, and, lte } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { createChildLogger } from '../../config/logger.js';
import { getDb, schema } from '../../db/client.js';
import { ProposalStatus, DEFAULT_GOVERNANCE_CONFIG } from '@dualis/shared';
import { notificationBus } from '../../notification/notification.bus.js';

const log = createChildLogger('governance-execution');

function requireDb() {
  const db = getDb();
  if (!db) throw new Error('Database not available');
  return db;
}

export async function queueExecution(proposalId: string) {
  const db = requireDb();

  const [proposal] = await db.select().from(schema.governanceProposals)
    .where(eq(schema.governanceProposals.id, proposalId))
    .limit(1);
  if (!proposal) throw new Error('Proposal not found');
  if (proposal.status !== ProposalStatus.PASSED) throw new Error('Proposal must be passed');

  const timelockEndsAt = proposal.timelockEndsAt ?? new Date();
  const executionDeadline = proposal.executionDeadline ?? new Date(
    timelockEndsAt.getTime() + DEFAULT_GOVERNANCE_CONFIG.executionWindowDays * 86400000
  );

  const [queueItem] = await db.insert(schema.governanceExecutionQueue).values({
    id: randomUUID(),
    proposalId,
    actionType: proposal.type,
    actionPayload: proposal.payload as Record<string, unknown>,
    timelockEndsAt,
    executionDeadline,
    status: 'PENDING',
  }).returning();

  // Move proposal to TIMELOCK status
  await db.update(schema.governanceProposals).set({
    status: ProposalStatus.TIMELOCK,
    updatedAt: new Date(),
  }).where(eq(schema.governanceProposals.id, proposalId));

  log.info({ proposalId }, 'Proposal queued for execution');
  return queueItem;
}

export async function executeProposal(proposalId: string, executedBy: string) {
  const db = requireDb();

  const [queueItem] = await db.select().from(schema.governanceExecutionQueue)
    .where(eq(schema.governanceExecutionQueue.proposalId, proposalId))
    .limit(1);
  if (!queueItem) throw new Error('No execution queue item found');
  if (queueItem.status !== 'PENDING') throw new Error('Not in PENDING status');

  const now = new Date();
  if (now < queueItem.timelockEndsAt) throw new Error('Timelock period not ended');
  if (now > queueItem.executionDeadline) throw new Error('Execution deadline passed');

  // Update queue item
  await db.update(schema.governanceExecutionQueue).set({
    status: 'EXECUTED',
    executedAt: now,
    executedBy,
  }).where(eq(schema.governanceExecutionQueue.id, queueItem.id));

  // Update proposal
  await db.update(schema.governanceProposals).set({
    status: ProposalStatus.EXECUTED,
    executedAt: now,
    updatedAt: now,
  }).where(eq(schema.governanceProposals.id, proposalId));

  log.info({ proposalId, executedBy }, 'Proposal executed');

  // Notify proposer
  const [executedProposal] = await db.select().from(schema.governanceProposals)
    .where(eq(schema.governanceProposals.id, proposalId)).limit(1);
  if (executedProposal) {
    void notificationBus.emit({
      type: 'PROPOSAL_EXECUTED',
      category: 'governance',
      severity: 'info',
      partyId: executedProposal.proposerId,
      title: 'Proposal Executed',
      message: `Proposal "${executedProposal.title}" (${proposalId}) has been executed.`,
      data: { proposalId },
      link: `/governance/${proposalId}`,
    });
  }

  return { proposalId, status: 'EXECUTED' };
}

export async function vetoProposal(proposalId: string, vetoedBy: string, reason: string) {
  const db = requireDb();

  const [proposal] = await db.select().from(schema.governanceProposals)
    .where(eq(schema.governanceProposals.id, proposalId))
    .limit(1);
  if (!proposal) throw new Error('Proposal not found');
  if (proposal.status !== ProposalStatus.TIMELOCK) throw new Error('Can only veto during timelock');

  const now = new Date();

  // Update queue item
  await db.update(schema.governanceExecutionQueue).set({
    status: 'VETOED',
  }).where(eq(schema.governanceExecutionQueue.proposalId, proposalId));

  // Update proposal
  await db.update(schema.governanceProposals).set({
    status: ProposalStatus.VETOED,
    vetoedAt: now,
    vetoedBy,
    updatedAt: now,
  }).where(eq(schema.governanceProposals.id, proposalId));

  log.info({ proposalId, vetoedBy, reason }, 'Proposal vetoed');

  // Notify proposer
  void notificationBus.emit({
    type: 'PROPOSAL_VETOED',
    category: 'governance',
    severity: 'warning',
    partyId: proposal.proposerId,
    title: 'Proposal Vetoed',
    message: `Proposal "${proposal.title}" (${proposalId}) has been vetoed. Reason: ${reason}`,
    data: { proposalId, reason },
    link: `/governance/${proposalId}`,
  });

  return { proposalId, status: 'VETOED' };
}

export async function finalizeExpiredProposals() {
  const db = requireDb();
  const now = new Date();

  // 1) Finalize ACTIVE proposals whose voting period has ended
  const endedActive = await db.select().from(schema.governanceProposals)
    .where(and(
      eq(schema.governanceProposals.status, ProposalStatus.ACTIVE),
      lte(schema.governanceProposals.votingEndsAt, now),
    ));

  let passedCount = 0;
  let rejectedCount = 0;
  let quorumNotMetCount = 0;

  for (const proposal of endedActive) {
    const quorumMet = proposal.quorumMet ?? false;
    const votesFor = parseFloat(proposal.votesFor);
    const votesAgainst = parseFloat(proposal.votesAgainst);

    let newStatus: string;
    if (!quorumMet) {
      newStatus = ProposalStatus.QUORUM_NOT_MET;
      quorumNotMetCount++;
    } else if (votesFor > votesAgainst) {
      newStatus = ProposalStatus.PASSED;
      passedCount++;
    } else {
      newStatus = ProposalStatus.REJECTED;
      rejectedCount++;
    }

    await db.update(schema.governanceProposals).set({
      status: newStatus,
      updatedAt: now,
    }).where(eq(schema.governanceProposals.id, proposal.id));

    // Auto-queue passed proposals for timelock execution
    if (newStatus === ProposalStatus.PASSED) {
      try {
        await queueExecution(proposal.id);
      } catch (err) {
        log.error({ err, proposalId: proposal.id }, 'Failed to queue execution for passed proposal');
      }

      void notificationBus.emit({
        type: 'PROPOSAL_PASSED',
        category: 'governance',
        severity: 'info',
        partyId: proposal.proposerId,
        title: 'Proposal Passed',
        message: `Your proposal "${proposal.title}" (${proposal.id}) has passed and entered timelock.`,
        data: { proposalId: proposal.id },
        link: `/governance/${proposal.id}`,
      });
    } else if (newStatus === ProposalStatus.REJECTED) {
      void notificationBus.emit({
        type: 'PROPOSAL_REJECTED',
        category: 'governance',
        severity: 'info',
        partyId: proposal.proposerId,
        title: 'Proposal Rejected',
        message: `Your proposal "${proposal.title}" (${proposal.id}) did not pass — votes against exceeded votes for.`,
        data: { proposalId: proposal.id },
        link: `/governance/${proposal.id}`,
      });
    }
  }

  // 2) Expire execution queue items past deadline
  const expiredExec = await db.update(schema.governanceExecutionQueue)
    .set({ status: 'EXPIRED' })
    .where(and(
      eq(schema.governanceExecutionQueue.status, 'PENDING'),
      lte(schema.governanceExecutionQueue.executionDeadline, now),
    ))
    .returning();

  for (const item of expiredExec) {
    await db.update(schema.governanceProposals).set({
      status: ProposalStatus.EXPIRED,
      updatedAt: now,
    }).where(eq(schema.governanceProposals.id, item.proposalId));
  }

  if (endedActive.length > 0 || expiredExec.length > 0) {
    log.info({
      passed: passedCount,
      rejected: rejectedCount,
      quorumNotMet: quorumNotMetCount,
      expiredExec: expiredExec.length,
    }, 'Governance finalization cycle complete');
  }
}
