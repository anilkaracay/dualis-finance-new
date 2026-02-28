'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Wallet, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Input } from '@/components/ui/Input';
import { TransactionError } from '@/components/feedback/TransactionError';
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
import { Loader2 } from 'lucide-react';
import { useProtocolStore } from '@/stores/useProtocolStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { useBalanceStore } from '@/stores/useBalanceStore';
import { useTokenBalanceStore } from '@/stores/useTokenBalanceStore';
import { usePartyLayer } from '@/hooks/usePartyLayer';
import { useWalletOperation } from '@/hooks/useWalletOperation';
import { useOperatorParty } from '@/hooks/useOperatorParty';
import { mapPoolToCanton } from '@dualis/shared';
import { ENDPOINTS } from '@/lib/api/endpoints';

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

// ─── Pool-specific params — fetched from API at runtime ───────────────────────

interface PoolDetailParams {
  interestRateModel: {
    type: string;
    baseRate: number;
    multiplier: number;
    kink: number;
    jumpMultiplier: number;
  };
  collateralConfig: {
    loanToValue: number;
    liquidationThreshold: number;
    liquidationPenalty: number;
    borrowCap: number;
  };
}

const DEFAULT_DETAIL_PARAMS: PoolDetailParams = {
  interestRateModel: { type: 'VariableRate', baseRate: 0.02, multiplier: 0.15, kink: 0.8, jumpMultiplier: 0.8 },
  collateralConfig: { loanToValue: 0.80, liquidationThreshold: 0.85, liquidationPenalty: 0.05, borrowCap: 0 },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PoolDetailPage() {
  const router = useRouter();
  const params = useParams();
  const poolId = params.poolId as string;

  const { pools, isLoading, fetchPools } = useProtocolStore();
  const { isConnected, party: storeParty } = useWalletStore();
  const { fetchBalances } = useBalanceStore();
  const { fetchTokenBalances, getBalanceForSymbol } = useTokenBalanceStore();

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [chartTab, setChartTab] = useState<ChartTab>('supplyAPY');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [depositStep, setDepositStep] = useState<'input' | 'confirm' | 'signing' | 'success'>('input');
  const [withdrawStep, setWithdrawStep] = useState<'input' | 'confirm' | 'signing' | 'success'>('input');
  const [depositError, setDepositError] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [depositLoading, setDepositLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const { party: plParty } = usePartyLayer();
  // Prefer PartyLayer session party; fallback to persisted wallet store party
  const party = plParty || storeParty;
  const { operatorParty } = useOperatorParty();
  const depositOp = useWalletOperation();
  const withdrawOp = useWalletOperation();

  // Pool-specific params from API (dynamic per pool)
  const [detailParams, setDetailParams] = useState<PoolDetailParams>(DEFAULT_DETAIL_PARAMS);

  useEffect(() => {
    fetchPools();
    if (isConnected) {
      fetchBalances();
      // Pass connected wallet party so backend queries the real Canton wallet balance
      fetchTokenBalances(party ?? undefined);
    }

    // Fetch pool detail from API for dynamic IR model + collateral params
    import('@/lib/api/client')
      .then(({ apiClient }) => apiClient.get<{ data: PoolDetailParams }>(`/pools/${poolId}`))
      .then((response) => {
        const body = response.data;
        const detail = (body as Record<string, unknown>)?.data ?? body;
        if (detail && typeof detail === 'object') {
          const d = detail as Record<string, unknown>;
          if (d.interestRateModel && d.collateralConfig) {
            setDetailParams(d as unknown as PoolDetailParams);
          }
        }
      })
      .catch(() => {
        // Use defaults if API call fails
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPools, poolId, isConnected, party]);

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

  // Wallet balance for the current pool asset
  const walletBalance = pool ? getBalanceForSymbol(pool.symbol) : 0;
  const depositAmountNum = parseFloat(depositAmount || '0');
  const hasInsufficientBalance = depositAmountNum > 0 && depositAmountNum > walletBalance;
  const remainingAfterDeposit = walletBalance - depositAmountNum;

  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
  }, []);

  const handleDeposit = useCallback(async () => {
    if (!poolId || estimatedShares <= 0 || !pool) return;
    setDepositError(null);
    setDepositLoading(true);
    setDepositStep('signing');

    try {
      // Map pool symbol to Canton token (CC, CBTC, USDCx)
      const cantonToken = mapPoolToCanton(pool.symbol);

      // Two-phase flow: wallet popup opens if operator party is available and token is supported
      if (operatorParty && ['CC', 'CBTC', 'USDCx'].includes(cantonToken)) {
        await depositOp.executeWithWalletTransfer(
          ENDPOINTS.POOL_DEPOSIT(poolId),
          { amount: depositAmount },
          {
            to: operatorParty,
            token: cantonToken,
            amount: depositAmount,
            memo: `deposit-${poolId}`,
          },
        );
      } else {
        // Fallback: proxy mode for unsupported tokens (T-BILL etc.)
        await depositOp.execute(
          ENDPOINTS.POOL_DEPOSIT(poolId),
          { amount: depositAmount },
        );
      }

      setDepositStep('success');
      // Refresh both protocol positions + wallet token balances
      void fetchBalances();
      void fetchTokenBalances(party ?? undefined);
    } catch (err) {
      // Transaction failed — go back to confirm step
      setDepositStep('confirm');
      setDepositError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setDepositLoading(false);
    }
  }, [poolId, depositAmount, estimatedShares, pool, party, operatorParty, depositOp, fetchBalances, fetchTokenBalances]);

  const handleWithdraw = useCallback(async () => {
    if (!poolId || !withdrawAmount || !pool) return;
    setWithdrawError(null);
    setWithdrawLoading(true);
    setWithdrawStep('signing');

    try {
      const cantonToken = mapPoolToCanton(pool.symbol);

      // Two-phase flow: wallet popup opens for confirmation (small fee transfer)
      // then backend processes withdrawal and transfers tokens to user
      if (operatorParty && ['CC', 'CBTC', 'USDCx'].includes(cantonToken)) {
        await withdrawOp.executeWithWalletTransfer(
          ENDPOINTS.POOL_WITHDRAW(poolId),
          { shares: withdrawAmount },
          {
            to: operatorParty,
            token: 'CC',
            amount: '0.0001',
            memo: `withdraw-confirm-${poolId}`,
          },
        );
      } else {
        await withdrawOp.execute(
          ENDPOINTS.POOL_WITHDRAW(poolId),
          { shares: withdrawAmount },
        );
      }
      setWithdrawStep('success');
      // Refresh both protocol positions + wallet token balances
      void fetchBalances();
      void fetchTokenBalances(party ?? undefined);
    } catch (err) {
      // Transaction failed — go back to confirm step
      setWithdrawStep('confirm');
      setWithdrawError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setWithdrawLoading(false);
    }
  }, [poolId, withdrawAmount, pool, party, operatorParty, withdrawOp, fetchBalances, fetchTokenBalances]);

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
                <Badge variant="default" size="sm">
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
                  <Dialog onOpenChange={(open) => { if (!open) { setDepositStep('input'); setDepositAmount(''); setDepositError(null); setDepositLoading(false); } }}>
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
                          {depositStep === 'confirm'
                            ? 'Review your transaction before submitting.'
                            : `Supply ${pool.symbol} to earn ${(pool.supplyAPY * 100).toFixed(2)}% APY.`}
                        </DialogDescription>
                      </DialogHeader>

                      {/* Step 1: Input */}
                      {depositStep === 'input' && (
                        <>
                          <div className="flex flex-col gap-4">
                            {/* Wallet balance */}
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-text-tertiary">Wallet Balance</span>
                              <span className="font-mono tabular-nums text-text-primary">
                                {walletBalance.toLocaleString('en-US', { maximumFractionDigits: 4 })} {pool.symbol}
                              </span>
                            </div>

                            <Input
                              label="Amount"
                              type="number"
                              placeholder="0.00"
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              iconRight={
                                <button
                                  onClick={() => setDepositAmount(walletBalance > 0 ? walletBalance.toString() : '0')}
                                  className="text-xs font-medium text-accent-teal hover:text-accent-teal-hover"
                                >
                                  Max
                                </button>
                              }
                            />

                            <div className="flex items-center justify-between rounded-md bg-bg-tertiary px-3 py-2 text-sm">
                              <span className="text-text-tertiary">You will receive</span>
                              <span className="font-mono tabular-nums text-text-primary">
                                ~{estimatedShares.toLocaleString('en-US', { maximumFractionDigits: 2 })} shares
                              </span>
                            </div>

                            {/* Insufficient balance warning */}
                            {hasInsufficientBalance && (
                              <div className="flex items-center gap-2 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-400">
                                Insufficient balance. You have {walletBalance.toLocaleString('en-US', { maximumFractionDigits: 4 })} {pool.symbol}
                              </div>
                            )}
                          </div>

                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="ghost" size="sm">Cancel</Button>
                            </DialogClose>
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={estimatedShares <= 0 || hasInsufficientBalance}
                              onClick={() => setDepositStep('confirm')}
                            >
                              Review Transaction
                            </Button>
                          </DialogFooter>
                        </>
                      )}

                      {/* Step 2: Confirm */}
                      {depositStep === 'confirm' && (
                        <>
                          <div className="flex flex-col gap-4">
                            <div className="rounded-lg bg-bg-tertiary p-4 space-y-3">
                              <h4 className="text-sm font-semibold text-text-primary">Transaction Summary</h4>
                              <div className="flex justify-between text-sm">
                                <span className="text-text-tertiary">Asset</span>
                                <span className="text-text-primary">{pool.symbol}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-text-tertiary">Deposit Amount</span>
                                <span className="font-mono text-text-primary">{parseFloat(depositAmount).toLocaleString('en-US', { maximumFractionDigits: 4 })} {pool.symbol}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-text-tertiary">Estimated Shares</span>
                                <span className="font-mono text-text-primary">~{estimatedShares.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                              </div>
                              <div className="border-t border-border-subtle pt-2 flex justify-between text-sm">
                                <span className="text-text-tertiary">Current Balance</span>
                                <span className="font-mono text-text-primary">{walletBalance.toLocaleString('en-US', { maximumFractionDigits: 4 })} {pool.symbol}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-text-tertiary">Remaining After</span>
                                <span className="font-mono text-text-primary">{remainingAfterDeposit.toLocaleString('en-US', { maximumFractionDigits: 4 })} {pool.symbol}</span>
                              </div>
                            </div>

                            <p className="text-xs text-text-tertiary">
                              Your wallet will be debited {depositAmount} {pool.symbol}. This transaction will be submitted to the Canton ledger.
                            </p>

                            {depositError && (
                              <TransactionError message={depositError} onRetry={() => setDepositError(null)} />
                            )}
                          </div>

                          <DialogFooter>
                            <Button variant="ghost" size="sm" onClick={() => setDepositStep('input')}>Back</Button>
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={depositLoading}
                              onClick={handleDeposit}
                            >
                              {depositLoading ? 'Submitting...' : 'Approve & Submit'}
                            </Button>
                          </DialogFooter>
                        </>
                      )}

                      {/* Step 2.5: Signing — Wallet approval popup is open */}
                      {depositStep === 'signing' && (
                        <div className="flex flex-col items-center gap-4 py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-accent-teal" />
                          <p className="font-semibold text-text-primary">Waiting for wallet approval...</p>
                          <p className="text-sm text-text-secondary text-center">
                            Please approve this transaction in your connected wallet.
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setDepositStep('confirm'); setDepositLoading(false); }}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}

                      {/* Step 3: Success */}
                      {depositStep === 'success' && (
                        <div className="flex flex-col items-center gap-4 py-8">
                          <div className="h-12 w-12 rounded-full bg-positive/20 flex items-center justify-center">
                            <svg className="h-6 w-6 text-positive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p className="text-text-primary font-semibold">Deposit submitted!</p>
                          <p className="text-text-secondary text-sm">
                            Deposited {depositAmount} {pool.symbol}
                          </p>
                          <DialogClose asChild>
                            <Button variant="secondary" size="sm" onClick={() => { setDepositAmount(''); setDepositStep('input'); setDepositError(null); }}>Close</Button>
                          </DialogClose>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  {/* Withdraw Dialog */}
                  <Dialog onOpenChange={(open) => { if (!open) { setWithdrawStep('input'); setWithdrawAmount(''); setWithdrawError(null); setWithdrawLoading(false); } }}>
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
                          {withdrawStep === 'confirm'
                            ? 'Review your withdrawal before submitting.'
                            : `Withdraw your supplied ${pool.symbol} from this pool.`}
                        </DialogDescription>
                      </DialogHeader>

                      {/* Step 1: Input */}
                      {withdrawStep === 'input' && (
                        <>
                          <div className="flex flex-col gap-4">
                            {/* Available to withdraw */}
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-text-tertiary">Available to withdraw</span>
                              <span className="font-mono tabular-nums text-text-primary">
                                {Math.max(0, availableLiquidity).toLocaleString('en-US', { maximumFractionDigits: 4 })} {pool.symbol}
                              </span>
                            </div>

                            <Input
                              label="Amount (shares)"
                              type="number"
                              placeholder="0.00"
                              value={withdrawAmount}
                              onChange={(e) => setWithdrawAmount(e.target.value)}
                              iconRight={
                                <button
                                  onClick={() => setWithdrawAmount(Math.max(0, availableLiquidity).toString())}
                                  className="text-xs font-medium text-accent-teal hover:text-accent-teal-hover"
                                >
                                  Max
                                </button>
                              }
                            />

                            <div className="flex items-center justify-between rounded-md bg-bg-tertiary px-3 py-2 text-sm">
                              <span className="text-text-tertiary">Estimated receive</span>
                              <span className="font-mono tabular-nums text-text-primary">
                                ~{parseFloat(withdrawAmount || '0').toLocaleString('en-US', { maximumFractionDigits: 4 })} {pool.symbol}
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
                              disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
                              onClick={() => setWithdrawStep('confirm')}
                            >
                              Review Withdrawal
                            </Button>
                          </DialogFooter>
                        </>
                      )}

                      {/* Step 2: Confirm */}
                      {withdrawStep === 'confirm' && (
                        <>
                          <div className="flex flex-col gap-4">
                            <div className="rounded-lg bg-bg-tertiary p-4 space-y-3">
                              <h4 className="text-sm font-semibold text-text-primary">Withdrawal Summary</h4>
                              <div className="flex justify-between text-sm">
                                <span className="text-text-tertiary">Asset</span>
                                <span className="text-text-primary">{pool.symbol}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-text-tertiary">Withdraw Amount</span>
                                <span className="font-mono text-text-primary">{parseFloat(withdrawAmount).toLocaleString('en-US', { maximumFractionDigits: 4 })} shares</span>
                              </div>
                              <div className="border-t border-border-subtle pt-2 flex justify-between text-sm">
                                <span className="text-text-tertiary">Tokens returned to wallet</span>
                                <span className="font-mono text-text-primary">~{parseFloat(withdrawAmount).toLocaleString('en-US', { maximumFractionDigits: 4 })} {pool.symbol}</span>
                              </div>
                            </div>

                            <p className="text-xs text-text-tertiary">
                              Your supply position will be reduced and tokens will be returned to your wallet.
                            </p>

                            {withdrawError && (
                              <TransactionError message={withdrawError} onRetry={() => setWithdrawError(null)} />
                            )}
                          </div>

                          <DialogFooter>
                            <Button variant="ghost" size="sm" onClick={() => setWithdrawStep('input')}>Back</Button>
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={withdrawLoading}
                              onClick={handleWithdraw}
                            >
                              {withdrawLoading ? 'Submitting...' : 'Approve & Withdraw'}
                            </Button>
                          </DialogFooter>
                        </>
                      )}

                      {/* Step 2.5: Signing — Wallet approval popup is open */}
                      {withdrawStep === 'signing' && (
                        <div className="flex flex-col items-center gap-4 py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-accent-teal" />
                          <p className="font-semibold text-text-primary">Waiting for wallet approval...</p>
                          <p className="text-sm text-text-secondary text-center">
                            Please approve this withdrawal in your connected wallet.
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setWithdrawStep('confirm'); setWithdrawLoading(false); }}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}

                      {/* Step 3: Success */}
                      {withdrawStep === 'success' && (
                        <div className="flex flex-col items-center gap-4 py-8">
                          <div className="h-12 w-12 rounded-full bg-positive/20 flex items-center justify-center">
                            <svg className="h-6 w-6 text-positive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p className="text-text-primary font-semibold">Withdrawal submitted!</p>
                          <p className="text-text-secondary text-sm">
                            Withdrawing {withdrawAmount} shares of {pool.symbol}
                          </p>
                          <DialogClose asChild>
                            <Button variant="secondary" size="sm" onClick={() => { setWithdrawAmount(''); setWithdrawStep('input'); setWithdrawError(null); }}>Close</Button>
                          </DialogClose>
                        </div>
                      )}
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
              baseRate={detailParams.interestRateModel.baseRate}
              multiplier={detailParams.interestRateModel.multiplier}
              kink={detailParams.interestRateModel.kink}
              jumpMultiplier={detailParams.interestRateModel.jumpMultiplier}
              currentUtilization={pool.utilization}
              height={280}
            />
            <div className="mt-4 flex flex-col gap-2">
              {[
                { label: 'Base Rate', value: `${(detailParams.interestRateModel.baseRate * 100).toFixed(2)}%` },
                { label: 'Multiplier', value: detailParams.interestRateModel.multiplier.toFixed(2) },
                { label: 'Kink', value: `${(detailParams.interestRateModel.kink * 100).toFixed(0)}%` },
                { label: 'Jump Multiplier', value: detailParams.interestRateModel.jumpMultiplier.toFixed(2) },
              ].map((row) => (
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
              {[
                { label: 'Max LTV', value: `${(detailParams.collateralConfig.loanToValue * 100).toFixed(0)}%` },
                { label: 'Liquidation Threshold', value: `${(detailParams.collateralConfig.liquidationThreshold * 100).toFixed(0)}%` },
                { label: 'Liquidation Penalty', value: `${(detailParams.collateralConfig.liquidationPenalty * 100).toFixed(0)}%` },
                { label: 'Borrow Cap', value: detailParams.collateralConfig.borrowCap > 0 ? formatUSD(detailParams.collateralConfig.borrowCap) : 'Unlimited' },
                { label: 'Reserve Factor', value: '1.0%' },
              ].map((row) => (
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
