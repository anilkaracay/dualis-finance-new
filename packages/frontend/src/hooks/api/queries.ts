'use client';

import { useQuery } from './useQuery';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type {
  PoolListItem,
  PoolDetail,
  PoolHistoryPoint,
  BorrowPositionItem,
  SecLendingOfferItem,
  SecLendingDealItem,
  CreditScoreResponse,
  CreditHistoryPoint,
  OraclePriceItem,
  ProposalListItem,
  StakingInfo,
  StakingPositionResponse,
  AnalyticsOverview,
} from '@dualis/shared';

export function usePoolList(filters?: { assetType?: string | undefined } | undefined) {
  const params = filters?.assetType ? `?assetType=${filters.assetType}` : '';
  return useQuery<PoolListItem[]>(`${ENDPOINTS.POOLS}${params}`);
}

export function usePoolDetail(poolId: string | null) {
  return useQuery<PoolDetail>(poolId ? ENDPOINTS.POOL_DETAIL(poolId) : null);
}

export function usePoolHistory(poolId: string | null, period?: string | undefined) {
  const params = period ? `?period=${period}` : '';
  return useQuery<PoolHistoryPoint[]>(
    poolId ? `${ENDPOINTS.POOL_HISTORY(poolId)}${params}` : null,
  );
}

export function useBorrowPositions() {
  return useQuery<BorrowPositionItem[]>(ENDPOINTS.BORROW_POSITIONS);
}

export function useSecLendingOffers(filters?: { assetType?: string | undefined } | undefined) {
  const params = filters?.assetType ? `?assetType=${filters.assetType}` : '';
  return useQuery<SecLendingOfferItem[]>(`${ENDPOINTS.SEC_LENDING_OFFERS}${params}`);
}

export function useSecLendingDeals() {
  return useQuery<SecLendingDealItem[]>(ENDPOINTS.SEC_LENDING_DEALS);
}

export function useCreditScore() {
  return useQuery<CreditScoreResponse>(ENDPOINTS.CREDIT_SCORE);
}

export function useCreditHistory(period?: string | undefined) {
  const params = period ? `?period=${period}` : '';
  return useQuery<CreditHistoryPoint[]>(`${ENDPOINTS.CREDIT_HISTORY}${params}`);
}

export function useOraclePrices() {
  return useQuery<OraclePriceItem[]>(ENDPOINTS.ORACLE_PRICES);
}

export function useGovernanceProposals(status?: string | undefined) {
  const params = status && status !== 'all' ? `?status=${status}` : '';
  return useQuery<ProposalListItem[]>(`${ENDPOINTS.GOVERNANCE_PROPOSALS}${params}`);
}

export function useStakingInfo() {
  return useQuery<StakingInfo>(ENDPOINTS.STAKING_INFO);
}

export function useStakingPosition() {
  return useQuery<StakingPositionResponse>(ENDPOINTS.STAKING_POSITION);
}

export function useAnalyticsOverview() {
  return useQuery<AnalyticsOverview>(ENDPOINTS.ANALYTICS_OVERVIEW);
}
