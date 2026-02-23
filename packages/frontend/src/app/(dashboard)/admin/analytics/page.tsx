'use client';

import { useState, useMemo } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils/cn';
import { KPICard } from '@/components/data-display/KPICard';
import { AreaChart, type TimeRange } from '@/components/charts/AreaChart';
import { HistogramChart, type HistogramBar } from '@/components/charts/HistogramChart';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import {
  useAdminAnalyticsOverview,
  useAdminProtocolHealth,
  useAdminRevenue,
  useAdminPoolRankings,
  useAdminUserAnalytics,
} from '@/hooks/api';
import { getAssetColor } from '@/stores/useAnalyticsStore';
import {
  CheckCircle2,
  AlertTriangle,
  Shield,
  Users,
  DollarSign,
  Activity,
} from 'lucide-react';
import type {
  AdminAnalyticsOverview,
  ProtocolHealthDashboard,
  RevenueSummary,
  PoolRanking,
  UserAnalytics,
  HfDistributionBucket,
  TimeSeriesPoint,
  CohortRow,
} from '@dualis/shared';

// ---------------------------------------------------------------------------
// Format Helpers
// ---------------------------------------------------------------------------

function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

// ---------------------------------------------------------------------------
// Mock / Fallback Data
// ---------------------------------------------------------------------------

const MOCK_TVL_HISTORY: TimeSeriesPoint[] = Array.from({ length: 90 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (89 - i));
  const base = 245_000_000;
  const noise = Math.sin(i * 0.15) * 12_000_000 + Math.cos(i * 0.07) * 8_000_000;
  const trend = i * 350_000;
  return {
    timestamp: date.toISOString().slice(0, 10),
    value: base + trend + noise,
  };
});

const MOCK_DAILY_REVENUE: TimeSeriesPoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    timestamp: date.toISOString().slice(0, 10),
    value: 18_000 + Math.random() * 14_000,
  };
});

const MOCK_POOL_RANKINGS: PoolRanking[] = [
  { poolId: 'pool-usdc', asset: 'USDC', tvlUsd: 98_500_000, supplyApy: 0.0425, tvlGrowth30d: 0.082, depositorCount: 1842, utilization: 0.72 },
  { poolId: 'pool-eth', asset: 'ETH', tvlUsd: 87_200_000, supplyApy: 0.0312, tvlGrowth30d: 0.045, depositorCount: 2156, utilization: 0.65 },
  { poolId: 'pool-wbtc', asset: 'WBTC', tvlUsd: 54_300_000, supplyApy: 0.0278, tvlGrowth30d: 0.031, depositorCount: 987, utilization: 0.58 },
  { poolId: 'pool-tbill', asset: 'T-BILL', tvlUsd: 32_100_000, supplyApy: 0.0495, tvlGrowth30d: 0.156, depositorCount: 456, utilization: 0.81 },
  { poolId: 'pool-dai', asset: 'DAI', tvlUsd: 21_800_000, supplyApy: 0.0389, tvlGrowth30d: -0.012, depositorCount: 634, utilization: 0.69 },
  { poolId: 'pool-usdt', asset: 'USDT', tvlUsd: 18_400_000, supplyApy: 0.0401, tvlGrowth30d: 0.023, depositorCount: 523, utilization: 0.74 },
];

const MOCK_HF_DISTRIBUTION: HfDistributionBucket[] = [
  { range: '<1.0', count: 12, volumeUsd: 1_200_000 },
  { range: '1.0-1.2', count: 45, volumeUsd: 5_800_000 },
  { range: '1.2-1.5', count: 134, volumeUsd: 18_400_000 },
  { range: '1.5-2.0', count: 287, volumeUsd: 42_600_000 },
  { range: '2.0-3.0', count: 456, volumeUsd: 68_200_000 },
  { range: '3.0-5.0', count: 321, volumeUsd: 51_400_000 },
  { range: '>5.0', count: 198, volumeUsd: 34_100_000 },
];

const MOCK_PROTOCOL_HEALTH: ProtocolHealthDashboard = {
  healthScore: 87,
  rating: 'good',
  badDebtRatio: 0.0012,
  reserveCoverage: 0.148,
  avgHealthFactor: 2.34,
  hfDistribution: MOCK_HF_DISTRIBUTION,
  hfDangerCount: 57,
  hfDangerVolumeUsd: 7_000_000,
  liquidationEfficiency: 0.964,
  oracleUptime: 0.9998,
  concentrationRisk: 0.312,
};

