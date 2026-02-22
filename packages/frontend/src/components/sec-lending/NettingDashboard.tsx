'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, type Column } from '@/components/ui/Table';
import { ArrowRightLeft, TrendingDown, Clock, CheckCircle2, XCircle } from 'lucide-react';

/* ─── Types ─── */

interface CounterpartyPosition {
  id: string;
  counterparty: string;
  weOwe: number;
  theyOwe: number;
  netExposure: number;
  security: string;
  lastUpdated: string;
}

interface NettingProposal {
  proposalId: string;
  counterparty: string;
  grossReduction: number;
  netAmount: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface NettingDashboardProps {
  className?: string;
}

/* ─── Mock Data ─── */

const mockPositions: CounterpartyPosition[] = [
  { id: '1', counterparty: 'Goldman Sachs', weOwe: 5_000_000, theyOwe: 3_200_000, netExposure: 1_800_000, security: 'T-BILL', lastUpdated: '2026-02-22T10:30:00Z' },
  { id: '2', counterparty: 'JP Morgan', weOwe: 2_800_000, theyOwe: 4_100_000, netExposure: -1_300_000, security: 'USDC', lastUpdated: '2026-02-22T09:15:00Z' },
  { id: '3', counterparty: 'Citadel Securities', weOwe: 7_500_000, theyOwe: 7_200_000, netExposure: 300_000, security: 'ETH', lastUpdated: '2026-02-22T11:00:00Z' },
  { id: '4', counterparty: 'BlackRock', weOwe: 1_200_000, theyOwe: 3_600_000, netExposure: -2_400_000, security: 'SPY', lastUpdated: '2026-02-21T16:45:00Z' },
  { id: '5', counterparty: 'Two Sigma', weOwe: 4_000_000, theyOwe: 3_900_000, netExposure: 100_000, security: 'BTC', lastUpdated: '2026-02-22T08:20:00Z' },
];

const mockProposals: NettingProposal[] = [
  { proposalId: 'np-001', counterparty: 'Goldman Sachs', grossReduction: 6_400_000, netAmount: 1_800_000, status: 'pending', createdAt: '2026-02-22T10:35:00Z' },
  { proposalId: 'np-002', counterparty: 'Citadel Securities', grossReduction: 14_400_000, netAmount: 300_000, status: 'accepted', createdAt: '2026-02-21T14:20:00Z' },
  { proposalId: 'np-003', counterparty: 'Two Sigma', grossReduction: 7_800_000, netAmount: 100_000, status: 'rejected', createdAt: '2026-02-20T09:00:00Z' },
];

/* ─── Helpers ─── */

function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString()}`;
}

function proposalStatusConfig(status: NettingProposal['status']) {
  switch (status) {
    case 'pending':
      return { variant: 'warning' as const, icon: Clock, label: 'Pending' };
    case 'accepted':
      return { variant: 'success' as const, icon: CheckCircle2, label: 'Accepted' };
    case 'rejected':
      return { variant: 'danger' as const, icon: XCircle, label: 'Rejected' };
  }
}

/* ─── Component ─── */

function NettingDashboard({ className }: NettingDashboardProps) {
  const [positions] = useState<CounterpartyPosition[]>(mockPositions);
  const [proposals] = useState<NettingProposal[]>(mockProposals);

  const totalGrossSavings = positions.reduce(
    (sum, p) => sum + Math.min(p.weOwe, p.theyOwe) * 2,
    0
  );
  const totalNetExposure = positions.reduce((sum, p) => sum + Math.abs(p.netExposure), 0);

  const columns: Column<CounterpartyPosition>[] = [
    {
      key: 'counterparty',
      header: 'Counterparty',
      cell: (row) => (
        <span className="font-medium text-text-primary">{row.counterparty}</span>
      ),
    },
    {
      key: 'security',
      header: 'Security',
      cell: (row) => (
        <Badge variant="outline" size="sm">{row.security}</Badge>
      ),
    },
    {
      key: 'weOwe',
      header: 'We Owe',
      numeric: true,
      cell: (row) => (
        <span className="text-negative">{formatCurrency(row.weOwe)}</span>
      ),
    },
    {
      key: 'theyOwe',
      header: 'They Owe',
      numeric: true,
      cell: (row) => (
        <span className="text-positive">{formatCurrency(row.theyOwe)}</span>
      ),
    },
    {
      key: 'netExposure',
      header: 'Net Exposure',
      numeric: true,
      sortable: true,
      cell: (row) => (
        <span className={cn(
          'font-semibold',
          row.netExposure > 0 ? 'text-negative' : 'text-positive'
        )}>
          {formatCurrency(row.netExposure)}
        </span>
      ),
    },
    {
      key: 'action',
      header: '',
      width: '140px',
      cell: (row) => (
        <Button
          variant="secondary"
          size="sm"
          icon={<ArrowRightLeft className="h-3 w-3" />}
          onClick={(e) => {
            e.stopPropagation();
            // Netting proposal action - to be wired
            void row;
          }}
        >
          Propose Netting
        </Button>
      ),
    },
  ];

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Savings Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card variant="default" padding="md">
          <span className="text-[10px] uppercase tracking-wider text-text-tertiary">
            Potential Gross Savings
          </span>
          <div className="mt-1 text-2xl font-bold font-mono-nums text-accent-teal">
            {formatCurrency(totalGrossSavings)}
          </div>
        </Card>
        <Card variant="default" padding="md">
          <span className="text-[10px] uppercase tracking-wider text-text-tertiary">
            Total Net Exposure
          </span>
          <div className="mt-1 text-2xl font-bold font-mono-nums text-text-primary">
            {formatCurrency(totalNetExposure)}
          </div>
        </Card>
        <Card variant="default" padding="md">
          <span className="text-[10px] uppercase tracking-wider text-text-tertiary">
            Netting Opportunities
          </span>
          <div className="mt-1 text-2xl font-bold font-mono-nums text-accent-gold">
            {positions.length}
          </div>
        </Card>
      </div>

      {/* Counterparty Positions Table */}
      <Card variant="default" padding="none">
        <CardHeader className="px-5 pt-5">
          <CardTitle>
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-accent-teal" />
              Mutual Positions
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            columns={columns}
            data={positions}
            rowKey={(row) => row.id}
            compact
          />
        </CardContent>
      </Card>

      {/* Active Netting Proposals */}
      <Card variant="default" padding="md">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-accent-indigo" />
              Netting Proposals
            </div>
          </CardTitle>
          <Badge variant="default" size="md">
            {proposals.filter((p) => p.status === 'pending').length} pending
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {proposals.map((proposal) => {
              const config = proposalStatusConfig(proposal.status);
              const StatusIcon = config.icon;
              return (
                <div
                  key={proposal.proposalId}
                  className={cn(
                    'flex items-center justify-between rounded-lg border border-border-default px-4 py-3',
                    'bg-bg-primary transition-colors hover:bg-bg-hover/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <StatusIcon className={cn(
                      'h-4 w-4',
                      config.variant === 'warning' && 'text-warning',
                      config.variant === 'success' && 'text-positive',
                      config.variant === 'danger' && 'text-negative'
                    )} />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-text-primary">
                        {proposal.counterparty}
                      </span>
                      <span className="text-xs text-text-tertiary">
                        {new Date(proposal.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase tracking-wider text-text-tertiary">Gross Reduction</span>
                      <span className="text-sm font-mono-nums text-positive">
                        {formatCurrency(proposal.grossReduction)}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase tracking-wider text-text-tertiary">Net Amount</span>
                      <span className="text-sm font-semibold font-mono-nums text-text-primary">
                        {formatCurrency(proposal.netAmount)}
                      </span>
                    </div>
                    <Badge variant={config.variant} size="sm">
                      {config.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export { NettingDashboard, type NettingDashboardProps };
