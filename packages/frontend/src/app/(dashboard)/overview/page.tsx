'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { KPICard } from '@/components/data-display/KPICard';
import { AssetIcon } from '@/components/data-display/AssetIcon';
import { HealthFactorGauge } from '@/components/data-display/HealthFactorGauge';
import { CreditTierBadge } from '@/components/data-display/CreditTierBadge';
import { DonutChart } from '@/components/charts/DonutChart';
import type { DonutSegment } from '@/components/charts/DonutChart';
import { Factory, Building2, ShieldCheck, Fingerprint, ArrowRight } from 'lucide-react';
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Net Worth */}
      <KPICard
        label="Net Worth"
        value={netWorth}
        prefix="$"
        decimals={2}
        trend="up"
        trendValue="+3.2%"
        sparkline={sparklineNetWorth}
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
        loading={isLoading}
      />

      {/* Health Factor */}
      <KPICard
        label="Health Factor"
        value={minHealthFactor ?? 0}
        decimals={2}
        loading={isLoading}
      />

      {/* Total Borrowed */}
      <KPICard
        label="Total Borrowed"
        value={totalBorrowed}
        prefix="$"
        decimals={2}
        sparkline={sparklineBorrowed}
        loading={isLoading}
      />

      {/* Earned (24h) */}
      <KPICard
        label="Earned (24h)"
        value={1234}
        prefix="$"
        decimals={2}
        sparkline={sparklineEarned}
        loading={isLoading}
      />

      {/* Credit Tier */}
      <KPICard
        label="Credit Tier"
        value={creditTier ?? 'Unrated'}
        loading={isLoading}
      />
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
      <div className="flex flex-col items-center gap-3 rounded-md border border-border-default bg-bg-tertiary py-12">
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
    <div className="overflow-x-auto rounded-md border border-border-default bg-bg-tertiary">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default backdrop-blur">
            <th className="text-label px-4 h-10 text-left">Asset</th>
            <th className="text-label px-4 h-10 text-left">Pool</th>
            <th className="text-label px-4 h-10 text-right">Deposited</th>
            <th className="text-label px-4 h-10 text-right">APY</th>
            <th className="text-label px-4 h-10 text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos) => (
            <tr
              key={pos.positionId}
              className="border-b border-border-default last:border-b-0 h-14 hover:bg-bg-hover/50 transition-colors"
            >
              <td className="px-4">
                <div className="flex items-center gap-2">
                  <AssetIcon symbol={pos.symbol} size="sm" />
                  <span className="font-medium text-text-primary">{pos.symbol}</span>
                </div>
              </td>
              <td className="px-4 text-text-secondary font-mono text-xs">{pos.poolId}</td>
              <td className="px-4 text-right">
                <div className="flex flex-col items-end">
                  <span className="font-mono text-text-primary">
                    {pos.depositedAmount.toLocaleString('en-US')}
                  </span>
                  <span className="text-xs text-text-tertiary">{formatUSD(pos.currentValueUSD)}</span>
                </div>
              </td>
              <td className="px-4 text-right">
                <span className="font-mono text-positive">{(pos.apy * 100).toFixed(2)}%</span>
              </td>
              <td className="px-4 text-right">
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
      <div className="flex flex-col items-center gap-3 rounded-md border border-border-default bg-bg-tertiary py-12">
        <p className="text-text-tertiary text-sm">No active borrows</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border-default bg-bg-tertiary">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default backdrop-blur">
            <th className="text-label px-4 h-10 text-left">Asset</th>
            <th className="text-label px-4 h-10 text-left">Pool</th>
            <th className="text-label px-4 h-10 text-right">Debt</th>
            <th className="text-label px-4 h-10 text-center">Health Factor</th>
            <th className="text-label px-4 h-10 text-center">Credit Tier</th>
            <th className="text-label px-4 h-10 text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos) => (
            <tr
              key={pos.positionId}
              className={cn(
                'border-b border-border-default last:border-b-0 h-14 hover:bg-bg-hover/50 transition-colors',
                pos.healthFactor < 1.2 && 'bg-negative/5'
              )}
            >
              <td className="px-4">
                <div className="flex items-center gap-2">
                  <AssetIcon symbol={pos.symbol} size="sm" />
                  <span className="font-medium text-text-primary">{pos.symbol}</span>
                </div>
              </td>
              <td className="px-4 text-text-secondary font-mono text-xs">{pos.poolId}</td>
              <td className="px-4 text-right">
                <span className="font-mono text-text-primary">
                  {formatUSD(pos.currentDebt)}
                </span>
              </td>
              <td className="px-4">
                <div className="flex justify-center">
                  <HealthFactorGauge value={pos.healthFactor} size="sm" showLabel={false} />
                </div>
              </td>
              <td className="px-4">
                <div className="flex justify-center">
                  <CreditTierBadge tier={pos.creditTier as CreditTier} size="sm" />
                </div>
              </td>
              <td className="px-4 text-right">
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
      <div className="flex flex-col items-center gap-3 rounded-md border border-border-default bg-bg-tertiary py-12">
        <p className="text-text-tertiary text-sm">No active deals</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border-default bg-bg-tertiary">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default backdrop-blur">
            <th className="text-label px-4 h-10 text-left">Security</th>
            <th className="text-label px-4 h-10 text-left">Role</th>
            <th className="text-label px-4 h-10 text-right">Fee Accrued</th>
            <th className="text-label px-4 h-10 text-center">Status</th>
            <th className="text-label px-4 h-10 text-right">Day</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => (
            <tr
              key={deal.dealId}
              className="border-b border-border-default last:border-b-0 h-14 hover:bg-bg-hover/50 transition-colors"
            >
              <td className="px-4">
                <div className="flex items-center gap-2">
                  <AssetIcon symbol={deal.security.symbol} size="sm" />
                  <span className="font-medium text-text-primary">{deal.security.symbol}</span>
                </div>
              </td>
              <td className="px-4">
                <Badge
                  variant={deal.role === 'lender' ? 'info' : 'warning'}
                  size="sm"
                >
                  {deal.role === 'lender' ? 'Lender' : 'Borrower'}
                </Badge>
              </td>
              <td className="px-4 text-right">
                <span className="font-mono text-text-primary">{formatUSD(deal.feeAccrued)}</span>
              </td>
              <td className="px-4">
                <div className="flex justify-center">
                  <Badge
                    variant={deal.status === 'Active' ? 'success' : 'default'}
                    size="sm"
                  >
                    {deal.status}
                  </Badge>
                </div>
              </td>
              <td className="px-4 text-right">
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
          centerLabel="Total Value"
          centerValue={formatUSD(totalValue)}
        />
      </div>

      {/* Summary table */}
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

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function OverviewPage() {
  const { creditTier } = useWalletStore();
  const {
    supplyPositions,
    borrowPositions,
    secLendingDeals,
    isLoading: positionsLoading,
    fetchPositions,
  } = usePositionStore();
  const { fetchPools } = useProtocolStore();

  const [positionTab, setPositionTab] = useState<'supply' | 'borrow' | 'seclend'>('supply');

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

  const POSITION_TABS = [
    { key: 'supply' as const, label: 'Supply' },
    { key: 'borrow' as const, label: 'Borrow' },
    { key: 'seclend' as const, label: 'SecLend' },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Page title */}
      <h1 className="text-xl font-semibold text-text-primary tracking-tight">Overview</h1>

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

      {/* 3. Your Positions — Tab Switcher */}
      <section className="space-y-4">
        <div className="flex items-center gap-1 border-b border-border-default">
          {POSITION_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setPositionTab(tab.key)}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                positionTab === tab.key
                  ? 'border-accent-teal text-text-primary'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {positionTab === 'supply' && (
          <SupplyPositionsTable positions={supplyPositions} isLoading={positionsLoading} />
        )}
        {positionTab === 'borrow' && (
          <BorrowPositionsTable positions={borrowPositions} isLoading={positionsLoading} />
        )}
        {positionTab === 'seclend' && (
          <SecLendingDealsTable deals={secLendingDeals} isLoading={positionsLoading} />
        )}
      </section>

      {/* 4. Portfolio Composition */}
      <section>
        <h2 className="text-label mb-4">Portfolio Composition</h2>
        <PortfolioComposition
          segments={donutSegments}
          totalValue={totalSupplied}
          isLoading={positionsLoading}
        />
      </section>

      {/* 5. Quick Access — Innovation Shortcuts */}
      <section>
        <h2 className="text-label mb-4">Explore Innovations</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/productive"
            className="group flex items-center gap-3 rounded-md border border-border-default bg-bg-tertiary p-4 transition-all duration-150 hover:border-border-medium hover:shadow-sm"
          >
            <Factory className="h-5 w-5 text-accent-teal" />
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">Productive Lending</p>
              <p className="text-xs text-text-tertiary">RWA-backed project finance</p>
            </div>
            <ArrowRight className="h-4 w-4 text-text-tertiary group-hover:text-accent-teal transition-colors" />
          </Link>

          <Link
            href="/institutional"
            className="group flex items-center gap-3 rounded-md border border-border-default bg-bg-tertiary p-4 transition-all duration-150 hover:border-border-medium hover:shadow-sm"
          >
            <Building2 className="h-5 w-5 text-accent-teal" />
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">Institutional</p>
              <p className="text-xs text-text-tertiary">KYB, API keys &amp; bulk ops</p>
            </div>
            <ArrowRight className="h-4 w-4 text-text-tertiary group-hover:text-accent-teal transition-colors" />
          </Link>

          <Link
            href="/credit/attestations"
            className="group flex items-center gap-3 rounded-md border border-border-default bg-bg-tertiary p-4 transition-all duration-150 hover:border-border-medium hover:shadow-sm"
          >
            <Fingerprint className="h-5 w-5 text-accent-teal" />
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">ZK Attestations</p>
              <p className="text-xs text-text-tertiary">Composite credit scoring</p>
            </div>
            <ArrowRight className="h-4 w-4 text-text-tertiary group-hover:text-accent-teal transition-colors" />
          </Link>

          <Link
            href="/settings/privacy"
            className="group flex items-center gap-3 rounded-md border border-border-default bg-bg-tertiary p-4 transition-all duration-150 hover:border-border-medium hover:shadow-sm"
          >
            <ShieldCheck className="h-5 w-5 text-accent-teal" />
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">Privacy Toggle</p>
              <p className="text-xs text-text-tertiary">Selective disclosure controls</p>
            </div>
            <ArrowRight className="h-4 w-4 text-text-tertiary group-hover:text-accent-teal transition-colors" />
          </Link>
        </div>
      </section>
    </div>
  );
}