const MOCK_REVENUE_SUMMARY: RevenueSummary = {
  totalAllTime: 2_840_000,
  total30d: 685_000,
  total7d: 168_000,
  breakdown: [
    { type: 'interest_spread', amount: 512_000, percentage: 0.748 },
    { type: 'liquidation_fee', amount: 98_000, percentage: 0.143 },
    { type: 'origination_fee', amount: 52_000, percentage: 0.076 },
    { type: 'flash_loan_fee', amount: 23_000, percentage: 0.034 },
  ],
  byPool: [
    { poolId: 'pool-usdc', asset: 'USDC', amount: 285_000, percentage: 0.416 },
    { poolId: 'pool-eth', asset: 'ETH', amount: 198_000, percentage: 0.289 },
    { poolId: 'pool-wbtc', asset: 'WBTC', amount: 112_000, percentage: 0.163 },
    { poolId: 'pool-tbill', asset: 'T-BILL', amount: 90_000, percentage: 0.131 },
  ],
  dailyRevenue: MOCK_DAILY_REVENUE,
  projectedMonthly: 728_000,
};

const MOCK_USER_ANALYTICS: UserAnalytics = {
  dau: 1_247,
  wau: 4_832,
  mau: 12_456,
  cohortRetention: [
    { cohort: '2025-09', retention: [100, 68, 52, 41] },
    { cohort: '2025-10', retention: [100, 72, 56, 44] },
    { cohort: '2025-11', retention: [100, 75, 58, 0] },
    { cohort: '2025-12', retention: [100, 71, 0, 0] },
    { cohort: '2026-01', retention: [100, 0, 0, 0] },
  ],
};

const MOCK_OVERVIEW: AdminAnalyticsOverview = {
  tvlUsd: 312_300_000,
  tvlChange7d: 0.034,
  totalUsers: 12_456,
  dailyActiveUsers: 1_247,
  volume24h: 28_400_000,
  revenue30d: 685_000,
  tvlHistory: MOCK_TVL_HISTORY,
  revenueSummary: MOCK_REVENUE_SUMMARY,
  protocolHealth: MOCK_PROTOCOL_HEALTH,
  poolComparison: MOCK_POOL_RANKINGS,
  hfDistribution: MOCK_HF_DISTRIBUTION,
  userAnalytics: MOCK_USER_ANALYTICS,
};

// ---------------------------------------------------------------------------
// Revenue bar chart data builder (daily, stacked by type)
// ---------------------------------------------------------------------------

interface RevenueBarDataPoint {
  date: string;
  interest_spread: number;
  liquidation_fee: number;
  origination_fee: number;
  flash_loan_fee: number;
}

function buildRevenueBarData(dailyRevenue: TimeSeriesPoint[]): RevenueBarDataPoint[] {
  return dailyRevenue.map((pt) => {
    const total = pt.value;
    return {
      date: pt.timestamp.slice(5), // MM-DD
      interest_spread: Math.round(total * 0.748),
      liquidation_fee: Math.round(total * 0.143),
      origination_fee: Math.round(total * 0.076),
      flash_loan_fee: Math.round(total * 0.034),
    };
  });
}

const REVENUE_TYPE_COLORS: Record<string, string> = {
  interest_spread: '#10B981',
  liquidation_fee: '#F59E0B',
  origination_fee: '#3B82F6',
  flash_loan_fee: '#8B5CF6',
};

