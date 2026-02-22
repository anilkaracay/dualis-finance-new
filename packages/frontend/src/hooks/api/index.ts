// Query hooks
export {
  usePoolList,
  usePoolDetail,
  usePoolHistory,
  useBorrowPositions,
  useSecLendingOffers,
  useSecLendingDeals,
  useCreditScore,
  useCreditHistory,
  useOraclePrices,
  useGovernanceProposals,
  useStakingInfo,
  useStakingPosition,
  useAnalyticsOverview,
} from './queries';

// Mutation hooks
export {
  useDeposit,
  useWithdraw,
  useBorrow,
  useRepay,
  useAddCollateral,
  useCreateOffer,
  useAcceptOffer,
  useRecallDeal,
  useReturnDeal,
  useVote,
  useExecuteFlashLoan,
  useStake,
  useUnstake,
  useClaimRewards,
} from './mutations';

// Generic hooks (for custom queries/mutations)
export { useQuery } from './useQuery';
export { useMutation } from './useMutation';
