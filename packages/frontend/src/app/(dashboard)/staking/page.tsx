'use client';

import { useState } from 'react';
import {
  Coins,
  TrendingUp,
  Shield,
  Gift,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
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
import { KPICard } from '@/components/data-display/KPICard';
import { useWalletStore } from '@/stores/useWalletStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StakingParameter {
  label: string;
  value: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateSparkline(n: number, base: number, variance: number): number[] {
  const points: number[] = [];
  let current = base;
  for (let i = 0; i < n; i++) {
    current = current + (Math.sin(i * 1.3) * variance + variance * 0.2);
    points.push(Math.round(current * 100) / 100);
  }
  return points;
}

function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const STAKING_PARAMS: StakingParameter[] = [
  { label: 'Cooldown Period', value: '10 days' },
  { label: 'Slashing Percentage', value: '30%' },
  { label: 'Emission Rate', value: '100,000 DUAL/day' },
  { label: 'Min Stake', value: '100 DUAL' },
];

const SPARKLINE_STAKED = generateSparkline(7, 44, 2);
const SPARKLINE_REWARDS = generateSparkline(7, 1_100, 150);

// ---------------------------------------------------------------------------
// Sub-components: Dialogs
// ---------------------------------------------------------------------------

function StakeMoreDialog() {
  const [amount, setAmount] = useState('');

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="primary" size="sm">Stake More</Button>
      </DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Stake DUAL</DialogTitle>
          <DialogDescription>
            Enter the amount of DUAL tokens you want to stake.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            label="Amount (DUAL)"
            type="number"
            placeholder="e.g. 10,000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" size="sm">Cancel</Button>
            </DialogClose>
            <Button variant="primary" size="sm">
              Confirm Stake
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UnstakeDialog() {
  const [amount, setAmount] = useState('');

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">Unstake</Button>
      </DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Unstake DUAL</DialogTitle>
          <DialogDescription>
            Enter the amount of DUAL tokens you want to unstake.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            label="Amount (DUAL)"
            type="number"
            placeholder="e.g. 5,000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          {/* Cooldown Warning */}
          <div className="flex items-start gap-3 rounded-md border border-warning/30 bg-warning/10 p-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-warning mt-0.5" />
            <div>
              <p className="text-sm font-medium text-warning">10-day cooldown period</p>
              <p className="text-xs text-text-secondary mt-0.5">
                After initiating an unstake, your tokens will be locked for 10 days before they
                become available for withdrawal.
              </p>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" size="sm">Cancel</Button>
            </DialogClose>
            <Button variant="danger" size="sm">
              Confirm Unstake
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Sub-components: Sections
// ---------------------------------------------------------------------------

function YourStakeCard({ isConnected }: { isConnected: boolean }) {
  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Staked Position</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-8">
            <p className="text-text-tertiary text-sm">Connect your wallet to view your staking position.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Staked Position</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Position Details */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-md border border-border-subtle bg-bg-primary p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">Staked</p>
            <p className="mt-1 text-lg font-bold font-mono text-text-primary">25,000 DUAL</p>
            <p className="text-xs text-text-tertiary">{formatUSD(30_750)}</p>
          </div>
          <div className="rounded-md border border-border-subtle bg-bg-primary p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">Pending Rewards</p>
            <p className="mt-1 text-lg font-bold font-mono text-text-primary">123.45 DUAL</p>
          </div>
          <div className="rounded-md border border-border-subtle bg-bg-primary p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">Claimable</p>
            <p className="mt-1 text-lg font-bold font-mono text-positive">89.12 DUAL</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <StakeMoreDialog />
          <UnstakeDialog />
          <Button variant="success" size="sm" icon={<Gift className="h-4 w-4" />}>
            Claim Rewards
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SafetyModuleCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Safety Module</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-text-secondary leading-relaxed">
          Stake DUAL in the Safety Module to earn additional yield and help secure the protocol.
          The Safety Module acts as a backstop in the event of a shortfall event.
        </p>

        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">Current Size</p>
            <p className="mt-1 font-mono font-bold text-text-primary">$12.8M</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">Slashing Risk</p>
            <p className="mt-1 font-mono font-bold text-warning">Up to 30%</p>
          </div>
        </div>

        <Button variant="primary" size="sm" icon={<Shield className="h-4 w-4" />}>
          Stake in Safety Module
        </Button>
      </CardContent>
    </Card>
  );
}

function StakingParametersTable({ params }: { params: StakingParameter[] }) {
  return (
    <div className="overflow-hidden rounded-md border border-border-default bg-surface-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default">
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Parameter</th>
            <th className="px-4 py-3 text-right font-medium text-text-secondary">Value</th>
          </tr>
        </thead>
        <tbody>
          {params.map((param) => (
            <tr
              key={param.label}
              className="border-b border-border-default last:border-b-0 hover:bg-bg-hover transition-colors"
            >
              <td className="px-4 py-3 text-text-primary">{param.label}</td>
              <td className="px-4 py-3 text-right font-mono text-text-primary">{param.value}</td>
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

export default function StakingPage() {
  const { isConnected } = useWalletStore();

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Staking</h1>
      </div>

      {/* KPI Row */}
      <section>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard
            label="Total Staked"
            value={45_200_000}
            prefix="$"
            decimals={0}
            icon={<Coins className="h-4 w-4" />}
            sparkline={SPARKLINE_STAKED}
            trend="up"
            trendValue="+2.1%"
          />
          <KPICard
            label="Staking APY"
            value={8.5}
            suffix="%"
            decimals={1}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <KPICard
            label="Safety Module"
            value={12_800_000}
            prefix="$"
            decimals={0}
            icon={<Shield className="h-4 w-4" />}
          />
          <KPICard
            label="Your Rewards"
            value={1_234}
            prefix="$"
            decimals={0}
            icon={<Gift className="h-4 w-4" />}
            sparkline={SPARKLINE_REWARDS}
            trend="up"
            trendValue="+$89"
          />
        </div>
      </section>

      {/* Your Stake */}
      <section>
        <YourStakeCard isConnected={isConnected} />
      </section>

      {/* Safety Module */}
      <section>
        <SafetyModuleCard />
      </section>

      {/* Staking Parameters */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Staking Parameters</h2>
        <StakingParametersTable params={STAKING_PARAMS} />
      </section>
    </div>
  );
}
