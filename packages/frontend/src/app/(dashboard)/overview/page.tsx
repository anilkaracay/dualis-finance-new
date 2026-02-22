'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  Heart,
  ArrowDownCircle,
  Sparkles,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { KPICard } from '@/components/data-display/KPICard';
import { HealthFactorGauge } from '@/components/data-display/HealthFactorGauge';
import { AssetIcon } from '@/components/data-display/AssetIcon';
import { CreditTierBadge } from '@/components/data-display/CreditTierBadge';
import { DonutChart } from '@/components/charts/DonutChart';
import type { DonutSegment } from '@/components/charts/DonutChart';
import { useWalletStore } from '@/stores/useWalletStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useProtocolStore } from '@/stores/useProtocolStore';
import type { CreditTier } from '@dualis/shared';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ASSET_COLORS: Record<string, string> = {
  USDC: '#2775CA',
  'T-BILL-2026': '#10B981',
  ETH: '#627EEA',
  wBTC: '#F7931A',
  CC: '#8B5CF6',
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

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function daysElapsed(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/** Generate a simple mock sparkline with n data points */
function generateSparkline(n: number, base: number, variance: number): number[] {
  const points: number[] = [];
  let current = base;
  for (let i = 0; i < n; i++) {
    current = current + (Math.sin(i * 1.3) * variance + variance * 0.2);
    points.push(Math.round(current * 100) / 100);
  }
  return points;
}

// ---------------------------------------------------------------------------
// Section: Welcome Header
// ---------------------------------------------------------------------------

function WelcomeHeader({
  isConnected,
  walletAddress,
}: {
  isConnected: boolean;
  walletAddress: string | null;
}) {
  const now = new Date();

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
          {isConnected && walletAddress
            ? `Welcome back, ${truncateAddress(walletAddress)}`
            : 'Connect wallet to get started'}
        </h1>
        <p className="mt-1 text-sm text-text-tertiary">{formatDate(now)}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: KPI Grid
// ---------------------------------------------------------------------------

interface KPIGridProps {
  netWorth: number;
  totalSupplied: number;
  minHealthFactor: number | undefined;
  totalBorrowed: number;
  creditTier: CreditTier | null;
  isLoading: boolean;
}

function KPIGrid({
  netWorth,
  totalSupplied,
  minHealthFactor,
  totalBorrowed,
  creditTier,
  isLoading,
}: KPIGridProps) {
  const sparklineNetWorth = useMemo(() => generateSparkline(7, 40, 4), []);
  const sparklineSupplied = useMemo(() => generateSparkline(7, 45, 3), []);
  const sparklineBorrowed = useMemo(() => generateSparkline(7, 30, 5), []);
  const sparklineEarned = useMemo(() => generateSparkline(7, 20, 2), []);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Net Worth */}
      <KPICard
        label="Net Worth"
        value={netWorth}
        prefix="$"
        decimals={2}
        trend="up"
        trendValue="+3.2%"
        sparkline={sparklineNetWorth}
        icon={<DollarSign className="h-4 w-4" />}
        loading={isLoading}
      />

      {/* Total Supplied */}
      <KPICard
        label="Total Supplied"
        value={totalSupplied}
        prefix="$"
        decimals={2}
        trend="up"
        trendValue="+3.2%"
        sparkline={sparklineSupplied}
        icon={<TrendingUp className="h-4 w-4" />}
        loading={isLoading}
      />

      {/* Health Factor — custom card with gauge */}
      {isLoading ? (
        <div className="rounded-md bg-surface-card border border-border-default p-6">
          <Skeleton variant="rect" height={14} width="40%" />
          <Skeleton variant="rect" height={80} width="80%" className="mt-3" />
        </div>
      ) : (
        <div className="rounded-md bg-surface-card border border-border-default p-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 self-start">
            <span className="text-text-tertiary">
              <Heart className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium uppercase tracking-wide text-text-secondary">
              Health Factor
            </span>
          </div>
          {minHealthFactor !== undefined ? (
            <HealthFactorGauge value={minHealthFactor} size="md" animated />
          ) : (
            <span className="text-text-tertiary text-sm">No borrows</span>
          )}
        </div>
      )}

      {/* Total Borrowed */}
      <KPICard
        label="Total Borrowed"
        value={totalBorrowed}
        prefix="$"
        decimals={2}
        sparkline={sparklineBorrowed}
        icon={<ArrowDownCircle className="h-4 w-4" />}
        loading={isLoading}
      />

      {/* Earned (24h) */}
      <KPICard
        label="Earned (24h)"
        value={1234}
        prefix="$"
        decimals={2}
        sparkline={sparklineEarned}
        icon={<Sparkles className="h-4 w-4" />}
        loading={isLoading}
      />

      {/* Credit Tier — custom card */}
      {isLoading ? (
        <div className="rounded-md bg-surface-card border border-border-default p-6">
          <Skeleton variant="rect" height={14} width="40%" />
          <Skeleton variant="rect" height={36} width="50%" className="mt-3" />
        </div>
      ) : (
        <div className="rounded-md bg-surface-card border border-border-default p-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 self-start">
            <span className="text-text-tertiary">
              <Star className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium uppercase tracking-wide text-text-secondary">
              Credit Tier
            </span>
          </div>
          {creditTier ? (
            <CreditTierBadge tier={creditTier} size="lg" />
          ) : (
            <span className="text-text-tertiary text-sm">Not rated</span>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Supply Positions Table
// ---------------------------------------------------------------------------

function SupplyPositionsTable({
  positions,
  isLoading,
}: {
  positions: ReturnType<typeof usePositionStore.getState>['supplyPositions'];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="rect" height={48} width="100%" />
        ))}
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-border-default bg-surface-card py-12">
        <p className="text-text-tertiary text-sm">No supply positions yet</p>
        <Link
          href="/markets"
          className="text-sm font-medium text-accent-primary hover:text-accent-hover transition-colors"
        >
          Go to Markets &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border-default bg-surface-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default">
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Asset</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Pool</th>
            <th className="px-4 py-3 text-right font-medium text-text-secondary">Deposited</th>
            <th className="px-4 py-3 text-right font-medium text-text-secondary">APY</th>
            <th className="px-4 py-3 text-right font-medium text-text-secondary">Status</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos) => (
            <tr
              key={pos.positionId}
              className="border-b border-border-default last:border-b-0 hover:bg-bg-hover transition-colors"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <AssetIcon symbol={pos.symbol} size="sm" />
                  <span className="font-medium text-text-primary">{pos.symbol}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-text-secondary font-mono text-xs">{pos.poolId}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex flex-col items-end">
                  <span className="font-mono text-text-primary">
                    {pos.depositedAmount.toLocaleString('en-US')}
                  </span>
                  <span className="text-xs text-text-tertiary">{formatUSD(pos.currentValueUSD)}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-mono text-positive">{(pos.apy * 100).toFixed(2)}%</span>
              </td>
              <td className="px-4 py-3 text-right">
                <Badge variant="success" size="sm">Active</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Borrow Positions Table
// ---------------------------------------------------------------------------

function BorrowPositionsTable({
  positions,
  isLoading,
}: {
  positions: ReturnType<typeof usePositionStore.getState>['borrowPositions'];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} variant="rect" height={48} width="100%" />
        ))}
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-border-default bg-surface-card py-12">
        <p className="text-text-tertiary text-sm">No active borrows</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border-default bg-surface-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default">
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Asset</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Pool</th>
            <th className="px-4 py-3 text-right font-medium text-text-secondary">Debt</th>
            <th className="px-4 py-3 text-center font-medium text-text-secondary">Health Factor</th>
            <th className="px-4 py-3 text-center font-medium text-text-secondary">Credit Tier</th>
            <th className="px-4 py-3 text-right font-medium text-text-secondary">Status</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos) => (
            <tr
              key={pos.positionId}
              className={cn(
                'border-b border-border-default last:border-b-0 hover:bg-bg-hover transition-colors',
                pos.healthFactor < 1.2 && 'bg-negative/5'
              )}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <AssetIcon symbol={pos.symbol} size="sm" />
                  <span className="font-medium text-text-primary">{pos.symbol}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-text-secondary font-mono text-xs">{pos.poolId}</td>
              <td className="px-4 py-3 text-right">
                <span className="font-mono text-text-primary">
                  {formatUSD(pos.currentDebt)}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-center">
                  <HealthFactorGauge value={pos.healthFactor} size="sm" showLabel={false} />
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-center">
                  <CreditTierBadge tier={pos.creditTier as CreditTier} size="sm" />
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                {pos.isLiquidatable ? (
                  <Badge variant="danger" size="sm">Liquidatable</Badge>
                ) : (
                  <Badge variant="success" size="sm">Active</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Sec Lending Deals Table
// ---------------------------------------------------------------------------

function SecLendingDealsTable({
  deals,
  isLoading,
}: {
  deals: ReturnType<typeof usePositionStore.getState>['secLendingDeals'];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 1 }).map((_, i) => (
          <Skeleton key={i} variant="rect" height={48} width="100%" />
        ))}
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-border-default bg-surface-card py-12">
        <p className="text-text-tertiary text-sm">No active deals</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border-default bg-surface-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default">
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Security</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Role</th>
            <th className="px-4 py-3 text-right font-medium text-text-secondary">Fee Accrued</th>
            <th className="px-4 py-3 text-center font-medium text-text-secondary">Status</th>
            <th className="px-4 py-3 text-right font-medium text-text-secondary">Day</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => (
            <tr
              key={deal.dealId}
              className="border-b border-border-default last:border-b-0 hover:bg-bg-hover transition-colors"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <AssetIcon symbol={deal.security.symbol} size="sm" />
                  <span className="font-medium text-text-primary">{deal.security.symbol}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant={deal.role === 'lender' ? 'info' : 'warning'}
                  size="sm"
                >
                  {deal.role === 'lender' ? 'Lender' : 'Borrower'}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-mono text-text-primary">{formatUSD(deal.feeAccrued)}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-center">
                  <Badge
                    variant={deal.status === 'Active' ? 'success' : 'default'}
                    size="sm"
                  >
                    {deal.status}
                  </Badge>
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-mono text-text-secondary">
                  {daysElapsed(deal.startDate)}d
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Portfolio Composition
// ---------------------------------------------------------------------------

interface PortfolioCompositionProps {
  segments: DonutSegment[];
  totalValue: number;
  isLoading: boolean;
}

function PortfolioComposition({ segments, totalValue, isLoading }: PortfolioCompositionProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex-1 flex items-center justify-center">
          <Skeleton variant="circle" width={200} height={200} />
        </div>
        <div className="w-full md:w-80 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rect" height={36} width="100%" />
          ))}
        </div>
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-md border border-border-default bg-surface-card py-12">
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
          size={220}
          centerLabel="Total Value"
          centerValue={formatUSD(totalValue)}
        />
      </div>

      {/* Summary table */}
      <div className="w-full md:w-80">
        <div className="overflow-hidden rounded-md border border-border-default bg-surface-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default">
                <th className="px-4 py-2.5 text-left font-medium text-text-secondary">Asset</th>
                <th className="px-4 py-2.5 text-right font-medium text-text-secondary">Value</th>
                <th className="px-4 py-2.5 text-right font-medium text-text-secondary">%</th>
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

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function OverviewPage() {
  const { isConnected, walletAddress, creditTier } = useWalletStore();
  const {
    supplyPositions,
    borrowPositions,
    secLendingDeals,
    isLoading: positionsLoading,
    fetchPositions,
  } = usePositionStore();
  const { fetchPools } = useProtocolStore();

  useEffect(() => {
    fetchPositions('mock');
    fetchPools();
  }, [fetchPositions, fetchPools]);

  // ---------- Computed values ----------

  const netWorth = useMemo(
    () => supplyPositions.reduce((sum, pos) => sum + pos.currentValueUSD, 0),
    [supplyPositions]
  );

  const totalSupplied = useMemo(
    () => supplyPositions.reduce((sum, pos) => sum + pos.currentValueUSD, 0),
    [supplyPositions]
  );

  const totalBorrowed = useMemo(
    () => borrowPositions.reduce((sum, pos) => sum + pos.currentDebt, 0),
    [borrowPositions]
  );

  const minHealthFactor = useMemo<number | undefined>(() => {
    if (borrowPositions.length === 0) return undefined;
    return borrowPositions.reduce(
      (min, pos) => Math.min(min, pos.healthFactor),
      borrowPositions[0]!.healthFactor
    );
  }, [borrowPositions]);

  const donutSegments = useMemo<DonutSegment[]>(
    () =>
      supplyPositions.map((pos) => ({
        label: pos.symbol,
        value: pos.currentValueUSD,
        color: getAssetColor(pos.symbol),
      })),
    [supplyPositions]
  );

  // ---------- Render ----------

  return (
    <div className="space-y-12">
      {/* 1. Welcome Header */}
      <WelcomeHeader isConnected={isConnected} walletAddress={walletAddress} />

      {/* 2. KPI Grid */}
      <section>
        <KPIGrid
          netWorth={netWorth}
          totalSupplied={totalSupplied}
          minHealthFactor={minHealthFactor}
          totalBorrowed={totalBorrowed}
          creditTier={creditTier}
          isLoading={positionsLoading}
        />
      </section>

      {/* 3. Your Positions */}
      <section className="space-y-10">
        <div>
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Supply Positions</h2>
          <SupplyPositionsTable positions={supplyPositions} isLoading={positionsLoading} />
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Borrow Positions</h2>
          <BorrowPositionsTable positions={borrowPositions} isLoading={positionsLoading} />
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Securities Lending Deals</h2>
          <SecLendingDealsTable deals={secLendingDeals} isLoading={positionsLoading} />
        </div>
      </section>

      {/* 4. Portfolio Composition */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Portfolio Composition</h2>
        <PortfolioComposition
          segments={donutSegments}
          totalValue={totalSupplied}
          isLoading={positionsLoading}
        />
      </section>
    </div>
  );
}
