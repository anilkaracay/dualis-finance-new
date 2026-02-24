'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Clock, Plus, Users, Zap } from 'lucide-react';
import { ProposalStatus, ProposalType } from '@dualis/shared';
import type { GovernanceProposal } from '@dualis/shared';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useGovernanceProposals, useVotingPower, useDelegations } from '@/hooks/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatVoteCount(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  return num.toLocaleString('en-US');
}

function computePercentages(forV: string, againstV: string, abstainV: string) {
  const f = parseFloat(forV);
  const a = parseFloat(againstV);
  const ab = parseFloat(abstainV);
  const total = f + a + ab;
  if (total === 0) return { forPct: 0, againstPct: 0, abstainPct: 0 };
  return {
    forPct: Math.round((f / total) * 100),
    againstPct: Math.round((a / total) * 100),
    abstainPct: Math.round((ab / total) * 100),
  };
}

function proposalTypeLabel(type: ProposalType): string {
  const map: Record<ProposalType, string> = {
    [ProposalType.PARAMETER_CHANGE]: 'Parameter Change',
    [ProposalType.NEW_POOL]: 'New Pool',
    [ProposalType.POOL_DEPRECATION]: 'Pool Deprecation',
    [ProposalType.COLLATERAL_ADD]: 'Add Collateral',
    [ProposalType.COLLATERAL_REMOVE]: 'Remove Collateral',
    [ProposalType.TREASURY_SPEND]: 'Treasury Spend',
    [ProposalType.EMERGENCY_ACTION]: 'Emergency',
    [ProposalType.PROTOCOL_UPGRADE]: 'Protocol Upgrade',
    [ProposalType.FEE_CHANGE]: 'Fee Change',
    [ProposalType.ORACLE_CONFIG]: 'Oracle Config',
  };
  return map[type] ?? type;
}

function proposalTypeBadgeVariant(type: ProposalType): 'info' | 'warning' | 'success' | 'danger' | 'default' {
  switch (type) {
    case ProposalType.EMERGENCY_ACTION: return 'danger';
    case ProposalType.PARAMETER_CHANGE:
    case ProposalType.FEE_CHANGE: return 'warning';
    case ProposalType.PROTOCOL_UPGRADE: return 'success';
    case ProposalType.NEW_POOL:
    case ProposalType.COLLATERAL_ADD: return 'info';
    default: return 'default';
  }
}

function statusBadgeVariant(status: ProposalStatus): 'info' | 'success' | 'danger' | 'warning' | 'default' {
  switch (status) {
    case ProposalStatus.ACTIVE: return 'info';
    case ProposalStatus.PASSED:
    case ProposalStatus.EXECUTED:
    case ProposalStatus.READY: return 'success';
    case ProposalStatus.REJECTED:
    case ProposalStatus.VETOED:
    case ProposalStatus.CANCELLED: return 'danger';
    case ProposalStatus.TIMELOCK: return 'warning';
    default: return 'default';
  }
}