const REVENUE_TYPE_LABELS: Record<string, string> = {
  interest_spread: 'Interest Spread',
  liquidation_fee: 'Liquidation Fee',
  origination_fee: 'Origination Fee',
  flash_loan_fee: 'Flash Loan Fee',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Health score gauge arc rendered as SVG */
function HealthScoreGauge({ score }: { score: number }) {
  const radius = 58;
  const strokeWidth = 10;
  const circumference = Math.PI * radius; // half circle
  const progress = (score / 100) * circumference;

  const color =
    score >= 90
      ? '#10B981'
      : score >= 70
        ? '#3B82F6'
        : score >= 50
          ? '#F59E0B'
          : '#EF4444';

  return (
    <div className="flex flex-col items-center">
      <svg width={140} height={80} viewBox="0 0 140 80">
        {/* Background arc */}
        <path
          d="M 10 70 A 58 58 0 0 1 130 70"
          fill="none"
          stroke="var(--chart-grid, #374151)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Foreground arc */}
        <path
          d="M 10 70 A 58 58 0 0 1 130 70"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          className="transition-all duration-700"
        />
      </svg>
      <span className="text-3xl font-mono font-bold text-text-primary -mt-6">{score}</span>
      <span className="text-xs text-text-tertiary mt-1">/ 100</span>
    </div>
  );
}

/** Status indicator row used in Protocol Health card */
function StatusRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: 'ok' | 'warning' | 'danger';
}) {
  const Icon = status === 'ok' ? CheckCircle2 : AlertTriangle;
  const iconColor =
    status === 'ok'
      ? 'text-emerald-400'
      : status === 'warning'
        ? 'text-amber-400'
        : 'text-red-400';

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4', iconColor)} />
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <span className="text-sm font-mono font-medium text-text-primary">{value}</span>
    </div>
  );
}

/** Protocol Health Card */
function ProtocolHealthCard({ health }: { health: ProtocolHealthDashboard }) {
  const badDebtStatus =
    health.badDebtRatio < 0.005 ? 'ok' : health.badDebtRatio < 0.02 ? 'warning' : 'danger';
  const reserveStatus =
    health.reserveCoverage >= 0.1 ? 'ok' : health.reserveCoverage >= 0.05 ? 'warning' : 'danger';
  const liquidationStatus =
    (health.liquidationEfficiency ?? 0) >= 0.95
      ? 'ok'
      : (health.liquidationEfficiency ?? 0) >= 0.85
        ? 'warning'
        : 'danger';
  const oracleStatus =
    (health.oracleUptime ?? 0) >= 0.999
      ? 'ok'
      : (health.oracleUptime ?? 0) >= 0.99
        ? 'warning'
        : 'danger';

  return (
    <div className="rounded-md border border-border-default bg-bg-tertiary p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-accent-teal" />
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
          Protocol Health
        </h3>
      </div>

      <HealthScoreGauge score={health.healthScore} />

      <div className="mt-4 divide-y divide-border-default">
        <StatusRow
          label="Bad Debt Ratio"
          value={formatPercent(health.badDebtRatio)}
          status={badDebtStatus}
        />
        <StatusRow
          label="Reserve Coverage"
          value={formatPercent(health.reserveCoverage)}
          status={reserveStatus}
        />
        <StatusRow
          label="Avg Health Factor"
          value={health.avgHealthFactor.toFixed(2)}
          status={health.avgHealthFactor >= 1.5 ? 'ok' : 'warning'}
        />
        <StatusRow
          label="Liquidation Efficiency"
          value={formatPercent(health.liquidationEfficiency ?? 0)}
          status={liquidationStatus}
        />
        <StatusRow
          label="Oracle Uptime"
          value={formatPercent(health.oracleUptime ?? 0, 2)}
          status={oracleStatus}
        />
        <StatusRow
          label="Top-10 Concentration"
          value={formatPercent(health.concentrationRisk ?? 0)}
          status={(health.concentrationRisk ?? 0) < 0.4 ? 'ok' : 'warning'}
        />
      </div>

      <div className="mt-4 rounded-md bg-bg-secondary p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-tertiary">At-risk positions</span>
          <span className="font-mono text-amber-400">
            {health.hfDangerCount} ({formatCompact(health.hfDangerVolumeUsd)})
          </span>
        </div>
      </div>
    </div>
  );
}

