'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
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
import type { CreditTier } from '@dualis/shared';
import { useRepay, useAddCollateral, useBorrow } from '@/hooks/api';

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
}: {
  position: BorrowPosition;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [repayAmount, setRepayAmount] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const repayMutation = useRepay();

  const repayValue = parseFloat(repayAmount) || 0;
  const repayPercent = position.currentDebt > 0 ? repayValue / position.currentDebt : 0;
  const newHealthFactor = position.healthFactor * (1 + Math.min(repayPercent, 1) * 0.5);

  const handleRepayAll = useCallback(() => {
    setRepayAmount(position.currentDebt.toString());
  }, [position.currentDebt]);

  const handleConfirm = useCallback(async () => {
    try {
      await repayMutation.execute(position.positionId, { amount: repayAmount });
      setSubmitted(true);
    } catch {
      // error captured by repayMutation.error
    }
  }, [position.positionId, repayAmount, repayMutation]);

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (!value) {
        setRepayAmount('');
        setSubmitted(false);
        repayMutation.reset();
      }
      onOpenChange(value);
    },
    [onOpenChange, repayMutation]
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

        {submitted ? (
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
                <span className="text-text-secondary">Current Debt</span>
                <span className="font-mono text-text-primary">{formatUSD(position.currentDebt)}</span>
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
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRepayAll}
                  className="mb-0.5"
                >
                  Repay All
                </Button>
              </div>

              <div className="rounded-md bg-bg-tertiary p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">New Health Factor</span>
                  <span className="font-mono text-text-primary">
                    ~{newHealthFactor.toFixed(2)}
                  </span>
                </div>
              </div>

              {repayMutation.error && (
                <p className="text-sm text-negative">{repayMutation.error}</p>
              )}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button
                variant="primary"
                onClick={handleConfirm}
                disabled={repayValue <= 0 || repayValue > position.currentDebt || repayMutation.isLoading}
              >
                {repayMutation.isLoading ? 'Processing...' : 'Confirm Repay'}
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
}: {
  position: BorrowPosition;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collateralAssets: string[];
  collateralPrices: Record<string, number>;
}) {
  const assets = collateralAssets.length > 0 ? collateralAssets : FALLBACK_COLLATERAL_ASSETS;
  const [selectedAsset, setSelectedAsset] = useState<string>(assets[0] ?? 'USDC');
  const [amount, setAmount] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const addCollateralMutation = useAddCollateral();

  const amountValue = parseFloat(amount) || 0;
  const priceUSD = collateralPrices[selectedAsset] ?? FALLBACK_COLLATERAL_PRICES[selectedAsset] ?? 1;
  const addedValueUSD = amountValue * priceUSD;
  const existingCollateralUSD = position.collateral.reduce((sum, c) => sum + c.valueUSD, 0);
  const newTotalCollateral = existingCollateralUSD + addedValueUSD;
  const newHealthFactor =
    position.currentDebt > 0
      ? (newTotalCollateral / (position.currentDebt * 1.25)) * position.healthFactor
      : position.healthFactor;

  const handleConfirm = useCallback(async () => {
    try {
      await addCollateralMutation.execute(position.positionId, {
        asset: { symbol: selectedAsset, amount },
      });
      setSubmitted(true);
    } catch {
      // error captured by addCollateralMutation.error
    }
  }, [position.positionId, selectedAsset, amount, addCollateralMutation]);

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (!value) {
        setSelectedAsset(assets[0] ?? 'USDC');
        setAmount('');
        setSubmitted(false);
        addCollateralMutation.reset();
      }
      onOpenChange(value);
    },
    [onOpenChange, addCollateralMutation, assets]
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

        {submitted ? (
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
              <div>
                <label className="text-sm font-medium text-text-secondary mb-1.5 block">
                  Collateral Asset
                </label>
                <select
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className="h-9 w-full rounded-md bg-bg-tertiary border border-border-default px-3 text-sm text-text-primary focus-ring transition-colors"
                >
                  {assets.map((asset) => (
                    <option key={asset} value={asset}>
                      {asset}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={0}
                step={0.01}
              />

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

              {addCollateralMutation.error && (
                <p className="text-sm text-negative">{addCollateralMutation.error}</p>
              )}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button
                variant="primary"
                onClick={handleConfirm}
                disabled={amountValue <= 0 || addCollateralMutation.isLoading}
              >
                {addCollateralMutation.isLoading ? 'Processing...' : 'Add Collateral'}
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
            <tr className="border-b border-border-default backdrop-blur">
              <th className="text-label px-6 h-10 text-left">Asset</th>
              <th className="text-label px-6 h-10 text-right">Principal</th>
              <th className="text-label px-6 h-10 text-right">Current Debt</th>
              <th className="text-label px-6 h-10 text-center">Health Factor</th>
              <th className="text-label px-6 h-10 text-center">Credit Tier</th>
              <th className="text-label px-6 h-10 text-right">APY</th>
              <th className="text-label px-6 h-10 text-right">Actions</th>
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
                    'border-b border-border-default last:border-b-0 h-14 hover:bg-bg-hover/50 transition-colors',
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

function NewBorrowSection({ pools, collateralAssets, collateralPrices }: {
  pools: PoolData[];
  collateralAssets: string[];
  collateralPrices: Record<string, number>;
}) {
  const { creditTier } = useWalletStore();
  const borrowMutation = useBorrow();

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

  const mockHealthFactor = useMemo(() => {
    if (borrowValueUSD <= 0) return 0;
    return collateralValueUSD / (borrowValueUSD * 1.25);
  }, [collateralValueUSD, borrowValueUSD]);

  const ltvRatio = useMemo(() => {
    if (collateralValueUSD <= 0) return 0;
    return (borrowValueUSD / collateralValueUSD) * 100;
  }, [borrowValueUSD, collateralValueUSD]);

  const availableLiquidity = selectedPool
    ? selectedPool.totalDeposits - selectedPool.totalBorrows
    : 0;

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
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-teal-muted text-accent-teal text-2xs font-medium">
                  1
                </span>
                Select Asset
              </h4>
              <select
                value={selectedPoolId}
                onChange={(e) => setSelectedPoolId(e.target.value)}
                className="h-9 w-full max-w-md rounded-md bg-bg-tertiary border border-border-default px-3 text-sm text-text-primary focus-ring transition-colors"
              >
                <option value="">Choose an asset...</option>
                {activePools.map((pool) => {
                  const available = pool.totalDeposits - pool.totalBorrows;
                  return (
                    <option key={pool.poolId} value={pool.poolId}>
                      {pool.symbol} — Available: {formatUSD(available * pool.priceUSD)}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Step 2 — Borrow Amount */}
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-teal-muted text-accent-teal text-2xs font-medium">
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
                    Available: {formatUSD(availableLiquidity * selectedPool.priceUSD)}
                  </p>
                )}
              </div>
            </div>

            {/* Step 3 — Select Collateral */}
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-teal-muted text-accent-teal text-2xs font-medium">
                  3
                </span>
                Select Collateral
              </h4>
              <div className="space-y-3 max-w-md">
                {collateralEntries.map((entry, index) => (
                  <div key={index} className="flex items-end gap-2">
                    <div className="w-32">
                      <label className="text-xs font-medium text-text-secondary mb-1.5 block">
                        Asset
                      </label>
                      <select
                        value={entry.asset}
                        onChange={(e) => handleCollateralAssetChange(index, e.target.value)}
                        className="h-9 w-full rounded-md bg-bg-tertiary border border-border-default px-3 text-sm text-text-primary focus-ring transition-colors"
                      >
                        {effectiveAssets.map((asset) => (
                          <option key={asset} value={asset}>
                            {asset}
                          </option>
                        ))}
                      </select>
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
                ))}
                <Button variant="ghost" size="sm" onClick={handleAddCollateralRow}>
                  + Add Collateral Asset
                </Button>
              </div>
            </div>

            {/* Step 4 — Health Factor Simulator */}
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-teal-muted text-accent-teal text-2xs font-medium">
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
                          {formatUSD(selectedPool.priceUSD / mockHealthFactor)}
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
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-teal-muted text-accent-teal text-2xs font-medium">
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
            {borrowMutation.error && (
              <p className="text-sm text-negative">{borrowMutation.error}</p>
            )}
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
                disabled={!selectedPoolId || borrowValue <= 0 || collateralValueUSD <= 0 || borrowMutation.isLoading}
                onClick={async () => {
                  try {
                    await borrowMutation.execute({
                      lendingPoolId: selectedPoolId,
                      borrowAmount: borrowAmount,
                      collateralAssets: collateralEntries
                        .filter((e) => parseFloat(e.amount) > 0)
                        .map((e) => ({ symbol: e.asset, amount: e.amount })),
                    });
                    setShowSuccess(true);
                  } catch {
                    // error captured by borrowMutation.error
                  }
                }}
              >
                {borrowMutation.isLoading ? 'Processing...' : 'Review Borrow'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
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
  const { isConnected } = useWalletStore();
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

  const [repayPosition, setRepayPosition] = useState<BorrowPosition | null>(null);
  const [collateralPosition, setCollateralPosition] = useState<BorrowPosition | null>(null);

  // Dynamic collateral assets from API
  const [collateralAssets, setCollateralAssets] = useState<string[]>([]);
  const [collateralPrices, setCollateralPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchPositions('mock');
    fetchPools();

    // Fetch collateral assets dynamically from the API
    import('@/lib/api/client')
      .then(({ apiClient }) => apiClient.get<{ data: Array<{ symbol: string; priceUSD: number }> }>('/borrow/collateral-assets'))
      .then((response) => {
        const body = response.data;
        const assets = Array.isArray(body) ? body : body?.data;
        if (Array.isArray(assets) && assets.length > 0) {
          setCollateralAssets(assets.map((a) => a.symbol));
          const prices: Record<string, number> = {};
          for (const a of assets) {
            prices[a.symbol] = a.priceUSD;
          }
          setCollateralPrices(prices);
        }
      })
      .catch(() => {
        // Use fallback hardcoded assets if API fails
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
        <h1 className="text-xl font-bold text-text-primary tracking-tight">Borrow</h1>
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
      <h1 className="text-xl font-bold text-text-primary tracking-tight">Borrow</h1>

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
        <NewBorrowSection pools={pools} collateralAssets={collateralAssets} collateralPrices={collateralPrices} />
      </section>

      {/* Repay Dialog */}
      {repayPosition && (
        <RepayDialog
          position={repayPosition}
          open={repayPosition !== null}
          onOpenChange={(open) => {
            if (!open) setRepayPosition(null);
          }}
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
        />
      )}
    </div>
  );
}
