// ══════════════════════════════════════════════════════════════════════════════
// GOVERNANCE MODULE — Full Type System (MP23)
// ══════════════════════════════════════════════════════════════════════════════

// ─── Proposal Types ──────────────────────────────────────────────────────────

export enum ProposalType {
  PARAMETER_CHANGE = 'PARAMETER_CHANGE',
  NEW_POOL = 'NEW_POOL',
  POOL_DEPRECATION = 'POOL_DEPRECATION',
  COLLATERAL_ADD = 'COLLATERAL_ADD',
  COLLATERAL_REMOVE = 'COLLATERAL_REMOVE',
  TREASURY_SPEND = 'TREASURY_SPEND',
  EMERGENCY_ACTION = 'EMERGENCY_ACTION',
  PROTOCOL_UPGRADE = 'PROTOCOL_UPGRADE',
  FEE_CHANGE = 'FEE_CHANGE',
  ORACLE_CONFIG = 'ORACLE_CONFIG',
}

export enum ProposalStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  QUORUM_NOT_MET = 'QUORUM_NOT_MET',
  PASSED = 'PASSED',
  REJECTED = 'REJECTED',
  TIMELOCK = 'TIMELOCK',
  READY = 'READY',
  EXECUTED = 'EXECUTED',
  VETOED = 'VETOED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum VoteDirection {
  FOR = 'FOR',
  AGAINST = 'AGAINST',
  ABSTAIN = 'ABSTAIN',
}

// ─── Legacy type aliases (backwards compat for existing code) ────────────────

/** @deprecated Use ProposalStatus enum instead */
export type LegacyProposalStatus = 'active' | 'passed' | 'rejected' | 'executed' | 'cancelled';

/** @deprecated Use ProposalType enum instead */
export type ProposalCategory =
  | 'parameter_change'
  | 'asset_listing'
  | 'protocol_upgrade'
  | 'treasury_allocation'
  | 'emergency';

// ─── Proposal Payloads ───────────────────────────────────────────────────────

export interface ParameterChangePayload {
  poolId: string;
  parameter: string;
  currentValue: string;
  proposedValue: string;
  rationale: string;
}

export interface NewPoolPayload {
  assetSymbol: string;
  assetType: string;
  initialLtv: string;
  initialLiquidationThreshold: string;
  initialBaseBorrowRate: string;
  oracleSourceId: string;
}

export interface TreasurySpendPayload {
  recipientAddress: string;
  amount: string;
  asset: string;
  purpose: string;
  executionMethod: 'direct' | 'vesting';
  vestingDurationDays?: number;
}

export interface EmergencyActionPayload {
  action: 'PAUSE_PROTOCOL' | 'PAUSE_POOL' | 'OVERRIDE_ORACLE' | 'FORCE_LIQUIDATION';
  targetPoolId?: string;
  overridePrice?: string;
  reason: string;
}

export interface FeeChangePayload {
  feeType: 'PROTOCOL_FEE' | 'LIQUIDATION_PENALTY' | 'BORROW_FEE';
  currentRate: string;
  proposedRate: string;
  poolId?: string;
}

export type ProposalPayload =
  | { type: ProposalType.PARAMETER_CHANGE; data: ParameterChangePayload }
  | { type: ProposalType.NEW_POOL; data: NewPoolPayload }
  | { type: ProposalType.POOL_DEPRECATION; data: { poolId: string; reason: string; migrationPoolId?: string } }
  | { type: ProposalType.COLLATERAL_ADD; data: NewPoolPayload }
  | { type: ProposalType.COLLATERAL_REMOVE; data: { assetSymbol: string; reason: string } }
  | { type: ProposalType.TREASURY_SPEND; data: TreasurySpendPayload }
  | { type: ProposalType.EMERGENCY_ACTION; data: EmergencyActionPayload }
  | { type: ProposalType.PROTOCOL_UPGRADE; data: { darHash: string; releaseNotes: string; version: string } }
  | { type: ProposalType.FEE_CHANGE; data: FeeChangePayload }
  | { type: ProposalType.ORACLE_CONFIG; data: { assetSymbol: string; newSourceId: string; reason: string } };

// ─── Governance Configuration ────────────────────────────────────────────────

export interface GovernanceConfigData {
  quorumPercentage: Record<ProposalType, number>;
  votingPeriodDays: Record<ProposalType, number>;
  timelockHours: Record<ProposalType, number>;
  proposalThreshold: string;
  executionWindowDays: number;
}

