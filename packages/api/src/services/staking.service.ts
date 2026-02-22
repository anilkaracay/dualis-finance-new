import { createChildLogger } from '../config/logger.js';
import type {
  StakeRequest,
  UnstakeRequest,
  StakingInfo,
  StakingPositionResponse,
  TransactionMeta,
} from '@dualis/shared';
import { randomUUID } from 'node:crypto';

const log = createChildLogger('staking-service');

function buildTransactionMeta(): TransactionMeta {
  return {
    id: `tx-${randomUUID()}`,
    status: 'confirmed',
    timestamp: new Date().toISOString(),
  };
}

const MOCK_STAKING_INFO: StakingInfo = {
  totalStaked: 45_800_000,
  stakingAPY: 0.0625,
  safetyModuleSize: 12_400_000,
  safetyModuleAPY: 0.085,
  rewardsDistributed24h: 78_562,
  totalStakers: 4_231,
};

const MOCK_POSITION: StakingPositionResponse = {
  stakedAmount: 125_000,
  safetyModuleStake: 25_000,
  pendingRewards: 342.56,
  claimableRewards: 1_204.89,
  stakingSince: '2025-08-15T10:00:00.000Z',
  cooldownEnd: null,
  votingPower: 137_500,
};

export function getInfo(): StakingInfo {
  log.debug('Getting staking info');
  return MOCK_STAKING_INFO;
}

export function getPosition(partyId: string): StakingPositionResponse {
  log.debug({ partyId }, 'Getting staking position');
  return MOCK_POSITION;
}

export function stake(
  partyId: string,
  params: StakeRequest
): { data: StakingPositionResponse; transaction: TransactionMeta } {
  log.info({ partyId, amount: params.amount, safetyModule: params.safetyModule }, 'Staking');

  const amount = parseFloat(params.amount);
  const newStaked = MOCK_POSITION.stakedAmount + (params.safetyModule ? 0 : amount);
  const newSafetyModule = MOCK_POSITION.safetyModuleStake + (params.safetyModule ? amount : 0);

  return {
    data: {
      stakedAmount: newStaked,
      safetyModuleStake: newSafetyModule,
      pendingRewards: MOCK_POSITION.pendingRewards,
      claimableRewards: MOCK_POSITION.claimableRewards,
      stakingSince: MOCK_POSITION.stakingSince,
      cooldownEnd: null,
      votingPower: newStaked + newSafetyModule * 1.1,
    },
    transaction: buildTransactionMeta(),
  };
}

export function unstake(
  partyId: string,
  params: UnstakeRequest
): { data: StakingPositionResponse; transaction: TransactionMeta } {
  log.info({ partyId, amount: params.amount }, 'Unstaking');

  const amount = parseFloat(params.amount);
  const newStaked = Math.max(0, MOCK_POSITION.stakedAmount - amount);
  const cooldownEnd = new Date(Date.now() + 10 * 86_400_000).toISOString();

  return {
    data: {
      stakedAmount: newStaked,
      safetyModuleStake: MOCK_POSITION.safetyModuleStake,
      pendingRewards: MOCK_POSITION.pendingRewards,
      claimableRewards: MOCK_POSITION.claimableRewards,
      stakingSince: MOCK_POSITION.stakingSince,
      cooldownEnd,
      votingPower: newStaked + MOCK_POSITION.safetyModuleStake * 1.1,
    },
    transaction: buildTransactionMeta(),
  };
}

export function claim(
  partyId: string
): { data: { claimedAmount: number }; transaction: TransactionMeta } {
  log.info({ partyId }, 'Claiming staking rewards');

  return {
    data: {
      claimedAmount: MOCK_POSITION.claimableRewards,
    },
    transaction: buildTransactionMeta(),
  };
}
