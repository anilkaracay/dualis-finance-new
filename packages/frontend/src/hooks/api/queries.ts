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
  GovernanceProposal,
  GovernanceVote,
  GovernanceConfigData,
  VoteResults,
  DualTokenBalance,
  Delegation,
  StakingInfo,
  StakingPositionResponse,
  AnalyticsOverview,
  ProtocolStats,
  PoolAnalyticsSummary,
  TimeSeriesPoint,
  UserPortfolio,
  UserTransaction,
  TaxReportSummary,
  PnlBreakdown,
  InstitutionalRiskMetrics,
  AdminAnalyticsOverview,
  ProtocolHealthDashboard,
  RevenueSummary,
  PoolRanking,
  UserAnalytics,
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
  return useQuery<GovernanceProposal[]>(`${ENDPOINTS.GOVERNANCE_PROPOSALS}${params}`);
}

export function useProposalDetail(proposalId: string | null) {
  return useQuery<GovernanceProposal>(
    proposalId ? ENDPOINTS.GOVERNANCE_PROPOSAL_DETAIL(proposalId) : null,
  );
}

export function useProposalVotes(proposalId: string | null) {
  return useQuery<VoteResults>(
    proposalId ? ENDPOINTS.GOVERNANCE_VOTES(proposalId) : null,
  );
}

export function useMyVote(proposalId: string | null) {
  return useQuery<GovernanceVote | null>(
    proposalId ? ENDPOINTS.GOVERNANCE_MY_VOTE(proposalId) : null,
  );
}

export function useGovernanceConfig() {
  return useQuery<GovernanceConfigData>(ENDPOINTS.GOVERNANCE_CONFIG);
}

export function useVotingPower() {
  return useQuery<DualTokenBalance>(ENDPOINTS.GOVERNANCE_VOTING_POWER);
}

export function useDelegations() {
  return useQuery<Delegation[]>(ENDPOINTS.GOVERNANCE_DELEGATIONS);
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

// ---------------------------------------------------------------------------
// Analytics & Reporting (MP24)
// ---------------------------------------------------------------------------

export function useProtocolStats() {
  return useQuery<ProtocolStats>(ENDPOINTS.ANALYTICS_PROTOCOL_STATS);
}

export function useProtocolTvl(range?: string) {
  const params = range ? `?range=${range}` : '';
  return useQuery<{ current: number; history: TimeSeriesPoint[] }>(`${ENDPOINTS.ANALYTICS_PROTOCOL_TVL}${params}`);
}

export function useAnalyticsPools() {
  return useQuery<PoolAnalyticsSummary[]>(ENDPOINTS.ANALYTICS_POOLS);
}

export function useAnalyticsPoolHistory(poolId: string | null, metric?: string, range?: string) {
  const params = new URLSearchParams();
  if (metric) params.set('metric', metric);
  if (range) params.set('range', range);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return useQuery<TimeSeriesPoint[]>(poolId ? `${ENDPOINTS.ANALYTICS_POOL_HISTORY(poolId)}${qs}` : null);
}

export function useAnalyticsPoolRates(poolId: string | null, range?: string) {
  const params = range ? `?range=${range}` : '';
  return useQuery<{ supplyApy: TimeSeriesPoint[]; borrowApy: TimeSeriesPoint[] }>(
    poolId ? `${ENDPOINTS.ANALYTICS_POOL_RATES(poolId)}${params}` : null,
  );
}

// Portfolio & P&L
export function useUserPortfolio(range?: string) {
  const params = range ? `?range=${range}` : '';
  return useQuery<UserPortfolio>(`${ENDPOINTS.INSTITUTIONAL_PORTFOLIO}${params}`);
}

export function useUserTransactions(limit?: number, offset?: number) {
  const params = new URLSearchParams();
  if (limit) params.set('limit', String(limit));
  if (offset) params.set('offset', String(offset));
  const qs = params.toString() ? `?${params.toString()}` : '';
  return useQuery<UserTransaction[]>(`${ENDPOINTS.INSTITUTIONAL_TRANSACTIONS}${qs}`);
}

export function usePnlBreakdown() {
  return useQuery<PnlBreakdown[]>(ENDPOINTS.INSTITUTIONAL_PNL_BREAKDOWN);
}

export function useTaxReport(year?: number) {
  const params = year ? `?year=${year}` : '';
  return useQuery<TaxReportSummary>(`${ENDPOINTS.INSTITUTIONAL_TAX_REPORT}${params}`);
}

export function useInstitutionalRisk() {
  return useQuery<InstitutionalRiskMetrics>(ENDPOINTS.INSTITUTIONAL_RISK);
}

// Admin Analytics
export function useAdminAnalyticsOverview() {
  return useQuery<AdminAnalyticsOverview>(ENDPOINTS.ADMIN_ANALYTICS_OVERVIEW);
}

export function useAdminProtocolHealth() {
  return useQuery<ProtocolHealthDashboard>(ENDPOINTS.ADMIN_ANALYTICS_HEALTH);
}

export function useAdminHealthHistory(range?: string) {
  const params = range ? `?range=${range}` : '';
  return useQuery<TimeSeriesPoint[]>(`${ENDPOINTS.ADMIN_ANALYTICS_HEALTH_HISTORY}${params}`);
}

export function useAdminRevenue() {
  return useQuery<RevenueSummary>(ENDPOINTS.ADMIN_ANALYTICS_REVENUE);
}

export function useAdminPoolRankings(sortBy?: string) {
  const params = sortBy ? `?sortBy=${sortBy}` : '';
  return useQuery<PoolRanking[]>(`${ENDPOINTS.ADMIN_ANALYTICS_POOLS}${params}`);
}

export function useAdminUserAnalytics() {
  return useQuery<UserAnalytics>(ENDPOINTS.ADMIN_ANALYTICS_USERS);
}
