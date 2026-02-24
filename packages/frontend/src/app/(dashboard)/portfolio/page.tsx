'use client';

import { useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/Badge';
import { KPICard } from '@/components/data-display/KPICard';
import { AssetIcon } from '@/components/data-display/AssetIcon';
import { HealthFactorGauge } from '@/components/data-display/HealthFactorGauge';
import { DonutChart } from '@/components/charts/DonutChart';
import type { DonutSegment } from '@/components/charts/DonutChart';
import { AreaChart } from '@/components/charts/AreaChart';
import { useAnalyticsStore, getAssetColor } from '@/stores/useAnalyticsStore';
import { useUserPortfolio, useUserTransactions, usePnlBreakdown } from '@/hooks/api';
import type {
  AnalyticsTimeRange,
  UserPortfolio,
  UserTransaction,
  PnlBreakdown,
  SupplyPositionDetail,
  BorrowPositionDetail,
  TimeSeriesPoint,
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
  return formatUSD(value);
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(2)}%`;
}

function relativeTime(isoString: string): string {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function generateSparkline(n: number, base: number, variance: number): number[] {
  const points: number[] = [];
  let current = base;
  for (let i = 0; i < n; i++) {
    current = current + Math.sin(i * 1.3) * variance + variance * 0.2;
    points.push(Math.round(current * 100) / 100);
  }
  return points;
}

function generateTimeSeriesHistory(
  days: number,
  base: number,
  variance: number,
): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const now = new Date();
  let current = base;
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    current = current + Math.sin(i * 0.7) * variance + variance * 0.15;
    points.push({
      timestamp: d.toISOString().slice(0, 10),
      value: Math.round(current * 100) / 100,
    });
  }
  return points;
}

// ---------------------------------------------------------------------------
// Time Range Config
// ---------------------------------------------------------------------------

const TIME_RANGE_LABELS: Record<AnalyticsTimeRange, string> = {
  '7d': '7D',
  '30d': '1M',
  '90d': '3M',
  '1y': '1Y',
};

const TIME_RANGE_OPTIONS: AnalyticsTimeRange[] = ['7d', '30d', '90d', '1y'];

// ---------------------------------------------------------------------------
// Mock / Fallback Data
// ---------------------------------------------------------------------------

const MOCK_SUPPLY_POSITIONS: SupplyPositionDetail[] = [
  { poolId: 'pool-usdc', asset: 'USDC', amount: 250_000, valueUsd: 250_000, apy: 0.0485, interestEarned: 3_125 },
  { poolId: 'pool-eth', asset: 'ETH', amount: 50, valueUsd: 175_000, apy: 0.0312, interestEarned: 1_406 },
  { poolId: 'pool-tbill', asset: 'T-BILL', amount: 500_000, valueUsd: 502_500, apy: 0.0510, interestEarned: 6_563 },
  { poolId: 'pool-wbtc', asset: 'WBTC', amount: 2.5, valueUsd: 162_500, apy: 0.0215, interestEarned: 898 },
  { poolId: 'pool-dai', asset: 'DAI', amount: 100_000, valueUsd: 100_000, apy: 0.0395, interestEarned: 1_013 },
];

const MOCK_BORROW_POSITIONS: BorrowPositionDetail[] = [
  { poolId: 'pool-usdc', asset: 'USDC', amount: 125_000, valueUsd: 125_000, apy: 0.0589, interestPaid: 1_893, healthFactor: 2.15 },
  { poolId: 'pool-eth', asset: 'ETH', amount: 10, valueUsd: 35_000, apy: 0.0412, interestPaid: 370, healthFactor: 1.85 },
  { poolId: 'pool-usdt', asset: 'USDT', amount: 50_000, valueUsd: 50_000, apy: 0.0545, interestPaid: 700, healthFactor: 2.42 },
];

const MOCK_PORTFOLIO: UserPortfolio = {
  totalSupplyUsd: 1_190_000,
  totalBorrowUsd: 210_000,
  netWorthUsd: 980_000,
  totalInterestEarned: 13_005,
  totalInterestPaid: 2_963,
  netInterestUsd: 10_042,
  unrealizedPnl: 4_250,
  totalPnl: 14_292,
  avgHealthFactor: 2.14,
  lowestHealthFactor: 1.85,
  supplyPositions: MOCK_SUPPLY_POSITIONS,
  borrowPositions: MOCK_BORROW_POSITIONS,
  portfolioValueHistory: generateTimeSeriesHistory(90, 920_000, 8_000),
  pnlHistory: generateTimeSeriesHistory(90, 0, 350),
};

const MOCK_TRANSACTIONS: UserTransaction[] = [
  { id: 'tx-001', type: 'deposit', poolId: 'pool-usdc', asset: 'USDC', amount: 100_000, amountUsd: 100_000, createdAt: '2026-02-22T08:30:00Z' },
  { id: 'tx-002', type: 'borrow', poolId: 'pool-usdc', asset: 'USDC', amount: 50_000, amountUsd: 50_000, createdAt: '2026-02-22T06:45:00Z' },
  { id: 'tx-003', type: 'deposit', poolId: 'pool-tbill', asset: 'T-BILL', amount: 500_000, amountUsd: 502_500, createdAt: '2026-02-21T22:00:00Z' },
  { id: 'tx-004', type: 'repay', poolId: 'pool-usdc', asset: 'USDC', amount: 25_000, amountUsd: 25_000, createdAt: '2026-02-21T18:15:00Z' },
  { id: 'tx-005', type: 'withdraw', poolId: 'pool-eth', asset: 'ETH', amount: 2.5, amountUsd: 8_750, createdAt: '2026-02-21T14:30:00Z' },
  { id: 'tx-006', type: 'deposit', poolId: 'pool-eth', asset: 'ETH', amount: 5.0, amountUsd: 17_500, createdAt: '2026-02-20T20:00:00Z' },
  { id: 'tx-007', type: 'borrow', poolId: 'pool-eth', asset: 'ETH', amount: 3.0, amountUsd: 10_500, createdAt: '2026-02-20T16:00:00Z' },
  { id: 'tx-008', type: 'deposit', poolId: 'pool-usdc', asset: 'USDC', amount: 250_000, amountUsd: 250_000, createdAt: '2026-02-19T12:00:00Z' },
  { id: 'tx-009', type: 'repay', poolId: 'pool-eth', asset: 'ETH', amount: 1.5, amountUsd: 5_250, createdAt: '2026-02-19T08:00:00Z' },
  { id: 'tx-010', type: 'withdraw', poolId: 'pool-usdc', asset: 'USDC', amount: 75_000, amountUsd: 75_000, createdAt: '2026-02-18T22:00:00Z' },
  { id: 'tx-011', type: 'deposit', poolId: 'pool-tbill', asset: 'T-BILL', amount: 200_000, amountUsd: 201_000, createdAt: '2026-02-18T10:00:00Z' },
  { id: 'tx-012', type: 'liquidation', poolId: 'pool-usdc', asset: 'USDC', amount: 15_000, amountUsd: 15_000, createdAt: '2026-02-17T14:00:00Z' },
];

const MOCK_PNL_BREAKDOWN: PnlBreakdown[] = [
  { poolId: 'pool-usdc', asset: 'USDC', interestEarned: 3_125, interestPaid: 1_893, netPnl: 1_232, unrealizedPnl: 0 },
  { poolId: 'pool-eth', asset: 'ETH', interestEarned: 1_406, interestPaid: 370, netPnl: 1_036, unrealizedPnl: 2_100 },
  { poolId: 'pool-tbill', asset: 'T-BILL', interestEarned: 6_563, interestPaid: 0, netPnl: 6_563, unrealizedPnl: 1_250 },
  { poolId: 'pool-wbtc', asset: 'WBTC', interestEarned: 898, interestPaid: 0, netPnl: 898, unrealizedPnl: 650 },
  { poolId: 'pool-dai', asset: 'DAI', interestEarned: 1_013, interestPaid: 0, netPnl: 1_013, unrealizedPnl: 0 },
  { poolId: 'pool-usdt', asset: 'USDT', interestEarned: 0, interestPaid: 700, netPnl: -700, unrealizedPnl: 250 },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TimeRangeSelector({
  value,
  onChange,
}: {
  value: AnalyticsTimeRange;
  onChange: (range: AnalyticsTimeRange) => void;
}) {
  return (
    <div className="flex gap-1">
      {TIME_RANGE_OPTIONS.map((range) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-sm transition-colors',
            range === value
              ? 'bg-accent-teal-muted text-accent-teal'
              : 'text-text-tertiary hover:text-text-primary hover:bg-bg-hover',
          )}
        >
          {TIME_RANGE_LABELS[range]}
        </button>
      ))}
    </div>
  );
}

function PortfolioValueChart({
  data,
  timeRange,
  onTimeRangeChange,
  loading,
}: {
  data: TimeSeriesPoint[];
  timeRange: AnalyticsTimeRange;
  onTimeRangeChange: (range: AnalyticsTimeRange) => void;
  loading: boolean;
}) {
  const filteredData = useMemo(() => {
    if (!data.length) return [];
    const daysMap: Record<AnalyticsTimeRange, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
    const cutoff = daysMap[timeRange];
    return data.slice(-cutoff).map((p) => ({
      date: p.timestamp.slice(5),
      value: p.value,
    }));
  }, [data, timeRange]);

  return (
    <div className="rounded-lg border border-border-default bg-bg-tertiary p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-label">Portfolio Value</h2>
        <TimeRangeSelector value={timeRange} onChange={onTimeRangeChange} />
      </div>
      <AreaChart
        data={filteredData}
        xKey="date"
        yKey="value"
        color="var(--color-accent-teal)"
        height={300}
        loading={loading}
        formatter={(v: number) => formatUSD(v)}
        labelFormatter={(label: string) => label}
      />
    </div>
  );
}

function AssetAllocationCard({
  segments,
  totalValue,
}: {
  segments: DonutSegment[];
  totalValue: number;
}) {
  if (segments.length === 0) {
    return (
      <div className="rounded-lg border border-border-default bg-bg-tertiary p-5 shadow-card">
        <h2 className="text-label mb-4">Asset Allocation</h2>
        <div className="flex items-center justify-center py-12">
          <p className="text-text-tertiary text-sm">No positions to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border-default bg-bg-tertiary p-5 shadow-card">
      <h2 className="text-label mb-4">Asset Allocation</h2>
      <DonutChart
        segments={segments}
        size={200}
        centerLabel="Total"
        centerValue={formatCompact(totalValue)}
      />
    </div>
  );
}

function PnlBreakdownCard({ breakdown }: { breakdown: PnlBreakdown[] }) {
  const totalNet = breakdown.reduce((sum, b) => sum + b.netPnl, 0);
  const totalUnrealized = breakdown.reduce((sum, b) => sum + b.unrealizedPnl, 0);

  return (
    <div className="rounded-lg border border-border-default bg-bg-tertiary p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-label">P&L Breakdown</h2>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-text-tertiary block">Realized</span>
            <span className={cn('font-mono text-sm font-medium', totalNet >= 0 ? 'text-positive' : 'text-negative')}>
              {totalNet >= 0 ? '+' : ''}{formatUSD(totalNet)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-text-tertiary block">Unrealized</span>
            <span className={cn('font-mono text-sm font-medium', totalUnrealized >= 0 ? 'text-positive' : 'text-negative')}>
              {totalUnrealized >= 0 ? '+' : ''}{formatUSD(totalUnrealized)}
            </span>
          </div>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-border-default shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default bg-bg-secondary/40">
              <th className="text-label px-4 h-9 text-left">Asset</th>
              <th className="text-label px-4 h-9 text-right">Earned</th>
              <th className="text-label px-4 h-9 text-right">Paid</th>
              <th className="text-label px-4 h-9 text-right">Net P&L</th>
              <th className="text-label px-4 h-9 text-right">Unrealized</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((row) => (
              <tr
                key={row.poolId}
                className="border-b border-border-default last:border-b-0 h-12 hover:bg-surface-selected table-row-interactive transition-colors"
              >
                <td className="px-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: getAssetColor(row.asset) }}
                    />
                    <AssetIcon symbol={row.asset} size="sm" />
                    <span className="font-medium text-text-primary">{row.asset}</span>
                  </div>
                </td>
                <td className="px-4 text-right font-mono text-positive">
                  {row.interestEarned > 0 ? `+${formatUSD(row.interestEarned)}` : '--'}
                </td>
                <td className="px-4 text-right font-mono text-negative">
                  {row.interestPaid > 0 ? `-${formatUSD(row.interestPaid)}` : '--'}
                </td>
                <td className={cn('px-4 text-right font-mono', row.netPnl >= 0 ? 'text-positive' : 'text-negative')}>
                  {row.netPnl >= 0 ? '+' : ''}{formatUSD(row.netPnl)}
                </td>
                <td className={cn('px-4 text-right font-mono', row.unrealizedPnl >= 0 ? 'text-text-secondary' : 'text-negative')}>
                  {row.unrealizedPnl > 0 ? `+${formatUSD(row.unrealizedPnl)}` : row.unrealizedPnl === 0 ? '--' : formatUSD(row.unrealizedPnl)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type PositionSide = 'Supply' | 'Borrow';

interface UnifiedPosition {
  id: string;
  side: PositionSide;
  asset: string;
  amount: number;
  valueUsd: number;
  apy: number;
  interestAmount: number;
  healthFactor: number | null;
}

function PositionsTable({
  supplyPositions,
  borrowPositions,
}: {
  supplyPositions: SupplyPositionDetail[];
  borrowPositions: BorrowPositionDetail[];
}) {
  const unified = useMemo<UnifiedPosition[]>(() => {
    const result: UnifiedPosition[] = [];
    for (const p of supplyPositions) {
      result.push({
        id: `supply-${p.poolId}`,
        side: 'Supply',
        asset: p.asset,
        amount: p.amount,
        valueUsd: p.valueUsd,
        apy: p.apy,
        interestAmount: p.interestEarned,
        healthFactor: null,
      });
    }
    for (const p of borrowPositions) {
      result.push({
        id: `borrow-${p.poolId}`,
        side: 'Borrow',
        asset: p.asset,
        amount: p.amount,
        valueUsd: p.valueUsd,
        apy: p.apy,
        interestAmount: p.interestPaid,
        healthFactor: p.healthFactor,
      });
    }
    return result;
  }, [supplyPositions, borrowPositions]);

  if (unified.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border-default bg-bg-tertiary py-16">
        <p className="text-text-disabled text-sm">No positions found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border-default bg-bg-tertiary shadow-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default bg-bg-secondary/40">
            <th className="text-label px-4 h-9 text-left">Side</th>
            <th className="text-label px-4 h-9 text-left">Asset</th>
            <th className="text-label px-4 h-9 text-right">Amount</th>
            <th className="text-label px-4 h-9 text-right">Value USD</th>
            <th className="text-label px-4 h-9 text-right">APY</th>
            <th className="text-label px-4 h-9 text-right">Interest</th>
            <th className="text-label px-4 h-9 text-center">Health Factor</th>
          </tr>
        </thead>
        <tbody>
          {unified.map((pos) => (
            <tr
              key={pos.id}
              className="border-b border-border-default last:border-b-0 h-12 hover:bg-surface-selected table-row-interactive transition-colors"
            >
              <td className="px-4">
                <Badge variant={pos.side === 'Supply' ? 'success' : 'danger'} size="sm">
                  {pos.side}
                </Badge>
              </td>
              <td className="px-4">
                <div className="flex items-center gap-2">
                  <AssetIcon symbol={pos.asset} size="sm" />
                  <span className="font-medium text-text-primary">{pos.asset}</span>
                </div>
              </td>
              <td className="px-4 text-right">
                <span className="font-mono text-text-primary">
                  {pos.amount.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                </span>
              </td>
              <td className="px-4 text-right">
                <span className="font-mono text-text-primary">{formatUSD(pos.valueUsd)}</span>
              </td>
              <td className="px-4 text-right">
                <span className={cn('font-mono', pos.side === 'Supply' ? 'text-positive' : 'text-negative')}>
                  {(pos.apy * 100).toFixed(2)}%
                </span>
              </td>
              <td className="px-4 text-right">
                <span className={cn('font-mono', pos.side === 'Supply' ? 'text-positive' : 'text-negative')}>
                  {pos.side === 'Supply' ? '+' : '-'}{formatUSD(pos.interestAmount)}
                </span>
              </td>
              <td className="px-4">
                <div className="flex justify-center">
                  {pos.healthFactor !== null ? (
                    <HealthFactorGauge value={pos.healthFactor} size="sm" showLabel={false} />
                  ) : (
                    <span className="text-xs text-text-tertiary">--</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getTxTypeBadgeVariant(type: UserTransaction['type']): 'success' | 'danger' | 'warning' | 'info' {
  switch (type) {
    case 'deposit':
      return 'success';
    case 'withdraw':
      return 'warning';
    case 'borrow':
      return 'danger';
    case 'repay':
      return 'info';
    case 'liquidation':
      return 'danger';
    default:
      return 'info';
  }
}

function getTxTypeLabel(type: UserTransaction['type']): string {
  switch (type) {
    case 'deposit':
      return 'Deposit';
    case 'withdraw':
      return 'Withdraw';
    case 'borrow':
      return 'Borrow';
    case 'repay':
      return 'Repay';
    case 'liquidation':
      return 'Liquidation';
    default:
      return type;
  }
}

function RecentTransactionsTable({ transactions }: { transactions: UserTransaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border-default bg-bg-tertiary py-16">
        <p className="text-text-disabled text-sm">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border-default bg-bg-tertiary shadow-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default bg-bg-secondary/40">
            <th className="text-label px-4 h-9 text-left">Time</th>
            <th className="text-label px-4 h-9 text-left">Type</th>
            <th className="text-label px-4 h-9 text-left">Asset</th>
            <th className="text-label px-4 h-9 text-right">Amount</th>
            <th className="text-label px-4 h-9 text-right">Value USD</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr
              key={tx.id}
              className="border-b border-border-default last:border-b-0 h-12 hover:bg-surface-selected table-row-interactive transition-colors"
            >
              <td className="px-4">
                <span className="text-xs text-text-tertiary">{relativeTime(tx.createdAt)}</span>
              </td>
              <td className="px-4">
                <Badge variant={getTxTypeBadgeVariant(tx.type)} size="sm">
                  {getTxTypeLabel(tx.type)}
                </Badge>
              </td>
              <td className="px-4">
                <div className="flex items-center gap-2">
                  <AssetIcon symbol={tx.asset} size="sm" />
                  <span className="font-medium text-text-primary">{tx.asset}</span>
                </div>
              </td>
              <td className="px-4 text-right">
                <span className="font-mono text-text-primary">
                  {tx.amount.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                </span>
              </td>
              <td className="px-4 text-right">
                <span className="font-mono text-text-primary">{formatUSD(tx.amountUsd)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export Buttons
// ---------------------------------------------------------------------------

function ExportButtons() {
  const { exportLoading, setExportLoading } = useAnalyticsStore();

  const handleExport = useCallback(
    async (format: 'csv' | 'pdf') => {
      setExportLoading(true);
      try {
        const response = await fetch('/v1/institutional/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'user_transactions' as const,
            format,
          }),
        });

        if (!response.ok) {
          throw new Error(`Export failed: ${response.statusText}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolio-export.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        // Silently fail -- in production this would trigger a toast notification
      } finally {
        setExportLoading(false);
      }
    },
    [setExportLoading],
  );

  return (
    <div className="flex gap-2">
      <button
        onClick={() => void handleExport('csv')}
        disabled={exportLoading}
        className={cn(
          'px-3 py-1.5 text-xs font-medium rounded-md border transition-colors',
          'border-border-default text-text-secondary hover:text-text-primary hover:bg-bg-hover',
          exportLoading && 'opacity-50 cursor-not-allowed',
        )}
      >
        {exportLoading ? 'Exporting...' : 'Export CSV'}
      </button>
      <button
        onClick={() => void handleExport('pdf')}
        disabled={exportLoading}
        className={cn(
          'px-3 py-1.5 text-xs font-medium rounded-md border transition-colors',
          'border-border-default text-text-secondary hover:text-text-primary hover:bg-bg-hover',
          exportLoading && 'opacity-50 cursor-not-allowed',
        )}
      >
        {exportLoading ? 'Exporting...' : 'Export PDF'}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function PortfolioPage() {
  const { selectedRange, setSelectedRange } = useAnalyticsStore();

  // API hooks -- fallback to mock data if API unavailable
  const { data: portfolioData, isLoading: portfolioLoading } = useUserPortfolio(selectedRange);
  const { data: transactionsData } = useUserTransactions(20);
  const { data: pnlData } = usePnlBreakdown();

  // Resolved data with fallbacks
  const portfolio: UserPortfolio = portfolioData ?? MOCK_PORTFOLIO;
  const transactions: UserTransaction[] = transactionsData ?? MOCK_TRANSACTIONS;
  const pnlBreakdown: PnlBreakdown[] = pnlData ?? MOCK_PNL_BREAKDOWN;

  const isLoading = portfolioLoading;

  // Sparklines for KPI cards
  const sparklineSupply = useMemo(() => generateSparkline(7, portfolio.totalSupplyUsd, 15_000), [portfolio.totalSupplyUsd]);
  const sparklineBorrow = useMemo(() => generateSparkline(7, portfolio.totalBorrowUsd, 5_000), [portfolio.totalBorrowUsd]);
  const sparklineNetWorth = useMemo(() => generateSparkline(7, portfolio.netWorthUsd, 10_000), [portfolio.netWorthUsd]);
  const sparklinePnl = useMemo(() => generateSparkline(7, portfolio.totalPnl, 800), [portfolio.totalPnl]);

  // Donut segments -- merge supply + borrow by asset for allocation view
  const donutSegments = useMemo<DonutSegment[]>(() => {
    const assetValues = new Map<string, number>();

    for (const p of portfolio.supplyPositions) {
      assetValues.set(p.asset, (assetValues.get(p.asset) ?? 0) + p.valueUsd);
    }
    for (const p of portfolio.borrowPositions) {
      assetValues.set(p.asset, (assetValues.get(p.asset) ?? 0) + p.valueUsd);
    }

    return Array.from(assetValues.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([asset, value]) => ({
        label: asset,
        value,
        color: getAssetColor(asset),
      }));
  }, [portfolio.supplyPositions, portfolio.borrowPositions]);

  const donutTotal = useMemo(
    () => donutSegments.reduce((sum, seg) => sum + seg.value, 0),
    [donutSegments],
  );

  // P&L trend
  const pnlTrend = portfolio.totalPnl >= 0 ? 'up' as const : 'down' as const;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Portfolio</h1>
        <ExportButtons />
      </div>

      {/* Summary KPI Row */}
      <section>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard
            label="Total Supplied"
            value={portfolio.totalSupplyUsd}
            prefix="$"
            decimals={0}
            sparkline={sparklineSupply}
            trend="up"
            trendValue={formatPercent(0.052)}
            trendContext="7d"
            loading={isLoading}
          />
          <KPICard
            label="Total Borrowed"
            value={portfolio.totalBorrowUsd}
            prefix="$"
            decimals={0}
            sparkline={sparklineBorrow}
            trend="flat"
            trendValue={formatPercent(0.008)}
            trendContext="7d"
            loading={isLoading}
          />
          <KPICard
            label="Net Worth"
            value={portfolio.netWorthUsd}
            prefix="$"
            decimals={0}
            sparkline={sparklineNetWorth}
            trend="up"
            trendValue={formatPercent(0.043)}
            trendContext="7d"
            loading={isLoading}
          />
          <KPICard
            label="Total P&L"
            value={portfolio.totalPnl}
            prefix="$"
            decimals={0}
            sparkline={sparklinePnl}
            trend={pnlTrend}
            trendValue={`${portfolio.totalPnl >= 0 ? '+' : ''}${formatUSD(portfolio.totalPnl)}`}
            trendContext="all-time"
            loading={isLoading}
          />
        </div>
      </section>

      {/* Portfolio Value Chart */}
      <section>
        <PortfolioValueChart
          data={portfolio.portfolioValueHistory}
          timeRange={selectedRange}
          onTimeRangeChange={setSelectedRange}
          loading={isLoading}
        />
      </section>

      {/* Asset Allocation + P&L Breakdown side by side */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AssetAllocationCard segments={donutSegments} totalValue={donutTotal} />
        <PnlBreakdownCard breakdown={pnlBreakdown} />
      </section>

      {/* Health Factor Overview */}
      {portfolio.avgHealthFactor !== null && (
        <section className="rounded-lg border border-border-default bg-bg-tertiary p-5 shadow-card">
          <h2 className="text-label mb-4">Health Factor</h2>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-around">
            <div className="flex flex-col items-center gap-2">
              <HealthFactorGauge value={portfolio.avgHealthFactor ?? 0} size="md" />
              <span className="text-xs text-text-tertiary">Average HF</span>
            </div>
            {portfolio.lowestHealthFactor !== null && (
              <div className="flex flex-col items-center gap-2">
                <HealthFactorGauge value={portfolio.lowestHealthFactor ?? 0} size="md" />
                <span className="text-xs text-text-tertiary">Lowest HF</span>
              </div>
            )}
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-text-tertiary">Net Interest:</span>
                <span className={cn('font-mono font-medium', portfolio.netInterestUsd >= 0 ? 'text-positive' : 'text-negative')}>
                  {portfolio.netInterestUsd >= 0 ? '+' : ''}{formatUSD(portfolio.netInterestUsd)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-tertiary">Unrealized P&L:</span>
                <span className={cn('font-mono font-medium', portfolio.unrealizedPnl >= 0 ? 'text-positive' : 'text-negative')}>
                  {portfolio.unrealizedPnl >= 0 ? '+' : ''}{formatUSD(portfolio.unrealizedPnl)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-tertiary">Interest Earned:</span>
                <span className="font-mono font-medium text-positive">
                  +{formatUSD(portfolio.totalInterestEarned)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-tertiary">Interest Paid:</span>
                <span className="font-mono font-medium text-negative">
                  -{formatUSD(portfolio.totalInterestPaid)}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* All Positions */}
      <section>
        <h2 className="text-label section-heading mb-4">Positions</h2>
        <PositionsTable
          supplyPositions={portfolio.supplyPositions}
          borrowPositions={portfolio.borrowPositions}
        />
      </section>

      {/* Recent Transactions */}
      <section>
        <h2 className="text-label section-heading mb-4">Recent Transactions</h2>
        <RecentTransactionsTable transactions={transactions} />
      </section>
    </div>
  );
}
