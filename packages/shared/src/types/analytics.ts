// ---------------------------------------------------------------------------
// Analytics & Reporting Type System — MP24
// ---------------------------------------------------------------------------

// ─── Time Range ─────────────────────────────────────────────────────────────

export type AnalyticsTimeRange = '7d' | '30d' | '90d' | '1y';

export type AnalyticsMetric =
  | 'tvl'
  | 'supply_apy'
  | 'borrow_apy'
  | 'utilization';

// ─── Pool Snapshot ──────────────────────────────────────────────────────────

export interface PoolSnapshot {
  id: string;
  poolId: string;
  totalSupplyUsd: number;
  totalBorrowUsd: number;
  availableLiquidityUsd: number;
  tvlUsd: number;
  utilization: number;
  supplyApy: number;
  borrowApy: number;
  depositorCount: number;
  borrowerCount: number;
  reserveUsd: number;
  snapshotAt: string;
}

// ─── Protocol Snapshot ──────────────────────────────────────────────────────

export interface ProtocolSnapshot {
  id: string;
  totalTvlUsd: number;
  totalSupplyUsd: number;
  totalBorrowUsd: number;
  totalReserveUsd: number;
  totalUsers: number;
  activePools: number;
  avgUtilization: number;
  snapshotAt: string;
}

// ─── User Position Snapshot ─────────────────────────────────────────────────

export interface UserPositionSnapshot {
  id: string;
  userId: string;
  totalSupplyUsd: number;
  totalBorrowUsd: number;
  totalCollateralUsd: number;
  netWorthUsd: number;
  interestEarnedUsd: number;
  interestPaidUsd: number;
  netInterestUsd: number;
  healthFactor: number | null;
  netApy: number | null;
  snapshotAt: string;
}

// ─── Analytics Event ────────────────────────────────────────────────────────

export type AnalyticsEventType =
  | 'deposit'
  | 'withdraw'
  | 'borrow'
  | 'repay'
  | 'liquidation';

export interface AnalyticsEvent {
  id: string;
  eventType: AnalyticsEventType;
  userId: string | null;
  poolId: string | null;
  amount: number | null;
  amountUsd: number;
  txHash: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ─── Protocol Health ────────────────────────────────────────────────────────

export type HealthScoreRating = 'excellent' | 'good' | 'fair' | 'poor';

export interface ProtocolHealthSnapshot {
  id: string;
  healthScore: number;
  badDebtRatio: number;
  reserveCoverage: number;
  avgHealthFactor: number | null;
  hfDangerCount: number;
  hfDangerVolumeUsd: number;
  liquidationEfficiency: number | null;
  oracleUptime: number | null;
  concentrationRisk: number | null;
  details: Record<string, unknown> | null;
  snapshotAt: string;
}

export function getHealthScoreRating(score: number): HealthScoreRating {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
}

// ─── Revenue ────────────────────────────────────────────────────────────────

export type RevenueType = 'interest_spread' | 'liquidation_fee' | 'origination_fee' | 'flash_loan_fee';

export interface RevenueLogEntry {
  id: string;
  poolId: string | null;
  revenueType: RevenueType;
  amount: number;
  amountUsd: number;
  asset: string;
  txHash: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  createdAt: string;
}

// ─── Time Series ────────────────────────────────────────────────────────────

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
}

// ─── Pool Analytics ─────────────────────────────────────────────────────────

export interface PoolAnalyticsSummary {
  poolId: string;
  asset: string;
  tvlUsd: number;
  totalSupplyUsd: number;
  totalBorrowUsd: number;
  availableLiquidityUsd: number;
  utilization: number;
  supplyApy: number;
  borrowApy: number;
  depositorCount: number;
  borrowerCount: number;
  reserveUsd: number;
  tvlChange7d: number;
  tvlChange30d: number;
  avgSupplyApy7d: number;
  avgBorrowApy7d: number;
}

export interface PoolRanking {
  poolId: string;
  asset: string;
  tvlUsd: number;
  supplyApy: number;
  tvlGrowth30d: number;
  depositorCount: number;
  utilization: number;
}

// ─── User Portfolio & P&L ───────────────────────────────────────────────────

export interface SupplyPositionDetail {
  poolId: string;
  asset: string;
  amount: number;
  valueUsd: number;
  apy: number;
  interestEarned: number;
}

export interface BorrowPositionDetail {
  poolId: string;
  asset: string;
  amount: number;
  valueUsd: number;
  apy: number;
  interestPaid: number;
  healthFactor: number | null;
}

