/** DUAL token staking position */
export interface StakingPosition {
  /** Staker party */
  staker: string;
  /** Amount staked (Decimal as string) */
  stakedAmount: string;
  /** Amount staked in safety module (Decimal as string) */
  safetyModuleStake: string;
  /** Pending rewards (Decimal as string) */
  pendingRewards: string;
  /** Staking start timestamp (ISO 8601) */
  stakingSince: string;
  /** Cooldown end timestamp, null if no active cooldown (ISO 8601) */
  cooldownEnd: string | null;
  /** Current voting power (Decimal as string) */
  votingPower: string;
}

/** DUAL token parameters */
export interface DualToken {
  /** Token name */
  name: string;
  /** Token symbol */
  symbol: string;
  /** Token standard */
  standard: string;
  /** Total supply (Decimal as string) */
  totalSupply: string;
}

/** Token allocation entry */
export interface TokenAllocation {
  /** Allocation category */
  category: string;
  /** Percentage of total supply */
  percent: number;
  /** Token amount (Decimal as string) */
  amount: string;
  /** Vesting description */
  vesting: string;
}
