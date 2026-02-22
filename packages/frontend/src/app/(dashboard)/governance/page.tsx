'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VoteTally {
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
}

interface Proposal {
  id: string;
  title: string;
  category: string;
  categoryVariant: 'info' | 'warning' | 'success' | 'danger' | 'default';
  proposer: string;
  votes: VoteTally;
  quorumReached: boolean;
  quorumPercentage: number;
  timeRemaining: string;
  status: 'active' | 'passed' | 'rejected' | 'executed';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatVoteCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return value.toLocaleString('en-US');
}

function computePercentages(votes: VoteTally): { forPct: number; againstPct: number; abstainPct: number } {
  const total = votes.forVotes + votes.againstVotes + votes.abstainVotes;
  if (total === 0) return { forPct: 0, againstPct: 0, abstainPct: 0 };
  return {
    forPct: Math.round((votes.forVotes / total) * 100),
    againstPct: Math.round((votes.againstVotes / total) * 100),
    abstainPct: Math.round((votes.abstainVotes / total) * 100),
  };
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const ACTIVE_PROPOSALS: Proposal[] = [
  {
    id: 'DIP-013',
    title: 'DIP-013: Add wETH as Collateral Asset',
    category: 'Asset Listing',
    categoryVariant: 'info',
    proposer: '0x1234...abcd',
    votes: {
      forVotes: 2_400_000,
      againstVotes: 850_000,
      abstainVotes: 280_000,
    },
    quorumReached: true,
    quorumPercentage: 100,
    timeRemaining: '4d 12h remaining',
    status: 'active',
  },
  {
    id: 'DIP-014',
    title: 'DIP-014: Reduce Reserve Factor to 0.5%',
    category: 'Parameter Change',
    categoryVariant: 'warning',
    proposer: '0xabcd...1234',
    votes: {
      forVotes: 1_200_000,
      againstVotes: 1_400_000,
      abstainVotes: 80_000,
    },
    quorumReached: false,
    quorumPercentage: 67,
    timeRemaining: '2d 8h remaining',
    status: 'active',
  },
  {
    id: 'DIP-015',
    title: 'DIP-015: Protocol V2.1 Upgrade',
    category: 'Protocol Upgrade',
    categoryVariant: 'success',
    proposer: '0x5678...ef01',
    votes: {
      forVotes: 3_100_000,
      againstVotes: 350_000,
      abstainVotes: 180_000,
    },
    quorumReached: true,
    quorumPercentage: 100,
    timeRemaining: '6d remaining',
    status: 'active',
  },
];

const PAST_PROPOSALS: Proposal[] = [
  {
    id: 'DIP-012',
    title: 'DIP-012: Increase USDC Borrow Cap to $500M',
    category: 'Parameter Change',
    categoryVariant: 'warning',
    proposer: '0x9abc...def0',
    votes: {
      forVotes: 4_200_000,
      againstVotes: 200_000,
      abstainVotes: 100_000,
    },
    quorumReached: true,
    quorumPercentage: 100,
    timeRemaining: '',
    status: 'executed',
  },
  {
    id: 'DIP-011',
    title: 'DIP-011: Add T-BILL-2026 Market',
    category: 'Asset Listing',
    categoryVariant: 'info',
    proposer: '0xdef0...9abc',
    votes: {
      forVotes: 3_800_000,
      againstVotes: 450_000,
      abstainVotes: 150_000,
    },
    quorumReached: true,
    quorumPercentage: 100,
    timeRemaining: '',
    status: 'passed',
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function VoteTallyBar({ votes }: { votes: VoteTally }) {
  const { forPct, againstPct, abstainPct } = useMemo(() => computePercentages(votes), [votes]);

  return (
    <div className="space-y-2">
      {/* Bar */}
      <div className="flex h-2 w-full overflow-hidden rounded-full">
        <div
          className="bg-positive transition-all duration-300"
          style={{ width: `${forPct}%` }}
        />
        <div
          className="bg-negative transition-all duration-300"
          style={{ width: `${againstPct}%` }}
        />
        <div
          className="bg-bg-tertiary transition-all duration-300"
          style={{ width: `${abstainPct}%` }}
        />
      </div>
      {/* Labels */}
      <div className="flex justify-between text-xs">
        <span className="text-positive">
          For {forPct}% ({formatVoteCount(votes.forVotes)})
        </span>
        <span className="text-negative">
          Against {againstPct}% ({formatVoteCount(votes.againstVotes)})
        </span>
        <span className="text-text-tertiary">
          Abstain {abstainPct}% ({formatVoteCount(votes.abstainVotes)})
        </span>
      </div>
    </div>
  );
}

function ProposalCard({ proposal }: { proposal: Proposal }) {
  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        {/* Title + Category */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-medium text-text-primary leading-snug">{proposal.title}</h3>
          <Badge variant={proposal.categoryVariant} size="sm" className="shrink-0">
            {proposal.category}
          </Badge>
        </div>

        {/* Proposer */}
        <p className="text-xs text-text-tertiary">
          by {proposal.proposer}
        </p>

        {/* Vote Tally */}
        <VoteTallyBar votes={proposal.votes} />

        {/* Footer: quorum + time + vote button */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            {/* Quorum status */}
            {proposal.quorumReached ? (
              <span className="flex items-center gap-1 text-xs text-positive">
                <Check className="h-3.5 w-3.5" />
                Quorum reached
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-warning">
                <Clock className="h-3.5 w-3.5" />
                {proposal.quorumPercentage}% to quorum
              </span>
            )}

            {/* Time remaining */}
            {proposal.timeRemaining && (
              <span className="text-xs text-text-tertiary">
                {proposal.timeRemaining}
              </span>
            )}
          </div>

          <Link href={`/governance/${proposal.id}`}>
            <Button
              variant="primary"
              size="sm"
              iconRight={<ArrowRight className="h-3.5 w-3.5" />}
            >
              Vote
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function PastProposalRow({ proposal }: { proposal: Proposal }) {
  const { forPct } = useMemo(() => computePercentages(proposal.votes), [proposal.votes]);

  const statusVariant = proposal.status === 'executed' ? 'success' : proposal.status === 'passed' ? 'info' : 'danger';
  const statusLabel = proposal.status === 'executed' ? 'Executed' : proposal.status === 'passed' ? 'Passed' : 'Rejected';

  return (
    <div className="flex items-center justify-between rounded-md border border-border-default bg-bg-tertiary px-5 py-4 hover:bg-bg-hover/50 transition-colors">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-text-primary">{proposal.title}</h4>
          <Badge variant={proposal.categoryVariant} size="sm">{proposal.category}</Badge>
        </div>
        <p className="text-xs text-text-tertiary">
          by {proposal.proposer} &middot; For: {forPct}% ({formatVoteCount(proposal.votes.forVotes)})
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={statusVariant} size="sm">{statusLabel}</Badge>
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

export default function GovernancePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary tracking-tight">Governance</h1>
        <p className="mt-1 text-sm text-text-tertiary">DIP Proposals</p>
      </div>

      {/* Active Proposals */}
      <section>
        <h2 className="text-label mb-4">Active Proposals</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {ACTIVE_PROPOSALS.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      </section>

      {/* Past Proposals */}
      <section>
        <h2 className="text-label mb-4">Past Proposals</h2>
        <div className="space-y-3">
          {PAST_PROPOSALS.map((proposal) => (
            <PastProposalRow key={proposal.id} proposal={proposal} />
          ))}
        </div>
      </section>
    </div>
  );
}
