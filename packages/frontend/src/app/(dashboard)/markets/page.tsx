'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, ArrowUpDown, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { APYDisplay } from '@/components/data-display/APYDisplay';
import { AssetIcon } from '@/components/data-display/AssetIcon';
import { UtilizationBar } from '@/components/data-display/UtilizationBar';
import { useProtocolStore } from '@/stores/useProtocolStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type InstrumentFilter = 'All' | 'Stablecoin' | 'CryptoCurrency' | 'TokenizedTreasury' | 'TokenizedEquity';
type SortKey = 'tvl' | 'supplyAPY' | 'borrowAPY' | 'utilization' | 'symbol' | 'totalBorrows' | 'priceUSD';
type SortDir = 'asc' | 'desc';

interface ColumnDef {
  label: string;
  key: SortKey;
  align: 'left' | 'right' | 'center';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INSTRUMENT_OPTIONS: InstrumentFilter[] = [
  'All',
  'Stablecoin',
  'CryptoCurrency',
  'TokenizedTreasury',
  'TokenizedEquity',
];

const SORT_OPTIONS: Array<{ label: string; value: SortKey }> = [
  { label: 'TVL', value: 'tvl' },
  { label: 'Supply APY', value: 'supplyAPY' },
  { label: 'Borrow APY', value: 'borrowAPY' },
  { label: 'Utilization', value: 'utilization' },
];

const COLUMNS: ColumnDef[] = [
  { label: 'Asset', key: 'symbol', align: 'left' },
  { label: 'Total Supply', key: 'tvl', align: 'right' },
  { label: 'Supply APY', key: 'supplyAPY', align: 'right' },
  { label: 'Total Borrow', key: 'totalBorrows', align: 'right' },
  { label: 'Borrow APY', key: 'borrowAPY', align: 'right' },
  { label: 'Utilization', key: 'utilization', align: 'center' },
  { label: 'Price', key: 'priceUSD', align: 'right' },
];

const SKELETON_ROWS = 6;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatUSD(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  if (abs >= 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(4)}`;
}

function formatPrice(value: number): string {
  if (value >= 10_000) return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (value >= 1) return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${value.toFixed(4)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MarketsPage() {
  const router = useRouter();
  const { pools, isLoading, fetchPools } = useProtocolStore();

  const [instrumentFilter, setInstrumentFilter] = useState<InstrumentFilter>('All');
  const [sortKey, setSortKey] = useState<SortKey>('tvl');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  const handleColumnSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
        return prev;
      }
      setSortDir('desc');
      return key;
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    setInstrumentFilter('All');
    setSortKey('tvl');
    setSortDir('desc');
  }, []);

  const handleRowClick = useCallback(
    (poolId: string) => {
      router.push(`/markets/${poolId}`);
    },
    [router],
  );

  const handleActionClick = useCallback(
    (e: React.MouseEvent, poolId: string) => {
      e.stopPropagation();
      router.push(`/markets/${poolId}`);
    },
    [router],
  );

  const getSortValue = useCallback((pool: (typeof pools)[number], key: SortKey): number | string => {
    switch (key) {
      case 'tvl':
        return pool.totalDeposits * pool.priceUSD;
      case 'supplyAPY':
        return pool.supplyAPY;
      case 'borrowAPY':
        return pool.borrowAPY;
      case 'utilization':
        return pool.utilization;
      case 'symbol':
        return pool.symbol;
      case 'totalBorrows':
        return pool.totalBorrows * pool.priceUSD;
      case 'priceUSD':
        return pool.priceUSD;
    }
  }, []);

  const filteredAndSorted = useMemo(() => {
    let result = [...pools];

    // Filter by instrument type
    if (instrumentFilter !== 'All') {
      result = result.filter((p) => p.instrumentType === instrumentFilter);
    }

    // Sort
    result.sort((a, b) => {
      const valA = getSortValue(a, sortKey);
      const valB = getSortValue(b, sortKey);

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      const numA = valA as number;
      const numB = valB as number;
      return sortDir === 'asc' ? numA - numB : numB - numA;
    });

    return result;
  }, [pools, instrumentFilter, sortKey, sortDir, getSortValue]);

  // Compute total TVL
  const totalTVL = useMemo(() => {
    return pools.reduce((sum, pool) => sum + pool.totalDeposits * pool.priceUSD, 0);
  }, [pools]);

  const formatTVL = (value: number): string => {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    return `$${(value / 1_000).toFixed(0)}K`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Row with filters inline */}
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-xl font-semibold text-text-primary tracking-tight">Markets</h1>
        <span className="text-sm text-text-tertiary font-mono">TVL {formatTVL(totalTVL)}</span>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          <select
            value={instrumentFilter}
            onChange={(e) => setInstrumentFilter(e.target.value as InstrumentFilter)}
            className="h-9 rounded-md border border-border-default bg-bg-tertiary px-3 text-sm text-text-primary focus:border-border-focus focus:outline-none"
          >
            {INSTRUMENT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === 'All' ? 'All Types' : opt.replace(/([A-Z])/g, ' $1').trim()}
              </option>
            ))}
          </select>

          <select
            value={sortKey}
            onChange={(e) => {
              setSortKey(e.target.value as SortKey);
              setSortDir('desc');
            }}
            className="h-9 rounded-md border border-border-default bg-bg-tertiary px-3 text-sm text-text-primary focus:border-border-focus focus:outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Sort: {opt.label}
              </option>
            ))}
          </select>

          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={handleResetFilters}
          >
            Reset
          </Button>

          <Button
            variant="ghost"
            size="sm"
            icon={<Zap className="h-4 w-4" />}
          >
            Flash Loan
          </Button>
        </div>
      </div>

      {/* Markets Table */}
      <div className="overflow-x-auto rounded-md border border-border-default bg-bg-tertiary">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-default backdrop-blur">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleColumnSort(col.key)}
                  className={cn(
                    'text-label px-4 h-10 cursor-pointer select-none transition-colors hover:text-text-secondary',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      <ArrowUpDown className="h-3 w-3 text-accent-teal" />
                    )}
                  </span>
                </th>
              ))}
              <th className="text-label px-4 h-10 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <tr key={i} className="border-b border-border-subtle">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Skeleton variant="circle" width={20} height={20} />
                        <Skeleton variant="rect" width={80} height={16} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Skeleton variant="rect" width={72} height={16} className="ml-auto" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Skeleton variant="rect" width={56} height={16} className="ml-auto" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Skeleton variant="rect" width={72} height={16} className="ml-auto" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Skeleton variant="rect" width={56} height={16} className="ml-auto" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton variant="rect" width={100} height={16} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Skeleton variant="rect" width={64} height={16} className="ml-auto" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Skeleton variant="rect" width={56} height={32} />
                        <Skeleton variant="rect" width={56} height={32} />
                      </div>
                    </td>
                  </tr>
                ))
              : filteredAndSorted.map((pool) => (
                  <tr
                    key={pool.poolId}
                    onClick={() => handleRowClick(pool.poolId)}
                    className="border-b border-border-subtle h-14 transition-colors hover:bg-bg-hover/50 cursor-pointer"
                  >
                    {/* Asset */}
                    <td className="px-4">
                      <div className="flex items-center gap-2">
                        <AssetIcon symbol={pool.symbol} size="sm" />
                        <span className="font-medium text-text-primary">{pool.symbol}</span>
                        <Badge variant="default" size="sm">
                          {pool.instrumentType}
                        </Badge>
                      </div>
                    </td>

                    {/* Total Supply */}
                    <td className="px-4 text-right font-mono tabular-nums text-text-primary">
                      {formatUSD(pool.totalDeposits * pool.priceUSD)}
                    </td>

                    {/* Supply APY */}
                    <td className="px-4 text-right">
                      <APYDisplay value={pool.supplyAPY} size="sm" />
                    </td>

                    {/* Total Borrow */}
                    <td className="px-4 text-right font-mono tabular-nums text-text-primary">
                      {formatUSD(pool.totalBorrows * pool.priceUSD)}
                    </td>

                    {/* Borrow APY */}
                    <td className="px-4 text-right">
                      <APYDisplay value={pool.borrowAPY} size="sm" />
                    </td>

                    {/* Utilization */}
                    <td className="px-4">
                      <UtilizationBar value={pool.utilization} />
                    </td>

                    {/* Price */}
                    <td className="px-4 text-right font-mono tabular-nums text-text-primary">
                      {formatPrice(pool.priceUSD)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => handleActionClick(e, pool.poolId)}
                        >
                          Supply
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => handleActionClick(e, pool.poolId)}
                        >
                          Borrow
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {/* Empty state */}
        {!isLoading && filteredAndSorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
            <p className="text-sm">No markets found for the selected filter.</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={handleResetFilters}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
