'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Wallet, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Input } from '@/components/ui/Input';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/Dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { AssetIcon } from '@/components/data-display/AssetIcon';
import { UtilizationBar } from '@/components/data-display/UtilizationBar';
import { AreaChart, type TimeRange } from '@/components/charts/AreaChart';
import { InterestRateChart } from '@/components/charts/InterestRateChart';
import { useProtocolStore } from '@/stores/useProtocolStore';
import { useWalletStore } from '@/stores/useWalletStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MockDataPoint {
  date: string;
  value: number;
  [key: string]: unknown;
}

interface ActivityEvent {
  time: string;
  action: 'deposit' | 'withdraw' | 'borrow' | 'repay';
  user: string;
  amount: string;
}

type ChartTab = 'supplyAPY' | 'borrowAPY' | 'utilization' | 'tvl';

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

function generateMockData(baseValue: number, variance: number, count: number): MockDataPoint[] {
  const data: MockDataPoint[] = [];
  const now = Date.now();
  const dayMs = 86_400_000;

  for (let i = 0; i < count; i++) {
    const date = new Date(now - (count - 1 - i) * dayMs);
    const trend = (i / count) * variance * 0.3;
    const noise = (Math.random() - 0.5) * variance;
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Number((baseValue + trend + noise).toFixed(4)),
    });
  }

  return data;
}

const ACTION_BADGE_VARIANT: Record<ActivityEvent['action'], 'success' | 'warning' | 'danger' | 'info'> = {
  deposit: 'success',
  withdraw: 'warning',
  borrow: 'info',
  repay: 'success',
};

// ─── Mock Activity Data ───────────────────────────────────────────────────────

const MOCK_ACTIVITIES: ActivityEvent[] = [
  { time: '2 min ago', action: 'deposit', user: '0x1a2B...9cDe', amount: '$125,000' },
  { time: '8 min ago', action: 'borrow', user: '0x3f4E...7bAc', amount: '$89,500' },
  { time: '15 min ago', action: 'repay', user: '0x5d6C...1eF0', amount: '$45,200' },
  { time: '23 min ago', action: 'withdraw', user: '0x7h8G...3kLm', amount: '$200,000' },
  { time: '1 hr ago', action: 'deposit', user: '0x9n0P...5qRs', amount: '$550,000' },
  { time: '2 hr ago', action: 'borrow', user: '0xBt2U...7vWx', amount: '$312,000' },
  { time: '3 hr ago', action: 'deposit', user: '0xDy4Z...9aBC', amount: '$78,400' },
  { time: '5 hr ago', action: 'repay', user: '0xFe6G...1hIj', amount: '$1,250,000' },
];

// ─── Collateral Params ────────────────────────────────────────────────────────

const COLLATERAL_PARAMS: Array<{ label: string; value: string }> = [
  { label: 'Max LTV', value: '80%' },
  { label: 'Liquidation Threshold', value: '85%' },
  { label: 'Liquidation Penalty', value: '5%' },
  { label: 'Borrow Cap', value: 'Unlimited' },
  { label: 'Reserve Factor', value: '1.0%' },
];

// ─── Interest Rate Params ─────────────────────────────────────────────────────

const IR_PARAMS = {
  baseRate: 0.02,
  multiplier: 0.15,
  kink: 0.8,
  jumpMultiplier: 0.8,
};

