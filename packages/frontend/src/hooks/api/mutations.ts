'use client';

import { useMutation } from './useMutation';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type {
  DepositResponse,
  WithdrawResponse,
  BorrowResponse,
  RepayResponse,
  AddCollateralResponse,
  CreateOfferResponse,
  AcceptOfferResponse,
  RecallResponse,
  ReturnResponse,
  CastVoteResponse,
  FlashLoanResponse,
  StakingPositionResponse,
  GovernanceProposal,
  GovernanceVote,
  Delegation,
  VoteDirection,
} from '@dualis/shared';

export function useDeposit() {
  const mutation = useMutation<DepositResponse>();
  return {
    ...mutation,
    execute: (poolId: string, body: { amount: string }) =>
      mutation.execute(ENDPOINTS.POOL_DEPOSIT(poolId), body),
  };
}

export function useWithdraw() {
  const mutation = useMutation<WithdrawResponse>();
  return {
    ...mutation,
    execute: (poolId: string, body: { shares: string }) =>
      mutation.execute(ENDPOINTS.POOL_WITHDRAW(poolId), body),
  };
}

export function useBorrow() {
  const mutation = useMutation<BorrowResponse>();
  return {
    ...mutation,
    execute: (body: {
      lendingPoolId: string;
      borrowAmount: string;
      collateralAssets: Array<{ symbol: string; amount: string }>;
    }) => mutation.execute(ENDPOINTS.BORROW_REQUEST, body as unknown as Record<string, unknown>),
  };
}

export function useRepay() {
  const mutation = useMutation<RepayResponse>();
  return {
    ...mutation,
    execute: (positionId: string, body: { amount: string }) =>
      mutation.execute(ENDPOINTS.BORROW_REPAY(positionId), body),
  };
}

export function useAddCollateral() {
  const mutation = useMutation<AddCollateralResponse>();
  return {
    ...mutation,
    execute: (positionId: string, body: { asset: { symbol: string; amount: string } }) =>
      mutation.execute(
        ENDPOINTS.BORROW_ADD_COLLATERAL(positionId),
        body as unknown as Record<string, unknown>,
      ),
  };
}

export function useCreateOffer() {
  const mutation = useMutation<CreateOfferResponse>();
  return {
    ...mutation,
    execute: (body: {
      security: { symbol: string; amount: string };
      feeType: 'fixed' | 'floating' | 'negotiated';
      feeValue: number;
      acceptedCollateralTypes: string[];
      initialMarginPercent: number;
      minLendDuration: number;
      maxLendDuration?: number | undefined;
      isRecallable: boolean;
      recallNoticeDays: number;
    }) => mutation.execute(ENDPOINTS.SEC_LENDING_OFFERS, body as unknown as Record<string, unknown>),
  };
}

export function useAcceptOffer() {
  const mutation = useMutation<AcceptOfferResponse>();
  return {
    ...mutation,
    execute: (
      offerId: string,
      body: {
        collateral: Array<{ symbol: string; amount: string }>;
        requestedDuration: number;
      },
    ) =>
      mutation.execute(
        ENDPOINTS.SEC_LENDING_ACCEPT(offerId),
        body as unknown as Record<string, unknown>,
      ),
  };
}

export function useRecallDeal() {
  const mutation = useMutation<RecallResponse>();
  return {
    ...mutation,
    execute: (dealId: string) => mutation.execute(ENDPOINTS.SEC_LENDING_RECALL(dealId)),
  };
}

export function useReturnDeal() {
  const mutation = useMutation<ReturnResponse>();
  return {
    ...mutation,
    execute: (dealId: string) => mutation.execute(ENDPOINTS.SEC_LENDING_RETURN(dealId)),
  };
}

export function useVote() {
  const mutation = useMutation<CastVoteResponse>();
  return {
    ...mutation,
    execute: (proposalId: string, body: { vote: 'for' | 'against' | 'abstain'; weight: string }) =>
      mutation.execute(ENDPOINTS.GOVERNANCE_VOTE(proposalId), body),
  };
}

export function useCastVote() {
  const mutation = useMutation<GovernanceVote>();
  return {
    ...mutation,
    execute: (proposalId: string, body: { direction: VoteDirection }) =>
      mutation.execute(ENDPOINTS.GOVERNANCE_VOTE(proposalId), body),
  };
}

export function useCreateProposal() {
  const mutation = useMutation<GovernanceProposal>();
  return {
    ...mutation,
    execute: (body: {
      title: string;
      description: string;
      type: string;
      payload: { type: string; data: Record<string, unknown> };
      discussionUrl?: string;
    }) => mutation.execute(ENDPOINTS.GOVERNANCE_PROPOSALS, body as unknown as Record<string, unknown>),
  };
}

export function useCancelProposal() {
  const mutation = useMutation<GovernanceProposal>();
  return {
    ...mutation,
    execute: (proposalId: string) =>
      mutation.execute(ENDPOINTS.GOVERNANCE_PROPOSAL_CANCEL(proposalId)),
  };
}

export function useExecuteProposal() {
  const mutation = useMutation<GovernanceProposal>();
  return {
    ...mutation,
    execute: (proposalId: string) =>
      mutation.execute(ENDPOINTS.GOVERNANCE_EXECUTE(proposalId)),
  };
}

export function useDelegate() {
  const mutation = useMutation<Delegation>();
  return {
    ...mutation,
    execute: (body: { delegateeId: string; delegateeAddress: string }) =>
      mutation.execute(ENDPOINTS.GOVERNANCE_DELEGATE, body),
  };
}

export function useUndelegate() {
  const mutation = useMutation<{ success: boolean }>();
  return {
    ...mutation,
    execute: () => mutation.execute(ENDPOINTS.GOVERNANCE_UNDELEGATE),
  };
}

export function useExecuteFlashLoan() {
  const mutation = useMutation<FlashLoanResponse>();
  return {
    ...mutation,
    execute: (body: {
      poolId: string;
      amount: string;
      callbackData: { operations: Array<{ type: string; [key: string]: unknown }> };
    }) =>
      mutation.execute(ENDPOINTS.FLASH_LOAN_EXECUTE, body as unknown as Record<string, unknown>),
  };
}

export function useStake() {
  const mutation = useMutation<StakingPositionResponse>();
  return {
    ...mutation,
    execute: (body: { amount: string; safetyModule: boolean }) =>
      mutation.execute(ENDPOINTS.STAKING_STAKE, body as unknown as Record<string, unknown>),
  };
}

export function useUnstake() {
  const mutation = useMutation<StakingPositionResponse>();
  return {
    ...mutation,
    execute: (body: { amount: string }) => mutation.execute(ENDPOINTS.STAKING_UNSTAKE, body),
  };
}

export function useClaimRewards() {
  const mutation = useMutation<StakingPositionResponse>();
  return {
    ...mutation,
    execute: () => mutation.execute(ENDPOINTS.STAKING_CLAIM),
  };
}