export interface UserPortfolio {
  totalSupplyUsd: number;
  totalBorrowUsd: number;
  netWorthUsd: number;
  totalInterestEarned: number;
  totalInterestPaid: number;
  netInterestUsd: number;
  unrealizedPnl: number;
  totalPnl: number;
  avgHealthFactor: number | null;
  lowestHealthFactor: number | null;
  supplyPositions: SupplyPositionDetail[];
  borrowPositions: BorrowPositionDetail[];
  portfolioValueHistory: TimeSeriesPoint[];
  pnlHistory: TimeSeriesPoint[];
}

export interface UserTransaction {
  id: string;
  type: AnalyticsEventType;
  poolId: string;
  asset: string;
  amount: number;
  amountUsd: number;
  createdAt: string;
}

export interface TaxReportEntry {
  date: string;
  type: string;
  asset: string;
  amount: number;
  usdValue: number;
  fee: number;
  runningBalance: number;
}

export interface TaxReportSummary {
  year: number;
  interestEarned: number;
  interestPaid: number;
  liquidationLosses: number;
  netIncome: number;
  entries: TaxReportEntry[];
}

// ─── Protocol Stats (Public API) ────────────────────────────────────────────

export interface ProtocolStats {
  tvlUsd: number;
  totalSupplyUsd: number;
  totalBorrowUsd: number;
  avgUtilization: number;
  totalUsers: number;
  healthScore: number;
  pools: ProtocolPoolSummary[];
}

export interface ProtocolPoolSummary {
  id: string;
  asset: string;
  tvlUsd: number;
  supplyApy: number;
  borrowApy: number;
  utilization: number;
}

// ─── Protocol Health Dashboard ──────────────────────────────────────────────

export interface ProtocolHealthDashboard {
  healthScore: number;
  rating: HealthScoreRating;
  badDebtRatio: number;
  reserveCoverage: number;
  avgHealthFactor: number;
  hfDistribution: HfDistributionBucket[];
  hfDangerCount: number;
  hfDangerVolumeUsd: number;
  liquidationEfficiency: number;
  oracleUptime: number;
  concentrationRisk: number;
}

export interface HfDistributionBucket {
  range: string;
  count: number;
  volumeUsd: number;
}

// ─── Revenue Dashboard ──────────────────────────────────────────────────────

export interface RevenueSummary {
  totalAllTime: number;
  total30d: number;
  total7d: number;
  breakdown: RevenueBreakdown[];
  byPool: RevenueByPool[];
  dailyRevenue: TimeSeriesPoint[];
  projectedMonthly: number;
}

export interface RevenueBreakdown {
  type: RevenueType;
  amount: number;
  percentage: number;
}

export interface RevenueByPool {
  poolId: string;
  asset: string;
  amount: number;
  percentage: number;
}

// ─── Admin Analytics ────────────────────────────────────────────────────────

export interface AdminAnalyticsOverview {
  tvlUsd: number;
  tvlChange7d: number;
  totalUsers: number;
  dailyActiveUsers: number;
  volume24h: number;
  revenue30d: number;
  tvlHistory: TimeSeriesPoint[];
  revenueSummary: RevenueSummary;
  protocolHealth: ProtocolHealthDashboard;
  poolComparison: PoolRanking[];
  hfDistribution: HfDistributionBucket[];
  userAnalytics: UserAnalytics;
}

export interface UserAnalytics {
  dau: number;
  wau: number;
  mau: number;
  cohortRetention: CohortRow[];
}

export interface CohortRow {
  cohort: string;
  retention: number[];
}

// ─── Export ─────────────────────────────────────────────────────────────────

export type ExportFormat = 'csv' | 'pdf';

export type ExportType =
  | 'pool_history'
  | 'user_transactions'
  | 'tax_report'
  | 'revenue';

export interface ExportRequest {
  type: ExportType;
  format: ExportFormat;
  dateRange?: {
    from: string;
    to: string;
  };
  year?: number;
  poolId?: string;
}

// ─── Institutional Reporting ────────────────────────────────────────────────

export interface InstitutionalPortfolio extends UserPortfolio {
  riskMetrics: InstitutionalRiskMetrics;
}

export interface InstitutionalRiskMetrics {
  avgHealthFactor: number | null;
  lowestHealthFactor: number | null;
  liquidationProximity: number | null;
  concentrationRisk: number;
  positions: number;
}

export interface PnlBreakdown {
  poolId: string;
  asset: string;
  interestEarned: number;
  interestPaid: number;
  netPnl: number;
  unrealizedPnl: number;
}