export const DEFAULT_GOVERNANCE_CONFIG: GovernanceConfigData = {
  quorumPercentage: {
    [ProposalType.PARAMETER_CHANGE]: 10,
    [ProposalType.NEW_POOL]: 15,
    [ProposalType.POOL_DEPRECATION]: 20,
    [ProposalType.COLLATERAL_ADD]: 15,
    [ProposalType.COLLATERAL_REMOVE]: 20,
    [ProposalType.TREASURY_SPEND]: 25,
    [ProposalType.EMERGENCY_ACTION]: 5,
    [ProposalType.PROTOCOL_UPGRADE]: 20,
    [ProposalType.FEE_CHANGE]: 10,
    [ProposalType.ORACLE_CONFIG]: 15,
  },
  votingPeriodDays: {
    [ProposalType.PARAMETER_CHANGE]: 5,
    [ProposalType.NEW_POOL]: 7,
    [ProposalType.POOL_DEPRECATION]: 7,
    [ProposalType.COLLATERAL_ADD]: 7,
    [ProposalType.COLLATERAL_REMOVE]: 7,
    [ProposalType.TREASURY_SPEND]: 7,
    [ProposalType.EMERGENCY_ACTION]: 1,
    [ProposalType.PROTOCOL_UPGRADE]: 7,
    [ProposalType.FEE_CHANGE]: 5,
    [ProposalType.ORACLE_CONFIG]: 5,
  },
  timelockHours: {
    [ProposalType.PARAMETER_CHANGE]: 48,
    [ProposalType.NEW_POOL]: 48,
    [ProposalType.POOL_DEPRECATION]: 72,
    [ProposalType.COLLATERAL_ADD]: 48,
    [ProposalType.COLLATERAL_REMOVE]: 72,
    [ProposalType.TREASURY_SPEND]: 72,
    [ProposalType.EMERGENCY_ACTION]: 0,
    [ProposalType.PROTOCOL_UPGRADE]: 96,
    [ProposalType.FEE_CHANGE]: 48,
    [ProposalType.ORACLE_CONFIG]: 48,
  },
  proposalThreshold: '100',
  executionWindowDays: 7,
};

// ─── Domain Interfaces ───────────────────────────────────────────────────────

export interface GovernanceProposal {
  id: string;
  proposalNumber: number;
  proposerId: string;
  proposerAddress: string;
  title: string;
  description: string;
  discussionUrl?: string;
  type: ProposalType;
  payload: ProposalPayload;
  status: ProposalStatus;
  snapshotBlock?: number;
  votingStartsAt?: string;
  votingEndsAt?: string;
  timelockEndsAt?: string;
  executionDeadline?: string;
  executedAt?: string;
  cancelledAt?: string;
  vetoedAt?: string;
  vetoedBy?: string;
  votesFor: string;
  votesAgainst: string;
  votesAbstain: string;
  totalVoters: number;
  quorumRequired: string;
  quorumMet: boolean;
  damlContractId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GovernanceVote {
  id: string;
  proposalId: string;
  voterId: string;
  voterAddress: string;
  direction: VoteDirection;
  weight: string;
  isDelegated: boolean;
  delegatedFrom?: string;
  damlContractId?: string;
  castAt: string;
  previousDirection?: VoteDirection;
  changedAt?: string;
}

export interface Delegation {
  id: string;
  delegatorId: string;
  delegatorAddress: string;
  delegateeId: string;
  delegateeAddress: string;
  amount: string;
  isActive: boolean;
  damlContractId?: string;
  createdAt: string;
  revokedAt?: string;
}

export interface TokenSnapshot {
  id: string;
  proposalId: string;
  userId: string;
  userAddress: string;
  balance: string;
  delegatedTo?: string;
  receivedDelegation: string;
  effectiveVotingPower: string;
  snapshotBlock: number;
  createdAt: string;
}

export interface ExecutionQueueItem {
  id: string;
  proposalId: string;
  actionType: string;
  actionPayload: Record<string, unknown>;
  timelockEndsAt: string;
  executionDeadline: string;
  status: 'PENDING' | 'EXECUTED' | 'VETOED' | 'EXPIRED' | 'FAILED';
  executedAt?: string;
  executedBy?: string;
  executionTxHash?: string;
  failureReason?: string;
  createdAt: string;
}

export interface DualTokenBalance {
  userId: string;
  userAddress: string;
  balance: string;
  totalDelegatedOut: string;
  totalDelegatedIn: string;
  effectiveVotingPower: string;
  lastSyncedAt: string;
  updatedAt: string;
}

// ─── Vote Results ────────────────────────────────────────────────────────────

export interface VoteResults {
  proposalId: string;
  status: ProposalStatus;
  votesFor: string;
  votesAgainst: string;
  votesAbstain: string;
  totalVoters: number;
  quorumRequired: string;
  quorumMet: boolean;
  votes: GovernanceVote[];
}

// ─── Legacy interfaces (backwards compat) ────────────────────────────────────

/** @deprecated Use GovernanceProposal instead */
export interface Proposal {
  proposalId: string;
  title: string;
  description: string;
  proposer: string;
  category: ProposalCategory;
  status: LegacyProposalStatus;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  quorum: string;
  quorumReached: boolean;
  startTime: string;
  endTime: string;
  actions: ProposalAction[];
}

/** @deprecated Use ProposalPayload instead */
export interface ProposalAction {
  type: string;
  params: Record<string, unknown>;
}

/** @deprecated Use GovernanceVote instead */
export interface Vote {
  voter: string;
  vote: 'for' | 'against' | 'abstain';
  weight: string;
  timestamp: string;
}
