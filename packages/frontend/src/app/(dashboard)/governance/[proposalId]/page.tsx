'use client';

import { useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Clock,
  CheckCircle2,
  Circle,
  PlayCircle,
  Shield,
} from 'lucide-react';
import { ProposalStatus, VoteDirection } from '@dualis/shared';
import type { GovernanceProposal, GovernanceVote } from '@dualis/shared';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useProposalDetail, useProposalVotes, useMyVote, useVotingPower, useCastVote } from '@/hooks/api';

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

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function directionLabel(d: VoteDirection): string {
  switch (d) {
    case VoteDirection.FOR: return 'For';
    case VoteDirection.AGAINST: return 'Against';
    case VoteDirection.ABSTAIN: return 'Abstain';
  }
}

function directionBadgeVariant(d: VoteDirection): 'success' | 'danger' | 'default' {
  switch (d) {
    case VoteDirection.FOR: return 'success';
    case VoteDirection.AGAINST: return 'danger';
    case VoteDirection.ABSTAIN: return 'default';
  }
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

interface TimelineStepData {
  label: string;
  date: string;
  icon: React.ReactNode;
}

function getTimelineStep(proposal: GovernanceProposal): number {
  switch (proposal.status) {
    case ProposalStatus.DRAFT: return 0;
    case ProposalStatus.ACTIVE: return 1;
    case ProposalStatus.PASSED:
    case ProposalStatus.REJECTED:
    case ProposalStatus.QUORUM_NOT_MET: return 2;
    case ProposalStatus.TIMELOCK: return 2;
    case ProposalStatus.READY: return 3;
    case ProposalStatus.EXECUTED: return 4;
    default: return 2;
  }
}

function ProposalTimeline({ steps, activeStep }: { steps: TimelineStepData[]; activeStep: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      {steps.map((step, idx) => {
        const isCompleted = idx < activeStep;
        const isActive = idx === activeStep;
        const isFuture = idx > activeStep;

        return (
          <div key={step.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full items-center">
              {idx > 0 && (
                <div className={cn('h-0.5 flex-1 transition-colors', isCompleted || isActive ? 'bg-accent-teal' : 'bg-border-default')} />
              )}
              <div className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                isCompleted && 'border-accent-teal bg-accent-teal text-white',
                isActive && 'border-accent-teal bg-accent-teal-muted text-accent-teal',
                isFuture && 'border-border-default bg-bg-primary text-text-tertiary',
              )}>
                {isCompleted ? <Check className="h-4 w-4" /> : <span className="text-xs">{step.icon}</span>}
              </div>
              {idx < steps.length - 1 && (
                <div className={cn('h-0.5 flex-1 transition-colors', isCompleted ? 'bg-accent-teal' : 'bg-border-default')} />
              )}
            </div>
            <div className="text-center">
              <p className={cn('text-xs font-medium', isActive ? 'text-accent-teal' : isCompleted ? 'text-text-primary' : 'text-text-tertiary')}>
                {step.label}
              </p>
              <p className="text-xs text-text-tertiary">{step.date}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vote Panel
// ---------------------------------------------------------------------------

function VotePanel({
  proposal,
  existingVote,
  votingPower,
  onVote,
  isVoting,
}: {
  proposal: GovernanceProposal;
  existingVote: GovernanceVote | null;
  votingPower: string;
  onVote: (direction: VoteDirection) => void;
  isVoting: boolean;
}) {
  const isActive = proposal.status === ProposalStatus.ACTIVE;
  const hasVoted = !!existingVote;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cast Your Vote</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasVoted && (
          <div className="rounded-md border border-accent-teal/30 bg-accent-teal/5 px-3 py-2 text-sm text-accent-teal">
            You voted <strong>{directionLabel(existingVote.direction)}</strong>. You can change your vote below.
          </div>
        )}
        <div className="flex gap-3">
          <Button
            variant={existingVote?.direction === VoteDirection.FOR ? 'success' : 'secondary'}
            size="md"
            className="flex-1"
            icon={<ThumbsUp className="h-4 w-4" />}
            onClick={() => onVote(VoteDirection.FOR)}
            disabled={!isActive || isVoting}
          >
            For
          </Button>
          <Button
            variant={existingVote?.direction === VoteDirection.AGAINST ? 'danger' : 'secondary'}
            size="md"
            className="flex-1"
            icon={<ThumbsDown className="h-4 w-4" />}
            onClick={() => onVote(VoteDirection.AGAINST)}
            disabled={!isActive || isVoting}
          >
            Against
          </Button>
          <Button
            variant={existingVote?.direction === VoteDirection.ABSTAIN ? 'ghost' : 'secondary'}
            size="md"
            className="flex-1"
            icon={<Minus className="h-4 w-4" />}
            onClick={() => onVote(VoteDirection.ABSTAIN)}
            disabled={!isActive || isVoting}
          >
            Abstain
          </Button>
        </div>
        <p className="text-xs text-text-tertiary text-center">
          Your voting power: <span className="font-mono text-text-secondary">{formatVoteCount(votingPower)} DUAL</span>
        </p>
        {!isActive && (
          <p className="text-xs text-warning text-center">Voting is no longer active for this proposal.</p>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Results Card
// ---------------------------------------------------------------------------

function ResultsCard({ proposal }: { proposal: GovernanceProposal }) {
  const { forPct, againstPct, abstainPct } = useMemo(
    () => computePercentages(proposal.votesFor, proposal.votesAgainst, proposal.votesAbstain),
    [proposal.votesFor, proposal.votesAgainst, proposal.votesAbstain],
  );
  const total = parseFloat(proposal.votesFor) + parseFloat(proposal.votesAgainst) + parseFloat(proposal.votesAbstain);

  const results = [
    { label: 'For', count: proposal.votesFor, pct: forPct, colorClass: 'text-positive', barClass: 'bg-positive' },
    { label: 'Against', count: proposal.votesAgainst, pct: againstPct, colorClass: 'text-negative', barClass: 'bg-negative' },
    { label: 'Abstain', count: proposal.votesAbstain, pct: abstainPct, colorClass: 'text-text-tertiary', barClass: 'bg-bg-tertiary' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {results.map((r) => (
          <div key={r.label} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className={cn('font-medium', r.colorClass)}>{r.label}</span>
              <span className="text-text-secondary">{formatVoteCount(r.count)} ({r.pct}%)</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-bg-tertiary">
              <div className={cn('h-full rounded-full transition-all duration-500', r.barClass)} style={{ width: `${r.pct}%` }} />
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between text-xs text-text-tertiary pt-2">
          <span>Total votes: {formatVoteCount(total)}</span>
          <span>
            {proposal.quorumMet ? (
              <span className="text-positive flex items-center gap-1"><Check className="h-3 w-3" /> Quorum met</span>
            ) : (
              <span className="text-warning flex items-center gap-1"><Clock className="h-3 w-3" /> Quorum pending ({formatVoteCount(proposal.quorumRequired)} required)</span>
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Recent Votes Table
// ---------------------------------------------------------------------------

function RecentVotesTable({ votes }: { votes: GovernanceVote[] }) {
  if (votes.length === 0) {
    return <p className="text-sm text-text-tertiary">No votes yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border-default bg-bg-tertiary">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default">
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Voter</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Choice</th>
            <th className="px-4 py-3 text-right font-medium text-text-secondary">Weight</th>
          </tr>
        </thead>
        <tbody>
          {votes.slice(0, 20).map((vote) => (
            <tr key={vote.id} className="border-b border-border-default last:border-b-0 hover:bg-bg-hover transition-colors">
              <td className="px-4 py-3">
                <span className="font-mono text-xs text-text-secondary">
                  {vote.voterAddress.slice(0, 6)}...{vote.voterAddress.slice(-4)}
                </span>
              </td>
              <td className="px-4 py-3">
                <Badge variant={directionBadgeVariant(vote.direction)} size="sm">
                  {directionLabel(vote.direction)}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-mono text-text-primary">{formatVoteCount(vote.weight)}</span>
              </td>
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

export default function ProposalDetailPage() {
  const params = useParams<{ proposalId: string }>();
  const proposalId = params.proposalId;

  const { data: proposal, isLoading, error, refetch: refetchProposal } = useProposalDetail(proposalId);
  const { data: voteResults, refetch: refetchVotes } = useProposalVotes(proposalId);
  const { data: myVote, refetch: refetchMyVote } = useMyVote(proposalId);
  const { data: votingPower } = useVotingPower();
  const castVote = useCastVote();

  const handleVote = useCallback(async (direction: VoteDirection) => {
    if (!proposalId) return;
    try {
      await castVote.execute(proposalId, { direction });
      await Promise.all([refetchProposal(), refetchVotes(), refetchMyVote()]);
    } catch {
      // error is available via castVote.error
    }
  }, [proposalId, castVote, refetchProposal, refetchVotes, refetchMyVote]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-text-tertiary text-sm">Loading proposal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/governance" className="flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary">
          <ArrowLeft className="h-4 w-4" /> Governance
        </Link>
        <div className="rounded-md border border-negative/30 bg-negative/5 px-4 py-3 text-sm text-negative">{error}</div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="space-y-4">
        <Link href="/governance" className="flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary">
          <ArrowLeft className="h-4 w-4" /> Governance
        </Link>
        <div className="flex items-center justify-center py-20">
          <p className="text-text-tertiary">Proposal not found.</p>
        </div>
      </div>
    );
  }

  const timelineSteps: TimelineStepData[] = [
    { label: 'Created', date: formatDate(proposal.createdAt), icon: <Circle className="h-3.5 w-3.5" /> },
    { label: 'Voting', date: formatDate(proposal.votingStartsAt), icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    { label: 'Ends', date: formatDate(proposal.votingEndsAt), icon: <Clock className="h-3.5 w-3.5" /> },
    { label: 'Timelock', date: formatDate(proposal.timelockEndsAt), icon: <Shield className="h-3.5 w-3.5" /> },
    { label: 'Execution', date: formatDate(proposal.executedAt ?? proposal.executionDeadline), icon: <PlayCircle className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/governance" className="flex items-center gap-1 text-text-tertiary hover:text-text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> Governance
        </Link>
        <span className="text-text-tertiary">/</span>
        <span className="text-text-primary font-medium">{proposal.id}</span>
      </div>

      {/* Title + Badges */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <h1 className="text-xl font-semibold text-text-primary tracking-tight">{proposal.title}</h1>
        <div className="flex items-center gap-2">
          <Badge variant={statusBadgeVariant(proposal.status)} size="sm">
            {proposal.status.charAt(0) + proposal.status.slice(1).toLowerCase().replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>

      {/* Vote Panel */}
      <VotePanel
        proposal={proposal}
        existingVote={myVote ?? null}
        votingPower={votingPower?.effectiveVotingPower ?? '0'}
        onVote={handleVote}
        isVoting={castVote.isLoading}
      />
      {castVote.error && (
        <div className="rounded-md border border-negative/30 bg-negative/5 px-4 py-3 text-sm text-negative">
          {castVote.error}
        </div>
      )}

      {/* Results */}
      <ResultsCard proposal={proposal} />

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ProposalTimeline steps={timelineSteps} activeStep={getTimelineStep(proposal)} />
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {proposal.description.split('\n').filter(Boolean).map((paragraph, idx) => {
            const colonIndex = paragraph.indexOf(':');
            if (colonIndex > 0 && colonIndex < 30) {
              const heading = paragraph.slice(0, colonIndex);
              const body = paragraph.slice(colonIndex + 1);
              return (
                <div key={idx}>
                  <h4 className="text-sm font-semibold text-text-primary mb-1">{heading}</h4>
                  <p className="text-sm text-text-secondary leading-relaxed">{body.trim()}</p>
                </div>
              );
            }
            return (
              <p key={idx} className="text-sm text-text-secondary leading-relaxed">{paragraph}</p>
            );
          })}
          {proposal.discussionUrl && (
            <p className="text-sm">
              <a href={proposal.discussionUrl} target="_blank" rel="noopener noreferrer" className="text-accent-teal hover:underline">
                View Discussion &rarr;
              </a>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Votes */}
      <section>
        <h2 className="text-label mb-4">Votes ({proposal.totalVoters})</h2>
        <RecentVotesTable votes={voteResults?.votes ?? []} />
      </section>
    </div>
  );
}