/** Revenue stacked bar chart */
function RevenueBarChart({
  data,
  height = 320,
}: {
  data: RevenueBarDataPoint[];
  height?: number;
}) {
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--chart-axis-text)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--chart-axis-line)' }}
            tickLine={false}
            interval={4}
          />
          <YAxis
            tick={{ fill: 'var(--chart-axis-text)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
            width={55}
          />
          <Tooltip
            content={
              <ChartTooltip
                formatter={(value: number, name: string) =>
                  `${formatUSD(value)} (${REVENUE_TYPE_LABELS[name] ?? name})`
                }
              />
            }
          />
          <Legend
            formatter={(value: string) => REVENUE_TYPE_LABELS[value] ?? value}
            wrapperStyle={{ fontSize: 11 }}
          />
          <Bar dataKey="interest_spread" stackId="rev" fill={REVENUE_TYPE_COLORS.interest_spread} radius={[0, 0, 0, 0]} />
          <Bar dataKey="liquidation_fee" stackId="rev" fill={REVENUE_TYPE_COLORS.liquidation_fee} />
          <Bar dataKey="origination_fee" stackId="rev" fill={REVENUE_TYPE_COLORS.origination_fee} />
          <Bar dataKey="flash_loan_fee" stackId="rev" fill={REVENUE_TYPE_COLORS.flash_loan_fee} radius={[3, 3, 0, 0]} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Pool Comparison Table */
function PoolComparisonTable({ pools }: { pools: PoolRanking[] }) {
  const sorted = useMemo(
    () => [...pools].sort((a, b) => b.tvlUsd - a.tvlUsd),
    [pools],
  );

  return (
    <div className="overflow-x-auto rounded-md border border-border-default bg-bg-tertiary">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default">
            <th className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary px-4 h-10 text-left">
              #
            </th>
            <th className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary px-4 h-10 text-left">
              Pool / Asset
            </th>
            <th className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary px-4 h-10 text-right">
              TVL
            </th>
            <th className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary px-4 h-10 text-right">
              Supply APY
            </th>
            <th className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary px-4 h-10 text-right">
              Utilization
            </th>
            <th className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary px-4 h-10 text-right">
              30d Growth
            </th>
            <th className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary px-4 h-10 text-right">
              Depositors
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((pool, idx) => {
            const growthPositive = pool.tvlGrowth30d >= 0;
            return (
              <tr
                key={pool.poolId}
                className="border-b border-border-default last:border-b-0 h-14 hover:bg-bg-hover/50 transition-colors"
              >
                <td className="px-4 text-text-tertiary font-mono">{idx + 1}</td>
                <td className="px-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: getAssetColor(pool.asset) }}
                    />
                    <span className="font-medium text-text-primary">{pool.asset}</span>
                  </div>
                </td>
                <td className="px-4 text-right font-mono text-text-primary">
                  {formatCompact(pool.tvlUsd)}
                </td>
                <td className="px-4 text-right font-mono text-emerald-400">
                  {formatPercent(pool.supplyApy)}
                </td>
                <td className="px-4 text-right font-mono text-text-secondary">
                  {formatPercent(pool.utilization)}
                </td>
                <td
                  className={cn(
                    'px-4 text-right font-mono',
                    growthPositive ? 'text-emerald-400' : 'text-red-400',
                  )}
                >
                  {growthPositive ? '+' : ''}
                  {formatPercent(pool.tvlGrowth30d)}
                </td>
                <td className="px-4 text-right font-mono text-text-secondary">
                  {formatNumber(pool.depositorCount)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Cohort retention table */
function CohortRetentionTable({ cohorts }: { cohorts: CohortRow[] }) {
  const maxMonths = Math.max(...cohorts.map((c) => c.retention.length));
  const headers = Array.from({ length: maxMonths }, (_, i) => (i === 0 ? 'M0' : `M${i}`));

  function retentionColor(value: number): string {
    if (value === 0) return '';
    if (value >= 70) return 'bg-emerald-500/20 text-emerald-400';
    if (value >= 40) return 'bg-amber-500/20 text-amber-400';
    return 'bg-red-500/20 text-red-400';
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border-default bg-bg-tertiary">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default">
            <th className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary px-4 h-10 text-left">
              Cohort
            </th>
            {headers.map((h) => (
              <th
                key={h}
                className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary px-4 h-10 text-center"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((row) => (
            <tr
              key={row.cohort}
              className="border-b border-border-default last:border-b-0 h-12"
            >
              <td className="px-4 font-mono text-text-secondary text-xs">{row.cohort}</td>
              {headers.map((_, colIdx) => {
                const val = row.retention[colIdx];
                const hasValue = val !== undefined && val > 0;
                return (
                  <td key={colIdx} className="px-4 text-center">
                    {hasValue ? (
                      <span
                        className={cn(
                          'inline-block rounded px-2 py-0.5 font-mono text-xs font-medium',
                          retentionColor(val),
                        )}
                      >
                        {val}%
                      </span>
                    ) : (
                      <span className="text-text-tertiary">--</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** DAU / WAU / MAU metrics row */
function UserEngagementRow({ analytics }: { analytics: UserAnalytics }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <KPICard
        label="Daily Active Users"
        value={analytics.dau}
        decimals={0}
        trend="up"
        trendValue="+5.2%"
        trendContext="vs last week"
        size="sm"
      />
      <KPICard
        label="Weekly Active Users"
        value={analytics.wau}
        decimals={0}
        trend="up"
        trendValue="+3.8%"
        trendContext="vs last week"
        size="sm"
      />
      <KPICard
        label="Monthly Active Users"
        value={analytics.mau}
        decimals={0}
        trend="up"
        trendValue="+12.4%"
        trendContext="vs last month"
        size="sm"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function AdminAnalyticsPage() {
  // -- API hooks (gracefully fallback to mock data) --------------------------
  const { data: overviewData, isLoading: overviewLoading } = useAdminAnalyticsOverview();
  const { data: healthData } = useAdminProtocolHealth();
  const { data: revenueData } = useAdminRevenue();
  const { data: poolsData } = useAdminPoolRankings();
  const { data: userAnalyticsData } = useAdminUserAnalytics();

  // -- Merge API data with fallback mock data --------------------------------
  const overview: AdminAnalyticsOverview = overviewData ?? MOCK_OVERVIEW;
  const protocolHealth: ProtocolHealthDashboard = healthData ?? overview.protocolHealth;
  const revenue: RevenueSummary = revenueData ?? overview.revenueSummary;
  const pools: PoolRanking[] = poolsData ?? overview.poolComparison;
  const userAnalytics: UserAnalytics = userAnalyticsData ?? overview.userAnalytics;

  // -- Local state for TVL chart time range ----------------------------------
  const [tvlTimeRange, setTvlTimeRange] = useState<TimeRange>('30d');

  // -- Prepare TVL chart data ------------------------------------------------
  const tvlChartData = useMemo(() => {
    const history = overview.tvlHistory;
    const rangeMap: Record<TimeRange, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
      ALL: history.length,
    };
    const count = rangeMap[tvlTimeRange] ?? history.length;
    return history.slice(-count).map((pt) => ({
      date: pt.timestamp.length > 10 ? pt.timestamp.slice(5, 10) : pt.timestamp.slice(5),
      tvl: pt.value,
    }));
  }, [overview.tvlHistory, tvlTimeRange]);

  // -- Prepare revenue bar data ----------------------------------------------
  const revenueBarData = useMemo(
    () => buildRevenueBarData(revenue.dailyRevenue),
    [revenue.dailyRevenue],
  );

  // -- Prepare HF histogram data ---------------------------------------------
  const hfHistogramData: HistogramBar[] = useMemo(() => {
    const buckets = overview.hfDistribution;
    return buckets.map((bucket) => {
      const rangeMin = parseFloat(bucket.range.replace(/[<>]/g, '').split('-')[0] ?? '0');
      const rangeMax = parseFloat(bucket.range.split('-')[1] ?? '10');
      return {
        label: bucket.range,
        value: bucket.count,
        rangeMin: isNaN(rangeMin) ? 0 : rangeMin,
        rangeMax: isNaN(rangeMax) ? 10 : rangeMax,
      };
    });
  }, [overview.hfDistribution]);

  // -- KPI trend/sparkline helpers -------------------------------------------
  const tvlSparkline = useMemo(
    () => overview.tvlHistory.slice(-14).map((pt) => pt.value),
    [overview.tvlHistory],
  );

  const tvlTrend = overview.tvlChange7d >= 0 ? 'up' as const : 'down' as const;
  const tvlTrendValue = `${overview.tvlChange7d >= 0 ? '+' : ''}${(overview.tvlChange7d * 100).toFixed(1)}%`;

  // -- Render ----------------------------------------------------------------
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary tracking-tight">
          Admin Analytics
        </h1>
        <p className="text-sm text-text-tertiary mt-1">
          Protocol-wide metrics, revenue, and user analytics
        </p>
      </div>

      {/* ===== 1. Key Metrics Row ===== */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Total Value Locked"
          value={overview.tvlUsd}
          prefix="$"
          decimals={0}
          trend={tvlTrend}
          trendValue={tvlTrendValue}
          trendContext="7d"
          sparkline={tvlSparkline}
          loading={overviewLoading}
        />
        <KPICard
          label="Total Users"
          value={overview.totalUsers}
          decimals={0}
          trend="up"
          trendValue="+12.4%"
          trendContext="30d"
          loading={overviewLoading}
        />
        <KPICard
          label="Volume 24h"
          value={overview.volume24h}
          prefix="$"
          decimals={0}
          trend="up"
          trendValue="+8.7%"
          trendContext="vs yesterday"
          loading={overviewLoading}
        />
        <KPICard
          label="Revenue 30d"
          value={overview.revenue30d}
          prefix="$"
          decimals={0}
          trend="up"
          trendValue="+15.2%"
          trendContext="vs prev 30d"
          loading={overviewLoading}
        />
      </section>

      {/* ===== 2. TVL Trend Area Chart ===== */}
      <section className="rounded-md border border-border-default bg-bg-tertiary p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              TVL Trend
            </h2>
            <p className="text-xs text-text-tertiary mt-0.5">
              Total value locked over time
            </p>
          </div>
          <span className="text-2xl font-mono font-bold text-text-primary">
            {formatCompact(overview.tvlUsd)}
          </span>
        </div>
        <AreaChart
          data={tvlChartData}
          xKey="date"
          yKey="tvl"
          color="var(--color-accent-teal, #14B8A6)"
          height={340}
          timeRange={tvlTimeRange}
          onTimeRangeChange={setTvlTimeRange}
          formatter={(value: number) => formatUSD(value)}
          labelFormatter={(label: string) => label}
        />
      </section>

      {/* ===== 3. Revenue + Protocol Health (Side by Side) ===== */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Revenue bar chart — 2 cols */}
        <div className="xl:col-span-2 rounded-md border border-border-default bg-bg-tertiary p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-accent-teal" />
                <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                  Daily Revenue
                </h2>
              </div>
              <p className="text-xs text-text-tertiary mt-0.5">
                Stacked by revenue type (last 30 days)
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-mono font-bold text-text-primary">
                {formatCompact(revenue.total30d)}
              </span>
              <span className="block text-xs text-text-tertiary">30d total</span>
            </div>
          </div>
          <RevenueBarChart data={revenueBarData} height={320} />

          {/* Revenue breakdown summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border-default">
            {revenue.breakdown.map((entry) => (
              <div key={entry.type} className="text-center">
                <span
                  className="inline-block h-2 w-2 rounded-full mr-1.5"
                  style={{ backgroundColor: REVENUE_TYPE_COLORS[entry.type] }}
                />
                <span className="text-xs text-text-tertiary">
                  {REVENUE_TYPE_LABELS[entry.type]}
                </span>
                <p className="font-mono text-sm font-medium text-text-primary mt-0.5">
                  {formatCompact(entry.amount)}
                </p>
                <p className="text-xs text-text-tertiary">{formatPercent(entry.percentage)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Protocol Health card — 1 col */}
        <ProtocolHealthCard health={protocolHealth} />
      </section>

      {/* ===== 4. Pool Comparison Table ===== */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-accent-teal" />
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
            Pool Comparison
          </h2>
          <span className="ml-auto text-xs text-text-tertiary">
            Sorted by TVL
          </span>
        </div>
        <PoolComparisonTable pools={pools} />
      </section>

      {/* ===== 5. Health Factor Distribution ===== */}
      <section className="rounded-md border border-border-default bg-bg-tertiary p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Health Factor Distribution
            </h2>
            <p className="text-xs text-text-tertiary mt-0.5">
              Number of positions by health factor range
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="text-text-tertiary">Danger (&lt;1.0)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
              <span className="text-text-tertiary">Warning (1.0-1.5)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="text-text-tertiary">Moderate (1.5-2.0)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-text-tertiary">Safe (2.0+)</span>
            </div>
          </div>
        </div>
        <HistogramChart data={hfHistogramData} height={260} />
      </section>

      {/* ===== 6. User Analytics ===== */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-accent-teal" />
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
            User Analytics
          </h2>
        </div>

        {/* DAU / WAU / MAU */}
        <UserEngagementRow analytics={userAnalytics} />

        {/* Cohort Retention Table */}
        <div>
          <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
            Cohort Retention
          </h3>
          <CohortRetentionTable cohorts={userAnalytics.cohortRetention} />
        </div>
      </section>
    </div>
  );
}