const IR_TABLE: Array<{ label: string; value: string }> = [
  { label: 'Base Rate', value: '2.00%' },
  { label: 'Multiplier', value: '0.15' },
  { label: 'Kink', value: '80%' },
  { label: 'Jump Multiplier', value: '0.80' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function PoolDetailPage() {
  const router = useRouter();
  const params = useParams();
  const poolId = params.poolId as string;

  const { pools, isLoading, fetchPools } = useProtocolStore();
  const { isConnected } = useWalletStore();

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [chartTab, setChartTab] = useState<ChartTab>('supplyAPY');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  const pool = useMemo(
    () => pools.find((p) => p.poolId === poolId),
    [pools, poolId],
  );

  const availableLiquidity = useMemo(() => {
    if (!pool) return 0;
    return pool.totalDeposits - pool.totalBorrows;
  }, [pool]);

  const chartData = useMemo(() => {
    if (!pool) return [];

    switch (chartTab) {
      case 'supplyAPY':
        return generateMockData(pool.supplyAPY * 100, 1.5, 30);
      case 'borrowAPY':
        return generateMockData(pool.borrowAPY * 100, 2.0, 30);
      case 'utilization':
        return generateMockData(pool.utilization * 100, 8, 30);
      case 'tvl':
        return generateMockData(pool.totalDeposits * pool.priceUSD, pool.totalDeposits * pool.priceUSD * 0.05, 30);
    }
  }, [pool, chartTab]);

  const chartColor = useMemo(() => {
    switch (chartTab) {
      case 'supplyAPY':
        return '#00D4AA';
      case 'borrowAPY':
        return '#6366F1';
      case 'utilization':
        return '#F59E0B';
      case 'tvl':
        return '#3B82F6';
    }
  }, [chartTab]);

  const estimatedShares = useMemo(() => {
    const parsed = parseFloat(depositAmount);
    if (Number.isNaN(parsed) || parsed <= 0 || !pool) return 0;
    // Simplified: 1:1 share ratio for display
    return parsed;
  }, [depositAmount, pool]);

  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
  }, []);

  // ─── Loading State ────────────────────────────────────────────────────────

  if (isLoading && pools.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton variant="rect" width={200} height={24} />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Skeleton variant="rect" height={280} />
          <Skeleton variant="rect" height={280} />
        </div>
        <Skeleton variant="rect" height={400} />
      </div>
    );
  }

  // ─── Not Found ────────────────────────────────────────────────────────────

  if (!pool) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <h2 className="text-xl font-semibold text-text-primary">Pool not found</h2>
        <p className="text-sm text-text-tertiary">
          The pool &quot;{poolId}&quot; does not exist or is not active.
        </p>
        <Button variant="secondary" size="sm" onClick={() => router.push('/markets')}>
          Back to Markets
        </Button>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => router.push('/markets')}
          className="inline-flex items-center gap-1 text-text-tertiary transition-colors hover:text-text-primary"
        >
          <ChevronLeft className="h-4 w-4" />
          Markets
        </button>
        <span className="text-text-tertiary">/</span>
        <span className="font-medium text-text-primary">{pool.symbol}</span>
      </div>

      {/* ── Row 1: Overview + Position ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Pool Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <AssetIcon symbol={pool.symbol} size="md" />
                {pool.symbol}
                <Badge variant="outline" size="sm">
                  {pool.instrumentType}
                </Badge>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {/* Total Supply */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-text-tertiary">Total Supply</span>
                <span className="font-mono text-sm font-semibold tabular-nums text-text-primary">
                  {formatUSD(pool.totalDeposits * pool.priceUSD)}
                </span>
              </div>

              {/* Total Borrow */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-text-tertiary">Total Borrow</span>
                <span className="font-mono text-sm font-semibold tabular-nums text-text-primary">
                  {formatUSD(pool.totalBorrows * pool.priceUSD)}
                </span>
              </div>

              {/* Available Liquidity */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-text-tertiary">Available Liquidity</span>
                <span className="font-mono text-sm font-semibold tabular-nums text-text-primary">
                  {formatUSD(availableLiquidity * pool.priceUSD)}
                </span>
              </div>

              {/* Utilization */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-text-tertiary">Utilization</span>
                <UtilizationBar value={pool.utilization} size="md" />
              </div>

              {/* Oracle Price */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-text-tertiary">Oracle Price</span>
                <span className="inline-flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold tabular-nums text-text-primary">
                    {formatPrice(pool.priceUSD)}
                  </span>
                  <Badge variant="info" size="sm">Oracle</Badge>
                </span>
              </div>

              {/* Reserve Factor */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-text-tertiary">Reserve Factor</span>
                <span className="font-mono text-sm font-semibold tabular-nums text-text-primary">
                  1.0%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Your Position Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Position</CardTitle>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                <Wallet className="h-8 w-8 text-text-tertiary" />
                <p className="text-sm text-text-secondary">
                  Connect wallet to see your position
                </p>
                <Button variant="primary" size="sm" icon={<Wallet className="h-4 w-4" />}>
                  Connect Wallet
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                <p className="text-sm text-text-secondary">
                  You haven&apos;t deposited in this pool yet
                </p>
                <div className="flex items-center gap-3">
                  {/* Deposit Dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<ArrowDownToLine className="h-4 w-4" />}
                      >
                        Deposit
                      </Button>
                    </DialogTrigger>
                    <DialogContent size="sm">
                      <DialogHeader>
                        <DialogTitle>Deposit {pool.symbol}</DialogTitle>
                        <DialogDescription>
                          Supply {pool.symbol} to earn {(pool.supplyAPY * 100).toFixed(2)}% APY.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="flex flex-col gap-4">
                        <Input
                          label="Amount"
                          type="number"
                          placeholder="0.00"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          iconRight={
                            <button
                              onClick={() => setDepositAmount('10000')}
                              className="text-xs font-medium text-accent-teal hover:text-accent-teal-hover"
                            >
                              Max
                            </button>
                          }
                        />

                        <div className="flex items-center justify-between rounded-sm bg-bg-tertiary px-3 py-2 text-sm">
                          <span className="text-text-tertiary">You will receive</span>
                          <span className="font-mono tabular-nums text-text-primary">
                            ~{estimatedShares.toLocaleString('en-US', { maximumFractionDigits: 2 })} shares
                          </span>
                        </div>
                      </div>

                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="ghost" size="sm">Cancel</Button>
                        </DialogClose>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={estimatedShares <= 0}
                        >
                          Confirm Deposit
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Withdraw Dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<ArrowUpFromLine className="h-4 w-4" />}
                      >
                        Withdraw
                      </Button>
                    </DialogTrigger>
                    <DialogContent size="sm">
                      <DialogHeader>
                        <DialogTitle>Withdraw {pool.symbol}</DialogTitle>
                        <DialogDescription>
                          Withdraw your supplied {pool.symbol} from this pool.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="flex flex-col gap-4">
                        <Input
                          label="Amount"
                          type="number"
                          placeholder="0.00"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          iconRight={
                            <button
                              onClick={() => setWithdrawAmount('0')}
                              className="text-xs font-medium text-accent-teal hover:text-accent-teal-hover"
                            >
                              Max
                            </button>
                          }
                        />

                        <div className="flex items-center justify-between rounded-sm bg-bg-tertiary px-3 py-2 text-sm">
                          <span className="text-text-tertiary">Available to withdraw</span>
                          <span className="font-mono tabular-nums text-text-primary">
                            0.00 {pool.symbol}
                          </span>
                        </div>
                      </div>

                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="ghost" size="sm">Cancel</Button>
                        </DialogClose>
                        <Button variant="primary" size="sm" disabled>
                          Confirm Withdraw
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 2: Charts ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={chartTab}
            onValueChange={(v) => setChartTab(v as ChartTab)}
          >
            <TabsList>
              <TabsTrigger value="supplyAPY">Supply APY</TabsTrigger>
              <TabsTrigger value="borrowAPY">Borrow APY</TabsTrigger>
              <TabsTrigger value="utilization">Utilization</TabsTrigger>
              <TabsTrigger value="tvl">TVL</TabsTrigger>
            </TabsList>

            <TabsContent value="supplyAPY">
              <AreaChart
                data={chartData as Array<Record<string, unknown>>}
                xKey="date"
                yKey="value"
                color={chartColor}
                height={320}
                timeRange={timeRange}
                onTimeRangeChange={handleTimeRangeChange}
              />
            </TabsContent>

            <TabsContent value="borrowAPY">
              <AreaChart
                data={chartData as Array<Record<string, unknown>>}
                xKey="date"
                yKey="value"
                color={chartColor}
                height={320}
                timeRange={timeRange}
                onTimeRangeChange={handleTimeRangeChange}
              />
            </TabsContent>

            <TabsContent value="utilization">
              <AreaChart
                data={chartData as Array<Record<string, unknown>>}
                xKey="date"
                yKey="value"
                color={chartColor}
                height={320}
                timeRange={timeRange}
                onTimeRangeChange={handleTimeRangeChange}
              />
            </TabsContent>

            <TabsContent value="tvl">
              <AreaChart
                data={chartData as Array<Record<string, unknown>>}
                xKey="date"
                yKey="value"
                color={chartColor}
                height={320}
                timeRange={timeRange}
                onTimeRangeChange={handleTimeRangeChange}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ── Row 3: Interest Rate Model + Collateral Params ─────────────────── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Interest Rate Model Card */}
        <Card>
          <CardHeader>
            <CardTitle>Interest Rate Model</CardTitle>
          </CardHeader>
          <CardContent>
            <InterestRateChart
              baseRate={IR_PARAMS.baseRate}
              multiplier={IR_PARAMS.multiplier}
              kink={IR_PARAMS.kink}
              jumpMultiplier={IR_PARAMS.jumpMultiplier}
              currentUtilization={pool.utilization}
              height={280}
            />
            <div className="mt-4 flex flex-col gap-2">
              {IR_TABLE.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-text-tertiary">{row.label}</span>
                  <span className="font-mono tabular-nums text-text-primary">{row.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Collateral Parameters Card */}
        <Card>
          <CardHeader>
            <CardTitle>Collateral Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {COLLATERAL_PARAMS.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-text-tertiary">{row.label}</span>
                  <span className="font-mono tabular-nums text-text-primary">{row.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: Recent Activity ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    Time
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    Action
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    User
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {MOCK_ACTIVITIES.map((event, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border-subtle transition-colors hover:bg-bg-hover"
                  >
                    <td className="px-4 py-2 text-sm text-text-secondary">
                      {event.time}
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant={ACTION_BADGE_VARIANT[event.action]} size="sm">
                        {event.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 font-mono text-sm text-text-secondary">
                      {event.user}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-sm tabular-nums text-text-primary">
                      {event.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