function timeRemaining(endsAt?: string): string {
  if (!endsAt) return '';
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h remaining`;
  return `${hours}h remaining`;
}

const ACTIVE_STATUSES = new Set([ProposalStatus.ACTIVE, ProposalStatus.DRAFT]);
const PAST_STATUSES = new Set([
  ProposalStatus.PASSED, ProposalStatus.REJECTED, ProposalStatus.EXECUTED,
  ProposalStatus.VETOED, ProposalStatus.CANCELLED, ProposalStatus.EXPIRED,
  ProposalStatus.QUORUM_NOT_MET, ProposalStatus.TIMELOCK, ProposalStatus.READY,
]);

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function VoteTallyBar({ forV, againstV, abstainV }: { forV: string; againstV: string; abstainV: string }) {
  const { forPct, againstPct, abstainPct } = useMemo(
    () => computePercentages(forV, againstV, abstainV),
    [forV, againstV, abstainV],
  );

  return (
    <div className="space-y-2">
      <div className="flex h-2 w-full overflow-hidden rounded-full">
        <div className="bg-positive transition-all duration-300" style={{ width: `${forPct}%` }} />
        <div className="bg-negative transition-all duration-300" style={{ width: `${againstPct}%` }} />
        <div className="bg-bg-tertiary transition-all duration-300" style={{ width: `${abstainPct}%` }} />
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-positive">For {forPct}% ({formatVoteCount(forV)})</span>
        <span className="text-negative">Against {againstPct}% ({formatVoteCount(againstV)})</span>
        <span className="text-text-tertiary">Abstain {abstainPct}% ({formatVoteCount(abstainV)})</span>
      </div>
    </div>
  );
}

function ProposalCard({ proposal }: { proposal: GovernanceProposal }) {
  const remaining = timeRemaining(proposal.votingEndsAt);

  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-medium text-text-primary leading-snug">{proposal.title}</h3>
          <Badge variant={proposalTypeBadgeVariant(proposal.type)} size="sm" className="shrink-0">
            {proposalTypeLabel(proposal.type)}
          </Badge>
        </div>

        <p className="text-xs text-text-tertiary">
          by {proposal.proposerAddress.slice(0, 6)}...{proposal.proposerAddress.slice(-4)}
        </p>

        <VoteTallyBar forV={proposal.votesFor} againstV={proposal.votesAgainst} abstainV={proposal.votesAbstain} />

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            {proposal.quorumMet ? (
              <span className="flex items-center gap-1 text-xs text-positive">
                <Check className="h-3.5 w-3.5" /> Quorum reached
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-warning">
                <Clock className="h-3.5 w-3.5" /> Quorum pending
              </span>
            )}
            {remaining && (
              <span className="text-xs text-text-tertiary">{remaining}</span>
            )}
          </div>
          <Link href={`/governance/${proposal.id}`}>
            <Button variant="primary" size="sm" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
              Vote
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function PastProposalRow({ proposal }: { proposal: GovernanceProposal }) {
  const { forPct } = useMemo(
    () => computePercentages(proposal.votesFor, proposal.votesAgainst, proposal.votesAbstain),
    [proposal.votesFor, proposal.votesAgainst, proposal.votesAbstain],
  );

  return (
    <div className="flex items-center justify-between rounded-md border border-border-default bg-bg-tertiary px-5 py-4 hover:bg-bg-hover/50 transition-colors">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-text-primary">{proposal.title}</h4>
          <Badge variant={proposalTypeBadgeVariant(proposal.type)} size="sm">
            {proposalTypeLabel(proposal.type)}
          </Badge>
        </div>
        <p className="text-xs text-text-tertiary">
          by {proposal.proposerAddress.slice(0, 6)}...{proposal.proposerAddress.slice(-4)} &middot; For: {forPct}% ({formatVoteCount(proposal.votesFor)})
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={statusBadgeVariant(proposal.status)} size="sm">
          {proposal.status.charAt(0) + proposal.status.slice(1).toLowerCase()}
        </Badge>
        <Link href={`/governance/${proposal.id}`}>
          <Button variant="ghost" size="sm" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
            View
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

type TabFilter = 'active' | 'past' | 'all';

export default function GovernancePage() {
  const [tab, setTab] = useState<TabFilter>('active');
  const { data: proposals, isLoading, error } = useGovernanceProposals();
  const { data: votingPower } = useVotingPower();
  const { data: delegations } = useDelegations();

  const activeProposals = useMemo(
    () => (proposals ?? []).filter((p) => ACTIVE_STATUSES.has(p.status)),
    [proposals],
  );
  const pastProposals = useMemo(
    () => (proposals ?? []).filter((p) => PAST_STATUSES.has(p.status)),
    [proposals],
  );

  const activeDelegation = useMemo(
    () => (delegations ?? []).find((d) => d.isActive),
    [delegations],
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Governance</h1>
          <p className="mt-1 text-sm text-text-tertiary">DIP Proposals — vote on protocol changes</p>
        </div>
        <Link href="/governance/create">
          <Button variant="primary" size="sm" icon={<Plus className="h-4 w-4" />}>
            New Proposal
          </Button>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Zap className="h-5 w-5 text-accent-teal" />
            <div>
              <p className="text-xs text-text-tertiary">Your Voting Power</p>
              <p className="font-mono text-sm font-medium text-text-primary">
                {votingPower ? formatVoteCount(votingPower.effectiveVotingPower) : '—'} DUAL
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-accent-teal" />
            <div>
              <p className="text-xs text-text-tertiary">Delegation</p>
              <p className="text-sm font-medium text-text-primary">
                {activeDelegation
                  ? `Delegated to ${activeDelegation.delegateeAddress.slice(0, 6)}...${activeDelegation.delegateeAddress.slice(-4)}`
                  : 'Not delegated'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Check className="h-5 w-5 text-accent-teal" />
            <div>
              <p className="text-xs text-text-tertiary">Active Proposals</p>
              <p className="text-sm font-medium text-text-primary">{activeProposals.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-default pb-px">
        {(['active', 'past', 'all'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-accent-teal text-accent-teal'
                : 'border-transparent text-text-tertiary hover:text-text-primary'
            }`}
          >
            {t === 'active' ? 'Active' : t === 'past' ? 'Past' : 'All'}
          </button>
        ))}
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <p className="text-text-tertiary text-sm">Loading proposals...</p>
        </div>
      )}
      {error && (
        <div className="rounded-md border border-negative/30 bg-negative/5 px-4 py-3 text-sm text-negative">
          {error}
        </div>
      )}

      {/* Active Proposals */}
      {(tab === 'active' || tab === 'all') && activeProposals.length > 0 && (
        <section>
          <h2 className="text-label mb-4">Active Proposals</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {activeProposals.map((p) => (
              <ProposalCard key={p.id} proposal={p} />
            ))}
          </div>
        </section>
      )}

      {/* Past Proposals */}
      {(tab === 'past' || tab === 'all') && pastProposals.length > 0 && (
        <section>
          <h2 className="text-label mb-4">Past Proposals</h2>
          <div className="space-y-3">
            {pastProposals.map((p) => (
              <PastProposalRow key={p.id} proposal={p} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!isLoading && !error && (proposals ?? []).length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-text-tertiary text-sm">No proposals yet.</p>
          <p className="text-text-tertiary text-xs mt-1">Be the first to create a governance proposal.</p>
        </div>
      )}
    </div>
  );
}
