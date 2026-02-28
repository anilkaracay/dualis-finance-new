'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { TransactionError } from '@/components/feedback/TransactionError';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/Dialog';
import { AssetIcon } from '@/components/data-display/AssetIcon';
import { HealthFactorGauge } from '@/components/data-display/HealthFactorGauge';
import { CreditTierBadge } from '@/components/data-display/CreditTierBadge';
import { APYDisplay } from '@/components/data-display/APYDisplay';
import { usePositionStore } from '@/stores/usePositionStore';
import { useProtocolStore } from '@/stores/useProtocolStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { useTokenBalanceStore } from '@/stores/useTokenBalanceStore';
import { useBalanceStore } from '@/stores/useBalanceStore';
import type { CreditTier } from '@dualis/shared';
import { mapPoolToCanton } from '@dualis/shared';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { useWalletOperation } from '@/hooks/useWalletOperation';
import { useOperatorParty } from '@/hooks/useOperatorParty';
import { Loader2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BorrowPosition {
  positionId: string;
  poolId: string;
  symbol: string;
  borrowedAmountPrincipal: number;
  currentDebt: number;
  healthFactor: number;
  creditTier: string;
  isLiquidatable: boolean;
  collateral: Array<{ symbol: string; amount: number; valueUSD: number }>;
  borrowTimestamp: string;
}

interface PoolData {
  poolId: string;
  symbol: string;
  instrumentType: string;
  totalDeposits: number;
  totalBorrows: number;
  totalReserves: number;
  utilization: number;
  supplyAPY: number;
  borrowAPY: number;
  priceUSD: number;
  isActive: boolean;
}

interface CollateralEntry {
  asset: string;
  amount: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function getPoolByPoolId(pools: PoolData[], poolId: string): PoolData | undefined {
  return pools.find((p) => p.poolId === poolId);
}

// Collateral assets and prices are fetched from the API (/borrow/collateral-assets)
// so any new pool/asset added at runtime is automatically available.
const FALLBACK_COLLATERAL_ASSETS = ['USDC', 'wBTC', 'ETH', 'CC'];
const FALLBACK_COLLATERAL_PRICES: Record<string, number> = {
  USDC: 1.0,
  wBTC: 97_234.56,
  ETH: 3_456.78,
  CC: 2.3,
};

// ---------------------------------------------------------------------------
// Repay Dialog
// ---------------------------------------------------------------------------

function RepayDialog({
  position,
  open,
  onOpenChange,
  operatorParty,
  onSuccess,
}: {
  position: BorrowPosition;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operatorParty: string | null;
  onSuccess?: () => void;
}) {
  const [repayAmount, setRepayAmount] = useState('');
  const repayOp = useWalletOperation();
  const { getBalanceForSymbol } = useTokenBalanceStore();

  const repayValue = parseFloat(repayAmount) || 0;
  const repayPercent = position.currentDebt > 0 ? repayValue / position.currentDebt : 0;
  const newHealthFactor = position.healthFactor * (1 + Math.min(repayPercent, 1) * 0.5);

  // Wallet balance for the asset being repaid
  const repayWalletBalance = getBalanceForSymbol(position.symbol);
  const maxRepayable = Math.min(position.currentDebt, repayWalletBalance);
  const hasInsufficientRepayBalance = repayValue > 0 && repayValue > repayWalletBalance;

  const handleRepayAll = useCallback(() => {
    // Set to min(debt, wallet balance) — can't repay more than you have
    setRepayAmount(maxRepayable > 0 ? maxRepayable.toString() : '0');
  }, [maxRepayable]);

  const handleConfirm = useCallback(async () => {
    try {
      const cantonToken = mapPoolToCanton(position.symbol);

      // Two-phase flow: wallet popup for supported Canton tokens
      if (operatorParty && ['CC', 'CBTC', 'USDCx'].includes(cantonToken)) {
        await repayOp.executeWithWalletTransfer(
          ENDPOINTS.BORROW_REPAY(position.positionId),
          { amount: repayAmount },
          {
            to: operatorParty,
            token: cantonToken,
            amount: repayAmount,
            memo: `repay-${position.positionId}`,
          },
        );
      } else {
        await repayOp.execute(
          ENDPOINTS.BORROW_REPAY(position.positionId),
          { amount: repayAmount },
        );
      }
      // Refresh all data after successful repay
      onSuccess?.();
    } catch {
      // error captured by repayOp.error
    }
  }, [position.positionId, position.symbol, repayAmount, repayOp, operatorParty, onSuccess]);

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (!value) {
        setRepayAmount('');
        repayOp.reset();
      }
      onOpenChange(value);
    },
    [onOpenChange, repayOp]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Repay {position.symbol}</DialogTitle>
          <DialogDescription>
            Repay part or all of your outstanding debt.
          </DialogDescription>
        </DialogHeader>

        {/* Signing — wallet approval popup */}
        {(repayOp.status === 'signing' || repayOp.status === 'submitting') ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-accent-teal" />
            <p className="font-semibold text-text-primary">
              {repayOp.status === 'signing' ? 'Waiting for wallet approval...' : 'Submitting transaction...'}
            </p>
            <p className="text-text-secondary text-sm text-center">
              {repayOp.status === 'signing' ? 'Please confirm the transaction in your wallet' : 'Processing on Canton...'}
            </p>
          </div>
        ) : repayOp.status === 'success' ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-12 w-12 rounded-full bg-positive/20 flex items-center justify-center">
              <svg className="h-6 w-6 text-positive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-text-primary font-semibold">Transaction submitted!</p>
            <p className="text-text-secondary text-sm">
              Repaying {formatUSD(repayValue)} of {position.symbol}
            </p>
            <DialogClose asChild>
              <Button variant="secondary" size="sm">Close</Button>
            </DialogClose>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Outstanding Debt</span>
                <span className="font-mono text-text-primary">
                  {formatNumber(position.currentDebt, 4)} {position.symbol}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Wallet Balance</span>
                <span className="font-mono text-text-primary">
                  {formatNumber(repayWalletBalance, 4)} {position.symbol}
                </span>
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    label="Repay Amount"
                    type="number"
                    placeholder="0.00"
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    min={0}
                    step={0.01}
                    iconRight={
                      <button
                        onClick={handleRepayAll}
                        className="text-xs font-medium text-accent-teal hover:text-accent-teal-hover"
                      >
                        Max
                      </button>
                    }
                  />
                </div>
              </div>

              {hasInsufficientRepayBalance && (
                <div className="flex items-center gap-2 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-400">
                  Insufficient wallet balance. You have {formatNumber(repayWalletBalance, 4)} {position.symbol}
                </div>
              )}

              <div className="rounded-md bg-bg-tertiary p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Remaining Debt</span>
                  <span className="font-mono text-text-primary">
                    {formatNumber(Math.max(0, position.currentDebt - repayValue), 4)} {position.symbol}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">New Health Factor</span>
                  <span className="font-mono text-text-primary">
                    ~{newHealthFactor.toFixed(2)}
                  </span>
                </div>
              </div>

              {repayOp.error && (
                <TransactionError message={repayOp.error} onRetry={repayOp.reset} />
              )}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button
                variant="primary"
                onClick={handleConfirm}
                disabled={repayValue <= 0 || repayValue > position.currentDebt || hasInsufficientRepayBalance || repayOp.isLoading}
              >
                {repayOp.status === 'preparing' ? 'Preparing...' : 'Approve & Repay'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Add Collateral Dialog
// ---------------------------------------------------------------------------

function AddCollateralDialog({
  position,
  open,
  onOpenChange,
  collateralAssets,
  collateralPrices,
  operatorParty,
  onSuccess,
}: {
  position: BorrowPosition;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collateralAssets: string[];
  collateralPrices: Record<string, number>;
  operatorParty: string | null;
  onSuccess?: () => void;
}) {
  const assets = collateralAssets.length > 0 ? collateralAssets : FALLBACK_COLLATERAL_ASSETS;
  const [selectedAsset, setSelectedAsset] = useState<string>(assets[0] ?? 'USDC');
  const [amount, setAmount] = useState('');
  const addCollateralOp = useWalletOperation();
  const { getBalanceForSymbol } = useTokenBalanceStore();

  const amountValue = parseFloat(amount) || 0;
  const priceUSD = collateralPrices[selectedAsset] ?? FALLBACK_COLLATERAL_PRICES[selectedAsset] ?? 1;
  const addedValueUSD = amountValue * priceUSD;
  const existingCollateralUSD = position.collateral.reduce((sum, c) => sum + c.valueUSD, 0);
  const newTotalCollateral = existingCollateralUSD + addedValueUSD;
  const avgThreshold = collateralPrices[selectedAsset]
    ? (FALLBACK_COLLATERAL_PRICES[selectedAsset] ? 0.8 : 0.8) // use per-asset threshold when available
    : 0.8;
  const newHealthFactor =
    position.currentDebt > 0
      ? (newTotalCollateral * avgThreshold) / position.currentDebt
      : position.healthFactor;

  const handleConfirm = useCallback(async () => {
    try {
      const cantonToken = mapPoolToCanton(selectedAsset);

      // Two-phase flow: wallet popup for supported Canton tokens
      if (operatorParty && ['CC', 'CBTC', 'USDCx'].includes(cantonToken)) {
        await addCollateralOp.executeWithWalletTransfer(
          ENDPOINTS.BORROW_ADD_COLLATERAL(position.positionId),
          { asset: { symbol: selectedAsset, amount } },
          {
            to: operatorParty,
            token: cantonToken,
            amount,
            memo: `collateral-${position.positionId}`,
          },
        );
      } else {
        await addCollateralOp.execute(
          ENDPOINTS.BORROW_ADD_COLLATERAL(position.positionId),
          { asset: { symbol: selectedAsset, amount } },
        );
      }
      // Refresh all data after successful add collateral
      onSuccess?.();
    } catch {
      // error captured by addCollateralOp.error
    }
  }, [position.positionId, selectedAsset, amount, addCollateralOp, operatorParty, onSuccess]);

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (!value) {
        setSelectedAsset(assets[0] ?? 'USDC');
        setAmount('');
        addCollateralOp.reset();
      }
      onOpenChange(value);
    },
    [onOpenChange, addCollateralOp, assets]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Collateral</DialogTitle>
          <DialogDescription>
            Add collateral to improve your health factor for {position.symbol} borrow.
          </DialogDescription>
        </DialogHeader>

        {/* Signing — wallet approval popup */}
        {(addCollateralOp.status === 'signing' || addCollateralOp.status === 'submitting') ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-accent-teal" />
            <p className="font-semibold text-text-primary">
              {addCollateralOp.status === 'signing' ? 'Waiting for wallet approval...' : 'Submitting transaction...'}
            </p>
            <p className="text-text-secondary text-sm text-center">
              {addCollateralOp.status === 'signing' ? 'Please confirm the transaction in your wallet' : 'Processing on Canton...'}
            </p>
          </div>
        ) : addCollateralOp.status === 'success' ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-12 w-12 rounded-full bg-positive/20 flex items-center justify-center">
              <svg className="h-6 w-6 text-positive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-text-primary font-semibold">Transaction submitted!</p>
            <p className="text-text-secondary text-sm">
              Adding {formatNumber(amountValue)} {selectedAsset} as collateral
            </p>
            <DialogClose asChild>
              <Button variant="secondary" size="sm">Close</Button>
            </DialogClose>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <Select
                label="Collateral Asset"
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                size="sm"
                options={assets.map((asset) => ({ value: asset, label: asset }))}
              />

              <div className="flex items-center justify-between text-xs text-text-tertiary">
                <span>Wallet Balance</span>
                <span className="font-mono">{formatNumber(getBalanceForSymbol(selectedAsset), 4)} {selectedAsset}</span>
              </div>

              <Input
                label="Amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={0}
                step={0.01}
                iconRight={
                  <button
                    onClick={() => {
                      const bal = getBalanceForSymbol(selectedAsset);
                      setAmount(bal > 0 ? bal.toString() : '0');
                    }}
                    className="text-xs font-medium text-accent-teal hover:text-accent-teal-hover"
                  >
                    Max
                  </button>
                }
              />

              {amountValue > 0 && amountValue > getBalanceForSymbol(selectedAsset) && (
                <div className="flex items-center gap-2 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-400">
                  Insufficient balance. You have {formatNumber(getBalanceForSymbol(selectedAsset), 4)} {selectedAsset}
                </div>
              )}

              {amountValue > 0 && (
                <div className="rounded-md bg-bg-tertiary p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Added Value</span>
                    <span className="font-mono text-text-primary">
                      {formatUSD(addedValueUSD)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">New Health Factor</span>
                    <span className="font-mono text-text-primary">
                      ~{newHealthFactor.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {addCollateralOp.error && (
                <TransactionError message={addCollateralOp.error} onRetry={addCollateralOp.reset} />
              )}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button
                variant="primary"
                onClick={handleConfirm}
                disabled={amountValue <= 0 || amountValue > getBalanceForSymbol(selectedAsset) || addCollateralOp.isLoading}
              >
                {addCollateralOp.status === 'preparing' ? 'Preparing...' : 'Approve & Add Collateral'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Active Borrow Positions Table
// ---------------------------------------------------------------------------

function ActiveBorrowPositions({
  positions,
  pools,
  isLoading,
  onRepay,
  onAddCollateral,
}: {
  positions: BorrowPosition[];
  pools: PoolData[];
  isLoading: boolean;
  onRepay: (position: BorrowPosition) => void;
  onAddCollateral: (position: BorrowPosition) => void;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Borrow Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="rect" height={56} width="100%" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Borrow Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-12">
            <p className="text-text-tertiary text-sm">No active borrow positions</p>
            <a href="#new-borrow">
              <Button variant="primary" size="sm">
                Borrow Now
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card padding="none">
      <div className="px-6 pt-5 pb-3">
        <h3 className="text-label">Active Borrow Positions</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default bg-bg-secondary/40">
              <th className="text-label px-6 h-9 text-left">Asset</th>
              <th className="text-label px-6 h-9 text-right">Principal</th>
              <th className="text-label px-6 h-9 text-right">Current Debt</th>
              <th className="text-label px-6 h-9 text-center">Health Factor</th>
              <th className="text-label px-6 h-9 text-center">Credit Tier</th>
              <th className="text-label px-6 h-9 text-right">APY</th>
              <th className="text-label px-6 h-9 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((pos) => {
              const pool = getPoolByPoolId(pools, pos.poolId);
              const borrowAPY = pool?.borrowAPY ?? 0;

              return (
                <tr
                  key={pos.positionId}
                  className={cn(
                    'border-b border-border-default last:border-b-0 h-12 hover:bg-surface-selected table-row-interactive transition-colors',
                    pos.healthFactor < 1.2 && 'bg-negative/5'
                  )}
                >
                  <td className="px-6">
                    <div className="flex items-center gap-2">
                      <AssetIcon symbol={pos.symbol} size="sm" />
                      <span className="font-medium text-text-primary">{pos.symbol}</span>
                    </div>
                  </td>
                  <td className="px-6 text-right">
                    <span className="font-mono text-text-primary">
                      {formatUSD(pos.borrowedAmountPrincipal)}
                    </span>
                  </td>
                  <td className="px-6 text-right">
                    <span className="font-mono text-text-primary">
                      {formatUSD(pos.currentDebt)}
                    </span>
                  </td>
                  <td className="px-6">
                    <div className="flex justify-center">
                      <HealthFactorGauge value={pos.healthFactor} size="sm" showLabel={false} />
                    </div>
                  </td>
                  <td className="px-6">
                    <div className="flex justify-center">
                      <CreditTierBadge tier={pos.creditTier as CreditTier} size="sm" />
                    </div>
                  </td>
                  <td className="px-6 text-right">
                    <APYDisplay value={borrowAPY} size="sm" />
                  </td>
                  <td className="px-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onRepay(pos)}
                      >
                        Repay
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAddCollateral(pos)}
                      >
                        Add Collateral
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// New Borrow Section
// ---------------------------------------------------------------------------

function NewBorrowSection({ pools, collateralAssets, collateralPrices, collateralThresholds, operatorParty, onSuccess }: {
  pools: PoolData[];
  collateralAssets: string[];
  collateralPrices: Record<string, number>;
  collateralThresholds: Record<string, number>;
  operatorParty: string | null;
  onSuccess?: () => void;
}) {
  const { creditTier } = useWalletStore();
  const { getBalanceForSymbol } = useTokenBalanceStore();
  const borrowOp = useWalletOperation();

  const effectiveAssets = collateralAssets.length > 0 ? collateralAssets : FALLBACK_COLLATERAL_ASSETS;

  const [selectedPoolId, setSelectedPoolId] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [collateralEntries, setCollateralEntries] = useState<CollateralEntry[]>([
    { asset: effectiveAssets[0] ?? 'USDC', amount: '' },
  ]);
  const [showSuccess, setShowSuccess] = useState(false);

  const activePools = useMemo(() => pools.filter((p) => p.isActive), [pools]);
  const selectedPool = useMemo(
    () => activePools.find((p) => p.poolId === selectedPoolId),
    [activePools, selectedPoolId]
  );

  const borrowValue = parseFloat(borrowAmount) || 0;
  const borrowValueUSD = selectedPool ? borrowValue * selectedPool.priceUSD : 0;

  const collateralValueUSD = useMemo(() => {
    return collateralEntries.reduce((sum, entry) => {
      const amt = parseFloat(entry.amount) || 0;
      const price = collateralPrices[entry.asset] ?? FALLBACK_COLLATERAL_PRICES[entry.asset] ?? 1;
      return sum + amt * price;
    }, 0);
  }, [collateralEntries, collateralPrices]);

  // Weighted average liquidation threshold from selected collateral
  const weightedLiqThreshold = useMemo(() => {
    if (collateralValueUSD <= 0) return 0.8;
    let weightedSum = 0;
    let totalVal = 0;
    for (const entry of collateralEntries) {
      const amt = parseFloat(entry.amount) || 0;
      const price = collateralPrices[entry.asset] ?? FALLBACK_COLLATERAL_PRICES[entry.asset] ?? 1;
      const val = amt * price;
      const threshold = collateralThresholds[entry.asset] ?? 0.8;
      weightedSum += val * threshold;
      totalVal += val;
    }
    return totalVal > 0 ? weightedSum / totalVal : 0.8;
  }, [collateralEntries, collateralPrices, collateralThresholds, collateralValueUSD]);

  const mockHealthFactor = useMemo(() => {
    if (borrowValueUSD <= 0) return 0;
    return (collateralValueUSD * weightedLiqThreshold) / borrowValueUSD;
  }, [collateralValueUSD, borrowValueUSD, weightedLiqThreshold]);

  const ltvRatio = useMemo(() => {
    if (collateralValueUSD <= 0) return 0;
    return (borrowValueUSD / collateralValueUSD) * 100;
  }, [borrowValueUSD, collateralValueUSD]);

  const availableLiquidity = selectedPool
    ? selectedPool.totalDeposits - selectedPool.totalBorrows
    : 0;

  // Check if any collateral entry exceeds wallet balance
  const hasInsufficientCollateral = useMemo(() => {
    return collateralEntries.some((entry) => {
      const amt = parseFloat(entry.amount) || 0;
      if (amt <= 0) return false;
      return amt > getBalanceForSymbol(entry.asset);
    });
  }, [collateralEntries, getBalanceForSymbol]);

  // Check if borrow exceeds available liquidity
  const exceedsLiquidity = borrowValue > 0 && borrowValue > availableLiquidity;

  const estimatedMonthlyInterest = selectedPool
    ? borrowValueUSD * (selectedPool.borrowAPY / 12)
    : 0;

  const handleCollateralAssetChange = useCallback(
    (index: number, asset: string) => {
      setCollateralEntries((prev) => {
        const next = [...prev];
        const existing = next[index];
        if (existing) {
          next[index] = { ...existing, asset };
        }
        return next;
      });
    },
    []
  );

  const handleCollateralAmountChange = useCallback(
    (index: number, amount: string) => {
      setCollateralEntries((prev) => {
        const next = [...prev];
        const existing = next[index];
        if (existing) {
          next[index] = { ...existing, amount };
        }
        return next;
      });
    },
    []
  );

  const handleAddCollateralRow = useCallback(() => {
    setCollateralEntries((prev) => [...prev, { asset: 'USDC', amount: '' }]);
  }, []);

  const handleRemoveCollateralRow = useCallback((index: number) => {
    setCollateralEntries((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const tierDiscountLabel = useMemo(() => {
    switch (creditTier) {
      case 'Diamond':
        return '-50bps';
      case 'Gold':
        return '-30bps';
      case 'Silver':
        return '-15bps';
      case 'Bronze':
        return '0bps';
      default:
        return '+25bps';
    }
  }, [creditTier]);

  return (
    <>
      <Card className="border-t-2 border-t-accent-teal" id="new-borrow">
        <CardHeader>
          <CardTitle>Open New Borrow Position</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Step 1 — Select Asset */}
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-teal-muted text-accent-teal text-xs font-bold border border-accent-teal/20">
                  1
                </span>
                Select Asset
              </h4>
              <Select
                value={selectedPoolId}
                onChange={(e) => setSelectedPoolId(e.target.value)}
                className="max-w-md"
                placeholder="Choose an asset..."
                options={activePools.map((pool) => {
                  const available = pool.totalDeposits - pool.totalBorrows;
                  return {
                    value: pool.poolId,
                    label: `${pool.symbol} — Available: ${formatUSD(available * pool.priceUSD)}`,
                  };
                })}
              />
            </div>

            {/* Step 2 — Borrow Amount */}
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-teal-muted text-accent-teal text-xs font-bold border border-accent-teal/20">
                  2
                </span>
                Borrow Amount
              </h4>
              <div className="max-w-md">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={borrowAmount}
                  onChange={(e) => setBorrowAmount(e.target.value)}
                  min={0}
                  step={0.01}
                />
                {selectedPool && (
                  <p className="text-xs text-text-tertiary mt-1.5">
                    Available Liquidity: {formatNumber(availableLiquidity, 4)} {selectedPool.symbol} ({formatUSD(availableLiquidity * selectedPool.priceUSD)})
                  </p>
                )}
                {exceedsLiquidity && selectedPool && (
                  <p className="text-xs text-red-400 mt-1">
                    Exceeds pool liquidity. Max: {formatNumber(availableLiquidity, 4)} {selectedPool.symbol}
                  </p>
                )}
              </div>
            </div>

            {/* Step 3 — Select Collateral */}
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-teal-muted text-accent-teal text-xs font-bold border border-accent-teal/20">
                  3
                </span>
                Select Collateral
              </h4>
              <div className="space-y-3 max-w-md">
                {collateralEntries.map((entry, index) => {
                  const entryWalletBalance = getBalanceForSymbol(entry.asset);
                  const entryAmount = parseFloat(entry.amount) || 0;
                  const hasInsufficient = entryAmount > 0 && entryAmount > entryWalletBalance;
                  return (
                    <div key={index} className="flex flex-col gap-1">
                      <div className="flex items-end gap-2">
                        <div className="w-32">
                          <Select
                            label="Asset"
                            value={entry.asset}
                            onChange={(e) => handleCollateralAssetChange(index, e.target.value)}
                            size="sm"
                            options={effectiveAssets.map((asset) => ({ value: asset, label: asset }))}
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            label="Amount"
                            type="number"
                            placeholder="0.00"
                            value={entry.amount}
                            onChange={(e) => handleCollateralAmountChange(index, e.target.value)}
                            min={0}
                            step={0.01}
                            iconRight={
                              <button
                                onClick={() => handleCollateralAmountChange(index, entryWalletBalance > 0 ? entryWalletBalance.toString() : '0')}
                                className="text-xs font-medium text-accent-teal hover:text-accent-teal-hover"
                              >
                                Max
                              </button>
                            }
                          />
                        </div>
                        {collateralEntries.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCollateralRow(index)}
                            className="mb-0.5 text-text-tertiary"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-text-tertiary px-1">
                        <span>Balance: {entryWalletBalance.toLocaleString('en-US', { maximumFractionDigits: 4 })} {entry.asset}</span>
                        {hasInsufficient && (
                          <span className="text-red-400">Insufficient balance</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <Button variant="ghost" size="sm" onClick={handleAddCollateralRow}>
                  + Add Collateral Asset
                </Button>
              </div>
            </div>

            {/* Step 4 — Health Factor Simulator */}
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-teal-muted text-accent-teal text-xs font-bold border border-accent-teal/20">
                  4
                </span>
                Health Factor Simulator
              </h4>
              <div className="flex flex-col items-center gap-4 py-4">
                {borrowValueUSD > 0 ? (
                  <>
                    <HealthFactorGauge
                      value={mockHealthFactor}
                      size="lg"
                      showLabel
                      animated
                    />
                    {mockHealthFactor > 0 && mockHealthFactor < 10 && selectedPool && (
                      <p className="text-sm text-text-secondary">
                        Liquidation Price:{' '}
                        <span className="font-mono text-warning">
                          {isFinite(selectedPool.priceUSD / mockHealthFactor) && mockHealthFactor > 0.01
                            ? formatUSD(selectedPool.priceUSD / mockHealthFactor)
                            : 'N/A'}
                        </span>
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-text-tertiary text-sm">
                    Enter borrow amount and collateral to simulate health factor
                  </p>
                )}
              </div>
            </div>

            {/* Step 5 — Summary Panel */}
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-teal-muted text-accent-teal text-xs font-bold border border-accent-teal/20">
                  5
                </span>
                Summary
              </h4>
              <div className="rounded-md bg-bg-tertiary p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-label">Borrow APY</span>
                  <span className="font-mono text-text-primary">
                    {selectedPool ? (
                      <APYDisplay value={selectedPool.borrowAPY} size="sm" />
                    ) : (
                      '—'
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-label">Credit Tier</span>
                  <div className="flex items-center gap-2">
                    {creditTier ? (
                      <>
                        <CreditTierBadge tier={creditTier} size="sm" />
                        <span className="text-xs text-text-tertiary">({tierDiscountLabel})</span>
                      </>
                    ) : (
                      <span className="text-text-tertiary">Unrated</span>
                    )}
                  </div>
                </div>
                <div className="border-t border-border-subtle pt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Collateral Value</span>
                    <span className="font-mono text-text-primary">
                      {formatUSD(collateralValueUSD)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Borrow Value</span>
                    <span className="font-mono text-text-primary">
                      {formatUSD(borrowValueUSD)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">LTV Ratio</span>
                    <span
                      className={cn(
                        'font-mono',
                        ltvRatio > 80 ? 'text-negative' : ltvRatio > 60 ? 'text-warning' : 'text-text-primary'
                      )}
                    >
                      {ltvRatio.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Est. Monthly Interest</span>
                    <span className="font-mono text-text-primary">
                      {formatUSD(estimatedMonthlyInterest)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Review Button */}
            {borrowOp.error && (
              <TransactionError message={borrowOp.error} onRetry={borrowOp.reset} />
            )}

            {/* Signing — wallet approval popup */}
            {(borrowOp.status === 'signing' || borrowOp.status === 'submitting') && (
              <div className="flex flex-col items-center gap-4 py-6">
                <Loader2 className="h-8 w-8 animate-spin text-accent-teal" />
                <p className="font-semibold text-text-primary">
                  {borrowOp.status === 'signing' ? 'Waiting for wallet approval...' : 'Submitting transaction...'}
                </p>
                <p className="text-text-secondary text-sm text-center">
                  {borrowOp.status === 'signing' ? 'Please confirm the transaction in your wallet' : 'Processing on Canton...'}
                </p>
              </div>
            )}

            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
                disabled={!selectedPoolId || borrowValue <= 0 || collateralValueUSD <= 0 || borrowOp.isLoading || hasInsufficientCollateral || exceedsLiquidity}
                onClick={async () => {
                  try {
                    const borrowBody = {
                      lendingPoolId: selectedPoolId,
                      borrowAmount: borrowAmount,
                      collateralAssets: collateralEntries
                        .filter((e) => parseFloat(e.amount) > 0)
                        .map((e) => ({ symbol: e.asset, amount: e.amount })),
                    };

                    // Two-phase flow: wallet popup shows collateral amount, then backend processes borrow
                    if (operatorParty && selectedPool) {
                      const cantonToken = mapPoolToCanton(selectedPool.symbol);
                      // Use first collateral entry for the wallet transfer
                      const firstCollateral = collateralEntries.find((e) => parseFloat(e.amount) > 0);
                      const transferToken = firstCollateral ? mapPoolToCanton(firstCollateral.asset) : cantonToken;
                      const transferAmount = firstCollateral?.amount ?? borrowAmount;
                      if (['CC', 'CBTC', 'USDCx'].includes(transferToken)) {
                        await borrowOp.executeWithWalletTransfer(
                          ENDPOINTS.BORROW_REQUEST,
                          borrowBody,
                          {
                            to: operatorParty,
                            token: transferToken,
                            amount: transferAmount,
                            memo: `borrow-${selectedPoolId}`,
                          },
                        );
                        setShowSuccess(true);
                        onSuccess?.();
                        return;
                      }
                    }

                    // Fallback: proxy mode
                    await borrowOp.execute(ENDPOINTS.BORROW_REQUEST, borrowBody);
                    setShowSuccess(true);
                    onSuccess?.();
                  } catch {
                    // error captured by borrowOp.error
                  }
                }}
              >
                {borrowOp.status === 'preparing' ? 'Preparing...' : borrowOp.isLoading ? 'Processing...' : 'Approve & Borrow'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={(v) => { setShowSuccess(v); if (!v) borrowOp.reset(); }}>
        <DialogContent>
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-16 w-16 rounded-full bg-positive/20 flex items-center justify-center">
              <svg className="h-8 w-8 text-positive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-xl font-semibold text-text-primary">Transaction submitted!</p>
            <p className="text-text-secondary text-sm text-center">
              Your borrow position for {formatUSD(borrowValueUSD)} of{' '}
              {selectedPool?.symbol ?? 'asset'} has been submitted for processing.
            </p>
            <DialogClose asChild>
              <Button variant="primary" size="md">
                Done
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function BorrowPage() {
  const { isConnected, party } = useWalletStore();
  const {
    borrowPositions,
    isLoading: positionsLoading,
    fetchPositions,
  } = usePositionStore();
  const {
    pools,
    isLoading: poolsLoading,
    fetchPools,
  } = useProtocolStore();
  const { operatorParty } = useOperatorParty();
  const { fetchBalances } = useBalanceStore();
  const { fetchTokenBalances } = useTokenBalanceStore();

  // Refresh all data after any successful transaction (force = bypass cache)
  const refreshAll = useCallback(() => {
    void fetchPositions();
    void fetchPools();
    void fetchBalances();
    void fetchTokenBalances(party ?? undefined, true);
  }, [fetchPositions, fetchPools, fetchBalances, fetchTokenBalances, party]);

  const [repayPosition, setRepayPosition] = useState<BorrowPosition | null>(null);
  const [collateralPosition, setCollateralPosition] = useState<BorrowPosition | null>(null);

  // Dynamic collateral assets from API
  const [collateralAssets, setCollateralAssets] = useState<string[]>([]);
  const [collateralPrices, setCollateralPrices] = useState<Record<string, number>>({});
  const [collateralThresholds, setCollateralThresholds] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchPositions();
    fetchPools();

    // Fetch collateral assets dynamically from the API
    import('@/lib/api/client')
      .then(({ apiClient }) => apiClient.get<{ data: Array<{ symbol: string; priceUSD: number; liquidationThreshold: number }> }>('/borrow/collateral-assets'))
      .then((response) => {
        const body = response.data;
        const assets = Array.isArray(body) ? body : body?.data;
        if (Array.isArray(assets) && assets.length > 0) {
          setCollateralAssets(assets.map((a) => a.symbol));
          const prices: Record<string, number> = {};
          const thresholds: Record<string, number> = {};
          for (const a of assets) {
            prices[a.symbol] = a.priceUSD;
            thresholds[a.symbol] = a.liquidationThreshold ?? 0.8;
          }
          setCollateralPrices(prices);
          setCollateralThresholds(thresholds);
        }
      })
      .catch(() => {
        console.warn('[Borrow] Collateral assets API unavailable — using fallback prices');
      });
  }, [fetchPositions, fetchPools]);

  const isLoading = positionsLoading || poolsLoading;

  const handleRepayOpen = useCallback((position: BorrowPosition) => {
    setRepayPosition(position);
  }, []);

  const handleCollateralOpen = useCallback((position: BorrowPosition) => {
    setCollateralPosition(position);
  }, []);

  // ---------- Disconnected State ----------

  if (!isConnected) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Borrow</h1>
        <Card>
          <CardContent>
            <div className="flex flex-col items-center gap-4 py-16">
              <p className="text-text-tertiary text-sm">
                Connect your wallet to view borrow positions and open new borrows.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------- Connected State ----------

  return (
    <div className="space-y-8">
      {/* Header */}
      <h1 className="text-2xl font-bold text-text-primary tracking-tight">Borrow</h1>

      {/* Active Borrow Positions */}
      <section>
        <ActiveBorrowPositions
          positions={borrowPositions}
          pools={pools}
          isLoading={isLoading}
          onRepay={handleRepayOpen}
          onAddCollateral={handleCollateralOpen}
        />
      </section>

      {/* New Borrow Section */}
      <section>
        <NewBorrowSection pools={pools} collateralAssets={collateralAssets} collateralPrices={collateralPrices} collateralThresholds={collateralThresholds} operatorParty={operatorParty} onSuccess={refreshAll} />
      </section>

      {/* Repay Dialog */}
      {repayPosition && (
        <RepayDialog
          position={repayPosition}
          open={repayPosition !== null}
          onOpenChange={(open) => {
            if (!open) setRepayPosition(null);
          }}
          operatorParty={operatorParty}
          onSuccess={refreshAll}
        />
      )}

      {/* Add Collateral Dialog */}
      {collateralPosition && (
        <AddCollateralDialog
          position={collateralPosition}
          open={collateralPosition !== null}
          onOpenChange={(open) => {
            if (!open) setCollateralPosition(null);
          }}
          collateralAssets={collateralAssets}
          collateralPrices={collateralPrices}
          operatorParty={operatorParty}
          onSuccess={refreshAll}
        />
      )}
    </div>
  );
}
