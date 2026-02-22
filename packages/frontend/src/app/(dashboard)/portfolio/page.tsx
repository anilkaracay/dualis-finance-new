'use client';

import { useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/Badge';
import { KPICard } from '@/components/data-display/KPICard';
import { AssetIcon } from '@/components/data-display/AssetIcon';
import { HealthFactorGauge } from '@/components/data-display/HealthFactorGauge';
import { DonutChart } from '@/components/charts/DonutChart';
import type { DonutSegment } from '@/components/charts/DonutChart';
import { usePositionStore } from '@/stores/usePositionStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PositionType = 'Supply' | 'Borrow' | 'SecLend';

interface UnifiedPosition {
  id: string;
  type: PositionType;
  symbol: string;
  amount: number;
  valueUSD: number;
  apyOrFee: number;
  healthFactor: number | undefined;
  status: string;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'borrow' | 'repay';
  symbol: string;
  amount: number;
  timestamp: string;
  status: 'Confirmed';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ASSET_COLORS: Record<string, string> = {
  USDC: '#2775CA',
  'T-BILL-2026': '#10B981',
  ETH: '#627EEA',
  wBTC: '#F7931A',
  CC: '#8B5CF6',
  'SPY-2026': '#EF4444',
};

const DEFAULT_ASSET_COLOR = '#6B7280';

function getAssetColor(symbol: string): string {
  return ASSET_COLORS[symbol] ?? DEFAULT_ASSET_COLOR;
}

function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCompactUSD(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return formatUSD(value);
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
    current = current + (Math.sin(i * 1.3) * variance + variance * 0.2);
    points.push(Math.round(current * 100) / 100);
  }
  return points;
}

function getTypeBadgeVariant(type: PositionType): 'success' | 'danger' | 'info' {
  switch (type) {
    case 'Supply':
      return 'success';
    case 'Borrow':
      return 'danger';
    case 'SecLend':
      return 'info';
  }
}

function getTxTypeBadgeVariant(type: Transaction['type']): 'success' | 'danger' | 'warning' | 'info' {
  switch (type) {
    case 'deposit':
      return 'success';
    case 'withdraw':
      return 'warning';
    case 'borrow':
      return 'danger';
    case 'repay':
      return 'info';
  }
}

function getTxTypeLabel(type: Transaction['type']): string {
  switch (type) {
    case 'deposit':
      return 'Deposit';
    case 'withdraw':
      return 'Withdraw';
    case 'borrow':
      return 'Borrow';
    case 'repay':
      return 'Repay';
  }
}

// ---------------------------------------------------------------------------
// Mock Data: Transaction History
// ---------------------------------------------------------------------------

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tx-001', type: 'deposit', symbol: 'USDC', amount: 100_000, timestamp: '2026-02-22T08:30:00Z', status: 'Confirmed' },
  { id: 'tx-002', type: 'borrow', symbol: 'USDC', amount: 50_000, timestamp: '2026-02-22T06:45:00Z', status: 'Confirmed' },
  { id: 'tx-003', type: 'deposit', symbol: 'T-BILL-2026', amount: 500_000, timestamp: '2026-02-21T22:00:00Z', status: 'Confirmed' },
  { id: 'tx-004', type: 'repay', symbol: 'USDC', amount: 25_000, timestamp: '2026-02-21T18:15:00Z', status: 'Confirmed' },
  { id: 'tx-005', type: 'withdraw', symbol: 'ETH', amount: 2.5, timestamp: '2026-02-21T14:30:00Z', status: 'Confirmed' },
  { id: 'tx-006', type: 'deposit', symbol: 'ETH', amount: 5.0, timestamp: '2026-02-20T20:00:00Z', status: 'Confirmed' },
  { id: 'tx-007', type: 'borrow', symbol: 'ETH', amount: 3.0, timestamp: '2026-02-20T16:00:00Z', status: 'Confirmed' },
  { id: 'tx-008', type: 'deposit', symbol: 'USDC', amount: 250_000, timestamp: '2026-02-19T12:00:00Z', status: 'Confirmed' },
  { id: 'tx-009', type: 'repay', symbol: 'ETH', amount: 1.5, timestamp: '2026-02-19T08:00:00Z', status: 'Confirmed' },
  { id: 'tx-010', type: 'withdraw', symbol: 'USDC', amount: 75_000, timestamp: '2026-02-18T22:00:00Z', status: 'Confirmed' },
  { id: 'tx-011', type: 'deposit', symbol: 'T-BILL-2026', amount: 200_000, timestamp: '2026-02-18T10:00:00Z', status: 'Confirmed' },
  { id: 'tx-012', type: 'borrow', symbol: 'USDC', amount: 100_000, timestamp: '2026-02-17T14:00:00Z', status: 'Confirmed' },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AssetAllocation({
  segments,
  totalValue,
}: {
  segments: DonutSegment[];
  totalValue: number;
}) {
  if (segments.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-md border border-border-default bg-bg-tertiary py-12">
        <p className="text-text-tertiary text-sm">No positions to display</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      {/* Donut chart */}
      <div className="flex-1 flex justify-center">
        <DonutChart
          segments={segments}
          size={180}
          centerLabel="Total"
          centerValue={formatCompactUSD(totalValue)}
        />
      </div>

      {/* Breakdown table */}
      <div className="w-full md:w-80">
        <div className="overflow-hidden rounded-md border border-border-default bg-bg-tertiary">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default backdrop-blur">
                <th className="text-label px-4 h-10 text-left">Asset</th>
                <th className="text-label px-4 h-10 text-right">Value</th>
                <th className="text-label px-4 h-10 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((seg) => {
                const pct = totalValue > 0 ? (seg.value / totalValue) * 100 : 0;
                return (
                  <tr
                    key={seg.label}
                    className="border-b border-border-default last:border-b-0"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: seg.color }}
                        />
                        <span className="text-text-primary font-medium">{seg.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-text-primary">
                      {formatUSD(seg.value)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-text-tertiary">
                      {pct.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AllPositionsTable({ positions }: { positions: UnifiedPosition[] }) {
  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-border-default bg-bg-tertiary py-12">
        <p className="text-text-tertiary text-sm">No positions found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border-default bg-bg-tertiary">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default backdrop-blur">
            <th className="text-label px-4 h-10 text-left">Type</th>
            <th className="text-label px-4 h-10 text-left">Asset</th>
            <th className="text-label px-4 h-10 text-right">Amount</th>
            <th className="text-label px-4 h-10 text-right">Value USD</th>
            <th className="text-label px-4 h-10 text-right">APY / Fee</th>
            <th className="text-label px-4 h-10 text-center">Health Factor</th>
            <th className="text-label px-4 h-10 text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos) => (
            <tr
              key={pos.id}
              className="border-b border-border-default last:border-b-0 h-14 hover:bg-bg-hover/50 transition-colors"
            >
              <td className="px-4">
                <Badge variant={getTypeBadgeVariant(pos.type)} size="sm">
                  {pos.type}
                </Badge>
              </td>
              <td className="px-4">
                <div className="flex items-center gap-2">
                  <AssetIcon symbol={pos.symbol} size="sm" />
                  <span className="font-medium text-text-primary">{pos.symbol}</span>
                </div>
              </td>
              <td className="px-4 text-right">
                <span className="font-mono text-text-primary">
                  {pos.amount.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                </span>
              </td>
              <td className="px-4 text-right">
                <span className="font-mono text-text-primary">{formatUSD(pos.valueUSD)}</span>
              </td>
              <td className="px-4 text-right">
                <span className={cn(
                  'font-mono',
                  pos.type === 'Borrow' ? 'text-negative' : 'text-positive'
                )}>
                  {(pos.apyOrFee * 100).toFixed(2)}%
                </span>
              </td>
              <td className="px-4">
                <div className="flex justify-center">
                  {pos.healthFactor !== undefined ? (
                    <HealthFactorGauge value={pos.healthFactor} size="sm" showLabel={false} />
                  ) : (
                    <span className="text-xs text-text-tertiary">--</span>
                  )}
                </div>
              </td>
              <td className="px-4 text-right">
                <Badge variant="success" size="sm">{pos.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TransactionHistoryTable({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border-default bg-bg-tertiary">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default backdrop-blur">
            <th className="text-label px-4 h-10 text-left">Time</th>
            <th className="text-label px-4 h-10 text-left">Type</th>
            <th className="text-label px-4 h-10 text-left">Asset</th>
            <th className="text-label px-4 h-10 text-right">Amount</th>
            <th className="text-label px-4 h-10 text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr
              key={tx.id}
              className="border-b border-border-default last:border-b-0 h-14 hover:bg-bg-hover/50 transition-colors"
            >
              <td className="px-4">
                <span className="text-xs text-text-tertiary">{relativeTime(tx.timestamp)}</span>
              </td>
              <td className="px-4">
                <Badge variant={getTxTypeBadgeVariant(tx.type)} size="sm">
                  {getTxTypeLabel(tx.type)}
                </Badge>
              </td>
              <td className="px-4">
                <div className="flex items-center gap-2">
                  <AssetIcon symbol={tx.symbol} size="sm" />
                  <span className="font-medium text-text-primary">{tx.symbol}</span>
                </div>
              </td>
              <td className="px-4 text-right">
                <span className="font-mono text-text-primary">
                  {tx.amount.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                </span>
              </td>
              <td className="px-4 text-right">
                <Badge variant="success" size="sm">{tx.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function PortfolioPage() {
  const {
    supplyPositions,
    borrowPositions,
    secLendingDeals,
    isLoading,
    fetchPositions,
  } = usePositionStore();

  useEffect(() => {
    fetchPositions('mock');
  }, [fetchPositions]);

  // ---------- Computed values ----------

  const totalSupplied = useMemo(
    () => supplyPositions.reduce((sum, pos) => sum + pos.currentValueUSD, 0),
    [supplyPositions]
  );

  const totalBorrowed = useMemo(
    () => borrowPositions.reduce((sum, pos) => sum + pos.currentDebt, 0),
    [borrowPositions]
  );

  const totalValue = useMemo(() => totalSupplied, [totalSupplied]);

  const netAPY = 6.8; // Mock weighted average APY

  const sparklineTotalValue = useMemo(() => generateSparkline(7, 1_500_000, 30_000), []);

  // Build donut segments from all positions (supply-side values)
  const donutSegments = useMemo<DonutSegment[]>(() => {
    const assetValueMap = new Map<string, number>();

    for (const pos of supplyPositions) {
      const existing = assetValueMap.get(pos.symbol) ?? 0;
      assetValueMap.set(pos.symbol, existing + pos.currentValueUSD);
    }

    for (const pos of borrowPositions) {
      const existing = assetValueMap.get(pos.symbol) ?? 0;
      assetValueMap.set(pos.symbol, existing + pos.currentDebt);
    }

    for (const deal of secLendingDeals) {
      const existing = assetValueMap.get(deal.security.symbol) ?? 0;
      assetValueMap.set(deal.security.symbol, existing + deal.feeAccrued);
    }

    return Array.from(assetValueMap.entries()).map(([symbol, value]) => ({
      label: symbol,
      value,
      color: getAssetColor(symbol),
    }));
  }, [supplyPositions, borrowPositions, secLendingDeals]);

  const donutTotal = useMemo(
    () => donutSegments.reduce((sum, seg) => sum + seg.value, 0),
    [donutSegments]
  );

  // Build unified positions array
  const unifiedPositions = useMemo<UnifiedPosition[]>(() => {
    const result: UnifiedPosition[] = [];

    for (const pos of supplyPositions) {
      result.push({
        id: pos.positionId,
        type: 'Supply',
        symbol: pos.symbol,
        amount: pos.depositedAmount,
        valueUSD: pos.currentValueUSD,
        apyOrFee: pos.apy,
        healthFactor: undefined,
        status: 'Active',
      });
    }

    for (const pos of borrowPositions) {
      result.push({
        id: pos.positionId,
        type: 'Borrow',
        symbol: pos.symbol,
        amount: pos.borrowedAmountPrincipal,
        valueUSD: pos.currentDebt,
        apyOrFee: 0.0589, // Mock borrow APY
        healthFactor: pos.healthFactor,
        status: pos.isLiquidatable ? 'Liquidatable' : 'Active',
      });
    }

    for (const deal of secLendingDeals) {
      result.push({
        id: deal.dealId,
        type: 'SecLend',
        symbol: deal.security.symbol,
        amount: deal.security.amount,
        valueUSD: deal.feeAccrued,
        apyOrFee: 0.0045, // Mock fee as a rate
        healthFactor: undefined,
        status: deal.status,
      });
    }

    return result;
  }, [supplyPositions, borrowPositions, secLendingDeals]);

  // ---------- Render ----------

  return (
    <div className="space-y-8">
      {/* Header */}
      <h1 className="text-xl font-semibold text-text-primary tracking-tight">Portfolio</h1>

      {/* KPI Row */}
      <section>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard
            label="Total Value"
            value={totalValue}
            prefix="$"
            decimals={0}
            sparkline={sparklineTotalValue}
            trend="up"
            trendValue="+5.2%"
            loading={isLoading}
          />
          <KPICard
            label="Total Supplied"
            value={totalSupplied}
            prefix="$"
            decimals={0}
            loading={isLoading}
          />
          <KPICard
            label="Total Borrowed"
            value={totalBorrowed}
            prefix="$"
            decimals={0}
            loading={isLoading}
          />
          <KPICard
            label="Net APY"
            value={netAPY}
            suffix="%"
            decimals={1}
            loading={isLoading}
          />
        </div>
      </section>

      {/* Asset Allocation */}
      <section>
        <h2 className="text-label mb-4">Asset Allocation</h2>
        <AssetAllocation segments={donutSegments} totalValue={donutTotal} />
      </section>

      {/* All Positions */}
      <section>
        <h2 className="text-label mb-4">All Positions</h2>
        <AllPositionsTable positions={unifiedPositions} />
      </section>

      {/* Transaction History */}
      <section>
        <h2 className="text-label mb-4">Transaction History</h2>
        <TransactionHistoryTable transactions={MOCK_TRANSACTIONS} />
      </section>
    </div>
  );
}
