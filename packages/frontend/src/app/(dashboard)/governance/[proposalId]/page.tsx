'use client';

import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VoteTally {
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
}

type VoteChoice = 'for' | 'against' | 'abstain';

interface ProposalDetail {
  id: string;
  title: string;
  category: string;
  categoryVariant: 'info' | 'warning' | 'success';
  status: 'active' | 'passed' | 'rejected' | 'executed';
  proposer: string;
  votes: VoteTally;
  quorumReached: boolean;
  timeRemaining: string;
  description: string[];
  timelineStep: number;
  createdDate: string;
  votingStartDate: string;
  votingEndDate: string;
  executionDate: string;
}

interface RecentVote {
  voter: string;
  choice: VoteChoice;
  weight: number;
  time: string;
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

function getChoiceBadgeVariant(choice: VoteChoice): 'success' | 'danger' | 'default' {
  switch (choice) {
    case 'for':
      return 'success';
    case 'against':
      return 'danger';
    case 'abstain':
      return 'default';
  }
}

function getChoiceLabel(choice: VoteChoice): string {
  switch (choice) {
    case 'for':
      return 'For';
    case 'against':
      return 'Against';
    case 'abstain':
      return 'Abstain';
  }
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const PROPOSALS_MAP: Record<string, ProposalDetail> = {
  'DIP-013': {
    id: 'DIP-013',
    title: 'DIP-013: Add wETH as Collateral Asset',
    category: 'Asset Listing',
    categoryVariant: 'info',
    status: 'active',
    proposer: '0x1234567890abcdef1234567890abcdef12345678',
    votes: {
      forVotes: 2_400_000,
      againstVotes: 850_000,
      abstainVotes: 280_000,
    },
    quorumReached: true,
    timeRemaining: '4d 12h remaining',
    description: [
      'This proposal seeks to add Wrapped Ether (wETH) as an accepted collateral asset in the Dualis lending protocol.',
      'Background: wETH is one of the most liquid and widely-held assets in the DeFi ecosystem. Adding it as collateral will significantly expand the borrowing capacity available to users and attract a broader user base to the protocol.',
      'Specification: wETH will be added with the following parameters: Collateral Factor of 80%, Liquidation Threshold of 85%, Liquidation Penalty of 5%, and a Supply Cap of 50,000 wETH.',
      'Risk Assessment: The Dualis risk committee has reviewed wETH and determined it meets all criteria for inclusion as a collateral asset. Price oracle feeds are available from Chainlink with sufficient decentralization.',
    ],
    timelineStep: 1,
    createdDate: 'Feb 15, 2026',
    votingStartDate: 'Feb 17, 2026',
    votingEndDate: 'Feb 27, 2026',
    executionDate: 'Mar 1, 2026',
  },
  'DIP-014': {
    id: 'DIP-014',
    title: 'DIP-014: Reduce Reserve Factor to 0.5%',
    category: 'Parameter Change',
    categoryVariant: 'warning',
    status: 'active',
    proposer: '0xabcdef1234567890abcdef1234567890abcd1234',
    votes: {
      forVotes: 1_200_000,
      againstVotes: 1_400_000,
      abstainVotes: 80_000,
    },
    quorumReached: false,
    timeRemaining: '2d 8h remaining',
    description: [
      'This proposal aims to reduce the protocol reserve factor from the current 1% to 0.5% across all lending pools.',
      'Rationale: Reducing the reserve factor will increase the yield available to depositors, making the protocol more competitive with alternative lending platforms.',
      'Impact Analysis: The expected increase in supply APY is approximately 0.3-0.5% across major pools. Protocol revenue would decrease by approximately $120,000/month at current utilization levels.',
    ],
    timelineStep: 1,
    createdDate: 'Feb 18, 2026',
    votingStartDate: 'Feb 20, 2026',
    votingEndDate: 'Feb 28, 2026',
    executionDate: 'Mar 3, 2026',
  },
  'DIP-015': {
    id: 'DIP-015',
    title: 'DIP-015: Protocol V2.1 Upgrade',
    category: 'Protocol Upgrade',
    categoryVariant: 'success',
    status: 'active',
    proposer: '0x567890abcdef1234567890abcdef1234ef015678',
    votes: {
      forVotes: 3_100_000,
      againstVotes: 350_000,
      abstainVotes: 180_000,
    },
    quorumReached: true,
    timeRemaining: '6d remaining',
    description: [
      'This proposal authorizes the upgrade of the Dualis protocol to version 2.1, which includes several key improvements and optimizations.',
      'Key Changes: Improved interest rate model with dynamic curve adjustment, gas optimization reducing transaction costs by ~15%, enhanced liquidation mechanism with partial liquidation support, and new credit tier computation algorithm.',
      'Security: The V2.1 codebase has been audited by Trail of Bits and Certora. All critical and high severity findings have been addressed. The formal verification report is available for review.',
    ],
    timelineStep: 1,
    createdDate: 'Feb 14, 2026',
    votingStartDate: 'Feb 16, 2026',
    votingEndDate: 'Feb 28, 2026',
    executionDate: 'Mar 5, 2026',
  },
};

const RECENT_VOTES: RecentVote[] = [
  { voter: '0x1234...abcd', choice: 'for', weight: 250_000, time: '2h ago' },
  { voter: '0xabcd...1234', choice: 'against', weight: 120_000, time: '4h ago' },
  { voter: '0x5678...ef01', choice: 'for', weight: 500_000, time: '6h ago' },
  { voter: '0x9abc...def0', choice: 'abstain', weight: 80_000, time: '8h ago' },
  { voter: '0xdef0...9abc', choice: 'for', weight: 340_000, time: '12h ago' },
];

const DEFAULT_PROPOSAL_ID = 'DIP-013';

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

interface TimelineStepData {
  label: string;
  date: string;
  icon: React.ReactNode;
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
            {/* Connector + Icon */}
            <div className="flex w-full items-center">
              {idx > 0 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 transition-colors',
                    isCompleted || isActive ? 'bg-accent-teal' : 'bg-border-default'
                  )}
                />
              )}
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  isCompleted && 'border-accent-teal bg-accent-teal text-white',
                  isActive && 'border-accent-teal bg-accent-teal-muted text-accent-teal',
                  isFuture && 'border-border-default bg-bg-primary text-text-tertiary'
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs">{step.icon}</span>
                )}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 transition-colors',
                    isCompleted ? 'bg-accent-teal' : 'bg-border-default'
                  )}
                />
              )}
            </div>
            {/* Label + Date */}
            <div className="text-center">
              <p
                className={cn(
                  'text-xs font-medium',
                  isActive ? 'text-accent-teal' : isCompleted ? 'text-text-primary' : 'text-text-tertiary'
                )}
              >
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
  selectedVote,
  onVote,
}: {
  selectedVote: VoteChoice | undefined;
  onVote: (choice: VoteChoice) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cast Your Vote</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Button
            variant={selectedVote === 'for' ? 'success' : 'secondary'}
            size="md"
            className="flex-1"
            icon={<ThumbsUp className="h-4 w-4" />}
            onClick={() => onVote('for')}
          >
            For
          </Button>
          <Button
            variant={selectedVote === 'against' ? 'danger' : 'secondary'}
            size="md"
            className="flex-1"
            icon={<ThumbsDown className="h-4 w-4" />}
            onClick={() => onVote('against')}
          >
            Against
          </Button>
          <Button
            variant={selectedVote === 'abstain' ? 'ghost' : 'secondary'}
            size="md"
            className="flex-1"
            icon={<Minus className="h-4 w-4" />}
            onClick={() => onVote('abstain')}
          >
            Abstain
          </Button>
        </div>
        <p className="text-xs text-text-tertiary text-center">
          Your voting power: <span className="font-mono text-text-secondary">50,000 DUAL</span>
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Results Card
// ---------------------------------------------------------------------------

function ResultsCard({ votes }: { votes: VoteTally }) {
  const { forPct, againstPct, abstainPct } = useMemo(() => computePercentages(votes), [votes]);
  const total = votes.forVotes + votes.againstVotes + votes.abstainVotes;

  const results: Array<{ label: string; count: number; pct: number; colorClass: string; barClass: string }> = [
    { label: 'For', count: votes.forVotes, pct: forPct, colorClass: 'text-positive', barClass: 'bg-positive' },
    { label: 'Against', count: votes.againstVotes, pct: againstPct, colorClass: 'text-negative', barClass: 'bg-negative' },
    { label: 'Abstain', count: votes.abstainVotes, pct: abstainPct, colorClass: 'text-text-tertiary', barClass: 'bg-bg-tertiary' },
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
              <span className="text-text-secondary">
                {formatVoteCount(r.count)} ({r.pct}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-bg-tertiary">
              <div
                className={cn('h-full rounded-full transition-all duration-500', r.barClass)}
                style={{ width: `${r.pct}%` }}
              />
            </div>
          </div>
        ))}
        <p className="text-xs text-text-tertiary pt-2">
          Total votes: {formatVoteCount(total)}
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Recent Votes Table
// ---------------------------------------------------------------------------

function RecentVotesTable({ votes }: { votes: RecentVote[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border-default bg-bg-tertiary">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default">
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Voter</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Choice</th>
            <th className="px-4 py-3 text-right font-medium text-text-secondary">Weight</th>
            <th className="px-4 py-3 text-right font-medium text-text-secondary">Time</th>
          </tr>
        </thead>
        <tbody>
          {votes.map((vote, idx) => (
            <tr
              key={`${vote.voter}-${idx}`}
              className="border-b border-border-default last:border-b-0 hover:bg-bg-hover transition-colors"
            >
              <td className="px-4 py-3">
                <span className="font-mono text-xs text-text-secondary">{vote.voter}</span>
              </td>
              <td className="px-4 py-3">
                <Badge variant={getChoiceBadgeVariant(vote.choice)} size="sm">
                  {getChoiceLabel(vote.choice)}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-mono text-text-primary">{formatVoteCount(vote.weight)}</span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-xs text-text-tertiary">{vote.time}</span>
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
  const proposalId = params.proposalId ?? DEFAULT_PROPOSAL_ID;
  const proposal = PROPOSALS_MAP[proposalId] ?? PROPOSALS_MAP[DEFAULT_PROPOSAL_ID];
  const [selectedVote, setSelectedVote] = useState<VoteChoice | undefined>(undefined);

  if (!proposal) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-text-tertiary">Proposal not found.</p>
      </div>
    );
  }

  const statusVariant = proposal.status === 'active' ? 'info' : proposal.status === 'passed' || proposal.status === 'executed' ? 'success' : 'danger';
  const statusLabel = proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1);

  const timelineSteps: TimelineStepData[] = [
    { label: 'Created', date: proposal.createdDate, icon: <Circle className="h-3.5 w-3.5" /> },
    { label: 'Voting', date: proposal.votingStartDate, icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    { label: 'Ends', date: proposal.votingEndDate, icon: <Clock className="h-3.5 w-3.5" /> },
    { label: 'Execution', date: proposal.executionDate, icon: <PlayCircle className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/governance"
          className="flex items-center gap-1 text-text-tertiary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Governance
        </Link>
        <span className="text-text-tertiary">/</span>
        <span className="text-text-primary font-medium">{proposal.id}</span>
      </div>

      {/* Title + Badges */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <h1 className="text-xl font-semibold text-text-primary tracking-tight">{proposal.title}</h1>
        <div className="flex items-center gap-2">
          <Badge variant={proposal.categoryVariant} size="sm">{proposal.category}</Badge>
          <Badge variant={statusVariant} size="sm">{statusLabel}</Badge>
        </div>
      </div>

      {/* Vote Panel */}
      <VotePanel selectedVote={selectedVote} onVote={setSelectedVote} />

      {/* Results */}
      <ResultsCard votes={proposal.votes} />

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ProposalTimeline steps={timelineSteps} activeStep={proposal.timelineStep} />
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {proposal.description.map((paragraph, idx) => {
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
              <p key={idx} className="text-sm text-text-secondary leading-relaxed">
                {paragraph}
              </p>
            );
          })}
        </CardContent>
      </Card>

      {/* Recent Votes */}
      <section>
        <h2 className="text-label mb-4">Recent Votes</h2>
        <RecentVotesTable votes={RECENT_VOTES} />
      </section>
    </div>
  );
}
