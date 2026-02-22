/** Governance proposal status */
export type ProposalStatus =
  | 'active'
  | 'passed'
  | 'rejected'
  | 'executed'
  | 'cancelled';

/** Governance proposal category */
export type ProposalCategory =
  | 'parameter_change'
  | 'asset_listing'
  | 'protocol_upgrade'
  | 'treasury_allocation'
  | 'emergency';

/** Vote direction */
export type VoteDirection = 'for' | 'against' | 'abstain';

/** Governance proposal */
export interface Proposal {
  /** Proposal identifier (e.g., "DIP-001") */
  proposalId: string;
  /** Proposal title */
  title: string;
  /** Full proposal description */
  description: string;
  /** Proposer party */
  proposer: string;
  /** Proposal category */
  category: ProposalCategory;
  /** Current status */
  status: ProposalStatus;
  /** Total votes in favor (Decimal as string) */
  forVotes: string;
  /** Total votes against (Decimal as string) */
  againstVotes: string;
  /** Total abstain votes (Decimal as string) */
  abstainVotes: string;
  /** Required quorum (Decimal as string) */
  quorum: string;
  /** Whether quorum has been reached */
  quorumReached: boolean;
  /** Voting start timestamp (ISO 8601) */
  startTime: string;
  /** Voting end timestamp (ISO 8601) */
  endTime: string;
  /** Proposed actions */
  actions: ProposalAction[];
}

/** Action to execute if proposal passes */
export interface ProposalAction {
  /** Action type */
  type: string;
  /** Action parameters */
  params: Record<string, unknown>;
}

/** Individual vote record */
export interface Vote {
  /** Voter party */
  voter: string;
  /** Vote direction */
  vote: VoteDirection;
  /** Voting weight (Decimal as string) */
  weight: string;
  /** Vote timestamp (ISO 8601) */
  timestamp: string;
}
