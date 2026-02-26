'use client';

import { useState, useEffect, useCallback } from 'react';
import {
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
import { Skeleton } from '@/components/ui/Skeleton';
import { useWalletStore } from '@/stores/useWalletStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StakingParameter {
  label: string;
  value: string;
}

interface StakingInfoData {
  totalStaked: number;
  stakingAPY: number;
  safetyModuleSize: number;
  safetyModuleAPY: number;
  cooldownPeriod: number;
  slashingPenalty: number;
  emissionRate: number;
  minStakeAmount: number;
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
            <p className="text-label">Staked</p>
            <p className="mt-1 text-lg font-medium font-mono text-text-primary">0 DUAL</p>
            <p className="text-xs text-text-tertiary">{formatUSD(0)}</p>
          </div>
          <div className="rounded-md border border-border-subtle bg-bg-primary p-4">
            <p className="text-label">Pending Rewards</p>
            <p className="mt-1 text-lg font-medium font-mono text-text-primary">0 DUAL</p>
          </div>
          <div className="rounded-md border border-border-subtle bg-bg-primary p-4">
            <p className="text-label">Claimable</p>
            <p className="mt-1 text-lg font-medium font-mono text-positive">0 DUAL</p>
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

function SafetyModuleCard({ safetyModuleSize }: { safetyModuleSize: number }) {
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
            <p className="text-label">Current Size</p>
            <p className="mt-1 font-mono font-medium text-text-primary">{formatUSD(safetyModuleSize)}</p>
          </div>
          <div>
            <p className="text-label">Slashing Risk</p>
            <p className="mt-1 font-mono font-medium text-warning">Up to 30%</p>
          </div>
        </div>

        <Button variant="primary" size="sm" icon={<Shield className="h-4 w-4" />} disabled>
          Stake in Safety Module (Coming Soon)
        </Button>
      </CardContent>
    </Card>
  );
}

function StakingParametersTable({ params }: { params: StakingParameter[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border-default bg-bg-tertiary shadow-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default bg-bg-secondary/40">
            <th className="text-label px-4 h-9 text-left">Parameter</th>
            <th className="text-label px-4 h-9 text-right">Value</th>
          </tr>
        </thead>
        <tbody>
          {params.map((param) => (
            <tr
              key={param.label}
              className="border-b border-border-default last:border-b-0 h-12 hover:bg-surface-selected table-row-interactive transition-colors"
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

const SPARKLINE_STAKED = generateSparkline(7, 44, 2);
const SPARKLINE_REWARDS = generateSparkline(7, 1_100, 150);

export default function StakingPage() {
  const { isConnected } = useWalletStore();
  const [stakingInfo, setStakingInfo] = useState<StakingInfoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStakingData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { apiClient } = await import('@/lib/api/client');
      const infoRes = await apiClient.get<{ data: StakingInfoData }>('/staking/info');
      const body = infoRes.data;
      const info = (body as { data?: StakingInfoData }).data ?? body;
      setStakingInfo(info as StakingInfoData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch staking data';
      console.warn('[Staking] API failed:', msg);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStakingData();
  }, [fetchStakingData]);

  // Derived values from API data or defaults
  const totalStaked = stakingInfo?.totalStaked ?? 0;
  const stakingAPY = stakingInfo?.stakingAPY ?? 0;
  const safetyModuleSize = stakingInfo?.safetyModuleSize ?? 0;

  const stakingParams: StakingParameter[] = [
    { label: 'Cooldown Period', value: stakingInfo ? `${stakingInfo.cooldownPeriod} days` : '\u2014' },
    { label: 'Slashing Percentage', value: stakingInfo ? `${(stakingInfo.slashingPenalty * 100).toFixed(0)}%` : '\u2014' },
    { label: 'Emission Rate', value: stakingInfo ? `${stakingInfo.emissionRate.toLocaleString()} DUAL/day` : '\u2014' },
    { label: 'Min Stake', value: stakingInfo ? `${stakingInfo.minStakeAmount.toLocaleString()} DUAL` : '\u2014' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Staking</h1>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rect" height={120} width="100%" />
          ))}
        </div>
        <Skeleton variant="rect" height={200} width="100%" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <h1 className="text-2xl font-bold text-text-primary tracking-tight">Staking</h1>

      {/* API error banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3">
          <span className="text-warning text-lg mt-0.5">&#9888;</span>
          <div>
            <p className="text-sm font-medium text-warning">Staking data unavailable</p>
            <p className="text-xs text-text-tertiary mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* KPI Row */}
      <section>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard
            label="Total Staked"
            value={totalStaked}
            prefix="$"
            decimals={0}
            sparkline={SPARKLINE_STAKED}
            trend="up"
            trendValue="+2.1%"
            index={0}
          />
          <KPICard
            label="Staking APY"
            value={stakingAPY * 100}
            suffix="%"
            decimals={1}
            index={1}
          />
          <KPICard
            label="Safety Module"
            value={safetyModuleSize}
            prefix="$"
            decimals={0}
            index={2}
          />
          <KPICard
            label="Your Rewards"
            value={0}
            prefix="$"
            decimals={0}
            sparkline={SPARKLINE_REWARDS}
            index={3}
          />
        </div>
      </section>

      {/* Your Stake */}
      <section>
        <YourStakeCard isConnected={isConnected} />
      </section>

      {/* Safety Module */}
      <section>
        <SafetyModuleCard safetyModuleSize={safetyModuleSize} />
      </section>

      {/* Staking Parameters */}
      <section>
        <h2 className="text-label mb-4">Staking Parameters</h2>
        <StakingParametersTable params={stakingParams} />
      </section>
    </div>
  );
}
