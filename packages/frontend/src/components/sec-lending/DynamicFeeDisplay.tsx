'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Calculator, Plus, Equal, TrendingUp, Clock, Layers } from 'lucide-react';

/* ─── Types ─── */

interface DynamicFeeDisplayProps {
  security: string;
  creditTier?: string;
  className?: string;
}

/* ─── Fee Calculation Helpers ─── */

function getBaseFee(security: string, creditTier?: string): number {
  const tierMultipliers: Record<string, number> = {
    AAA: 0.8,
    AA: 0.9,
    A: 1.0,
    BBB: 1.15,
    BB: 1.35,
    B: 1.6,
  };

  const baseRates: Record<string, number> = {
    'T-BILL': 5,
    USDC: 8,
    ETH: 15,
    BTC: 12,
    SPY: 20,
  };

  const base = baseRates[security.toUpperCase()] ?? 10;
  const multiplier = tierMultipliers[creditTier?.toUpperCase() ?? 'A'] ?? 1.0;
  return Math.round(base * multiplier * 100) / 100;
}

function getDemandMultiplier(amount: number): number {
  if (amount >= 10_000_000) return 1.5;
  if (amount >= 1_000_000) return 1.25;
  if (amount >= 100_000) return 1.1;
  return 1.0;
}

function getDurationFactor(days: number): number {
  if (days >= 365) return 1.4;
  if (days >= 180) return 1.25;
  if (days >= 90) return 1.15;
  if (days >= 30) return 1.05;
  return 1.0;
}

/* ─── Pill Component ─── */

interface FeePillProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

function FeePill({ label, value, icon, color }: FeePillProps) {
  return (
    <div className={cn(
      'flex items-center gap-2 rounded-lg border px-3 py-2',
      'bg-bg-primary border-border-default'
    )}>
      <div className={cn('flex h-6 w-6 items-center justify-center rounded-md', color)}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-text-tertiary">{label}</span>
        <span className="text-sm font-semibold font-mono-nums text-text-primary">{value}</span>
      </div>
    </div>
  );
}

/* ─── Component ─── */

function DynamicFeeDisplay({ security, creditTier, className }: DynamicFeeDisplayProps) {
  const [amount, setAmount] = useState<string>('');
  const [duration, setDuration] = useState<string>('');

  const feeBreakdown = useMemo(() => {
    const parsedAmount = parseFloat(amount) || 0;
    const parsedDuration = parseInt(duration, 10) || 0;

    const baseFee = getBaseFee(security, creditTier);
    const demandMultiplier = getDemandMultiplier(parsedAmount);
    const durationFactor = getDurationFactor(parsedDuration);
    const totalFee = Math.round(baseFee * demandMultiplier * durationFactor * 100) / 100;

    return { baseFee, demandMultiplier, durationFactor, totalFee };
  }, [amount, duration, security, creditTier]);

  return (
    <Card variant="default" padding="md" className={cn('flex flex-col gap-5', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Calculator className="h-4 w-4 text-accent-indigo" />
        <h3 className="text-sm font-semibold text-text-primary">Fee Calculator</h3>
        {creditTier && (
          <span className="ml-auto rounded-md bg-accent-indigo/10 px-2 py-0.5 text-[10px] font-semibold text-accent-indigo">
            {creditTier}
          </span>
        )}
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Borrow Amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={0}
        />
        <Input
          label="Duration (days)"
          type="number"
          placeholder="30"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          min={1}
        />
      </div>

      {/* Security label */}
      <div className="flex items-center gap-2 text-xs text-text-tertiary">
        <span>Security:</span>
        <span className="font-medium text-text-secondary">{security}</span>
      </div>

      {/* Fee Breakdown */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-wider text-text-tertiary">Fee Breakdown</span>

        <div className="flex flex-wrap items-center gap-2">
          <FeePill
            label="Base Fee"
            value={`${feeBreakdown.baseFee} bps`}
            icon={<Layers className="h-3 w-3 text-accent-teal" />}
            color="bg-accent-teal/10"
          />

          <Plus className="h-3.5 w-3.5 text-text-tertiary shrink-0" />

          <FeePill
            label="Demand"
            value={`${feeBreakdown.demandMultiplier}x`}
            icon={<TrendingUp className="h-3 w-3 text-accent-gold" />}
            color="bg-accent-gold/10"
          />

          <Plus className="h-3.5 w-3.5 text-text-tertiary shrink-0" />

          <FeePill
            label="Duration"
            value={`${feeBreakdown.durationFactor}x`}
            icon={<Clock className="h-3 w-3 text-accent-indigo" />}
            color="bg-accent-indigo/10"
          />
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between rounded-lg border border-accent-teal/20 bg-accent-teal/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <Equal className="h-4 w-4 text-accent-teal" />
          <span className="text-sm font-medium text-text-secondary">Total Fee</span>
        </div>
        <span className="text-lg font-bold font-mono-nums text-accent-teal">
          {feeBreakdown.totalFee} bps
        </span>
      </div>
    </Card>
  );
}

export { DynamicFeeDisplay, type DynamicFeeDisplayProps };
