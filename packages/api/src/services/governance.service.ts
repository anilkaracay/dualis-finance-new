import { createChildLogger } from '../config/logger.js';
import type {
  ListProposalsParams,
  CreateProposalRequest,
  CastVoteRequest,
  ProposalListItem,
  CreateProposalResponse,
  CastVoteResponse,
  Pagination,
  TransactionMeta,
} from '@dualis/shared';
import { randomUUID } from 'node:crypto';

const log = createChildLogger('governance-service');

function buildTransactionMeta(): TransactionMeta {
  return {
    id: `tx-${randomUUID()}`,
    status: 'confirmed',
    timestamp: new Date().toISOString(),
  };
}

const MOCK_PROPOSALS: ProposalListItem[] = [
  {
    proposalId: 'DIP-001',
    title: 'Add wBTC as Tier-1 Collateral',
    description:
      'Proposal to add wrapped Bitcoin (wBTC) as a Tier-1 collateral asset with a 75% loan-to-value ratio and 82% liquidation threshold, enabling broader borrowing capabilities for BTC holders.',
    proposer: 'party::community-member-alpha',
    category: 'asset_listing',
    status: 'active',
    forVotes: 12_500_000,
    againstVotes: 3_200_000,
    abstainVotes: 800_000,
    quorum: 10_000_000,
    quorumReached: true,
    startTime: '2026-02-15T00:00:00.000Z',
    endTime: '2026-02-25T00:00:00.000Z',
    timeRemaining: '3d 2h',
  },
  {
    proposalId: 'DIP-002',
    title: 'Reduce Flash Loan Fee to 0.05%',
    description:
      'Proposal to reduce the flash loan fee from 0.09% to 0.05% to increase competitiveness and volume. Analysis shows this would increase net revenue through higher utilization.',
    proposer: 'party::protocol-team',
    category: 'parameter_change',
    status: 'active',
    forVotes: 8_900_000,
    againstVotes: 6_100_000,
    abstainVotes: 2_300_000,
    quorum: 10_000_000,
    quorumReached: true,
    startTime: '2026-02-18T00:00:00.000Z',
    endTime: '2026-02-28T00:00:00.000Z',
    timeRemaining: '6d 2h',
  },
  {
    proposalId: 'DIP-003',
    title: 'Treasury Diversification into Real-World Assets',
    description:
      'Allocate 15% of protocol treasury reserves into tokenized US Treasury bonds for yield generation and stability. Expected to generate ~5.2% APY on idle treasury funds.',
    proposer: 'party::treasury-committee',
    category: 'treasury_allocation',
    status: 'passed',
    forVotes: 18_200_000,
    againstVotes: 2_100_000,
    abstainVotes: 1_500_000,
    quorum: 10_000_000,
    quorumReached: true,
    startTime: '2026-01-20T00:00:00.000Z',
    endTime: '2026-01-30T00:00:00.000Z',
    timeRemaining: '0d 0h',
  },
  {
    proposalId: 'DIP-004',
    title: 'Implement Credit Score v2 Algorithm',
    description:
      'Upgrade the credit scoring algorithm to v2, incorporating securities lending history and cross-protocol activity. Includes retroactive score adjustments for early participants.',
    proposer: 'party::credit-assessor',
    category: 'protocol_upgrade',
    status: 'executed',
    forVotes: 21_400_000,
    againstVotes: 900_000,
    abstainVotes: 500_000,
    quorum: 10_000_000,
    quorumReached: true,
    startTime: '2025-12-01T00:00:00.000Z',
    endTime: '2025-12-11T00:00:00.000Z',
    timeRemaining: '0d 0h',
  },
  {
    proposalId: 'DIP-005',
    title: 'Increase Staking Safety Module APY',
    description:
      'Increase the safety module staking APY from 8.5% to 12% to attract more DUAL tokens into the safety module. This strengthens protocol insurance coverage.',
    proposer: 'party::risk-committee',
    category: 'parameter_change',
    status: 'rejected',
    forVotes: 4_200_000,
    againstVotes: 14_800_000,
    abstainVotes: 3_000_000,
    quorum: 10_000_000,
    quorumReached: true,
    startTime: '2026-01-05T00:00:00.000Z',
    endTime: '2026-01-15T00:00:00.000Z',
    timeRemaining: '0d 0h',
  },
];

export function listProposals(
  params: ListProposalsParams
): { data: ProposalListItem[]; pagination: Pagination } {
  log.debug({ params }, 'Listing proposals');

  let filtered = [...MOCK_PROPOSALS];

  if (params.status && params.status !== 'all') {
    filtered = filtered.filter((p) => p.status === params.status);
  }

  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;
  const total = filtered.length;
  const page = filtered.slice(offset, offset + limit);

  return {
    data: page,
    pagination: { total, limit, offset, hasMore: offset + limit < total },
  };
}

export function createProposal(
  partyId: string,
  params: CreateProposalRequest
): { data: CreateProposalResponse; transaction: TransactionMeta } {
  log.info({ partyId, title: params.title }, 'Creating proposal');

  const nextId = `DIP-${String(MOCK_PROPOSALS.length + 1).padStart(3, '0')}`;

  return {
    data: {
      proposalId: nextId,
      status: 'active',
    },
    transaction: buildTransactionMeta(),
  };
}

export function castVote(
  partyId: string,
  proposalId: string,
  params: CastVoteRequest
): { data: CastVoteResponse; transaction: TransactionMeta } {
  log.info({ partyId, proposalId, vote: params.vote }, 'Casting vote');

  const proposal = MOCK_PROPOSALS.find((p) => p.proposalId === proposalId);
  if (!proposal) {
    throw new Error(`Proposal ${proposalId} not found`);
  }

  const weight = parseFloat(params.weight);
  const newForVotes =
    params.vote === 'for' ? proposal.forVotes + weight : proposal.forVotes;

  return {
    data: {
      recorded: true,
      newForVotes,
    },
    transaction: buildTransactionMeta(),
  };
}
