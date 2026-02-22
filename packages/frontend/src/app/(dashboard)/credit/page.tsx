'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { CreditTierBadge } from '@/components/data-display/CreditTierBadge';
import { AreaChart } from '@/components/charts/AreaChart';
import { useCountUp } from '@/hooks/useCountUp';
import { useWalletStore } from '@/stores/useWalletStore';
import { usePositionStore } from '@/stores/usePositionStore';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CREDIT_SCORE = 742;
const CREDIT_SCORE_MAX = 1000;
const TIER_NAME = 'Gold' as const;
const TIER_COLOR = '#F59E0B';
const NEXT_TIER = 'Diamond';
const NEXT_TIER_THRESHOLD = 850;
const CURRENT_TIER_FLOOR = 700;

const SCORE_BREAKDOWN: Array<{
  label: string;
  score: number;
  max: number;
}> = [
  { label: 'Loan Completion', score: 256, max: 300 },
  { label: 'Repayment Speed', score: 218, max: 250 },
  { label: 'Volume History', score: 142, max: 200 },
  { label: 'Collateral Health', score: 150, max: 150 },
  { label: 'Securities Lending', score: 20, max: 100 },
];

interface TierBenefitRow {
  metric: string;
  diamond: string;
  gold: string;
  silver: string;
  bronze: string;
  unrated: string;
}

const TIER_BENEFITS: TierBenefitRow[] = [
  {
    metric: 'Min Collateral',
    diamond: '110%',
    gold: '120%',
    silver: '135%',
    bronze: '150%',
    unrated: '175%',
  },
  {
    metric: 'Max LTV',
    diamond: '90%',
    gold: '83%',
    silver: '74%',
    bronze: '67%',
    unrated: '57%',
  },
  {
    metric: 'Rate Discount',
    diamond: '-50bps',
    gold: '-30bps',
    silver: '-15bps',
    bronze: '0bps',
    unrated: '+25bps',
  },
];

const SCORE_HISTORY: Array<Record<string, unknown>> = [
  { month: 'Jan', score: 500 },
  { month: 'Feb', score: 520 },
  { month: 'Mar', score: 545 },
  { month: 'Apr', score: 560 },
  { month: 'May', score: 590 },
  { month: 'Jun', score: 620 },
  { month: 'Jul', score: 640 },
  { month: 'Aug', score: 660 },
  { month: 'Sep', score: 690 },
  { month: 'Oct', score: 710 },
  { month: 'Nov', score: 730 },
  { month: 'Dec', score: 742 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBarColor(percentage: number): { bar: string; text: string } {
  if (percentage >= 70) return { bar: 'bg-accent-teal', text: 'text-accent-teal' };
  if (percentage >= 40) return { bar: 'bg-warning', text: 'text-warning' };
  return { bar: 'bg-text-tertiary', text: 'text-text-tertiary' };
}

// ---------------------------------------------------------------------------
// Credit Score Ring (SVG)
// ---------------------------------------------------------------------------

function CreditScoreRing() {
  const [mounted, setMounted] = useState(false);
  const { formattedValue } = useCountUp({ end: CREDIT_SCORE, decimals: 0, duration: 1200 });

  useEffect(() => {
    setMounted(true);
  }, []);

  const size = 200;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const scorePercent = CREDIT_SCORE / CREDIT_SCORE_MAX;
  const dashOffset = circumference * (1 - scorePercent);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          {/* Background track */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-bg-tertiary"
          />
          {/* Score arc */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={TIER_COLOR}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={mounted ? dashOffset : circumference}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{
              transition: 'stroke-dashoffset 1200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-mono font-medium text-text-primary"
            style={{ fontSize: '2.5rem', lineHeight: 1 }}
          >
            {formattedValue}
          </span>
          <span className="text-sm font-medium mt-1" style={{ color: TIER_COLOR }}>
            {TIER_NAME}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero Section
// ---------------------------------------------------------------------------

function HeroSection() {
  const progressPercent =
    ((CREDIT_SCORE - CURRENT_TIER_FLOOR) / (NEXT_TIER_THRESHOLD - CURRENT_TIER_FLOOR)) * 100;
  const pointsNeeded = NEXT_TIER_THRESHOLD - CREDIT_SCORE;

  return (
    <div className="flex flex-col md:flex-row items-center gap-8">
      {/* Left: Score Ring */}
      <div className="shrink-0">
        <CreditScoreRing />
      </div>

      {/* Right: Details */}
      <div className="flex-1 space-y-4">
        <CreditTierBadge tier={TIER_NAME} size="lg" showScore score={CREDIT_SCORE} />

        <p className="text-text-secondary text-sm">
          Score:{' '}
          <span className="font-mono text-text-primary font-semibold">{CREDIT_SCORE}</span>
          {' / '}
          <span className="font-mono text-text-tertiary">
            {CREDIT_SCORE_MAX.toLocaleString('en-US')}
          </span>
        </p>

        <div className="space-y-2">
          <p className="text-sm text-text-secondary">
            {NEXT_TIER}:{' '}
            <span className="text-text-primary font-medium">
              need {pointsNeeded} more points
            </span>
          </p>
          <div className="w-full max-w-xs h-2 rounded-full bg-bg-tertiary overflow-hidden">
            <div
              className="h-full rounded-full bg-accent-teal transition-all duration-700"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          <p className="text-xs text-text-tertiary">
            {progressPercent.toFixed(0)}% to {NEXT_TIER}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Score Breakdown Bars
// ---------------------------------------------------------------------------

function ScoreBreakdown() {
  const [animatedWidths, setAnimatedWidths] = useState<number[]>(
    SCORE_BREAKDOWN.map(() => 0)
  );

  useEffect(() => {
    SCORE_BREAKDOWN.forEach((_, index) => {
      const timeout = setTimeout(() => {
        setAnimatedWidths((prev) => {
          const next = [...prev];
          const item = SCORE_BREAKDOWN[index];
          if (item) {
            next[index] = (item.score / item.max) * 100;
          }
          return next;
        });
      }, 200 + index * 100);

      return () => clearTimeout(timeout);
    });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Score Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {SCORE_BREAKDOWN.map((item, index) => {
            const percentage = (item.score / item.max) * 100;
            const colors = getBarColor(percentage);
            const currentWidth = animatedWidths[index] ?? 0;

            return (
              <div key={item.label} className="flex items-center gap-4">
                {/* Left: Label + Score */}
                <div className="w-44 shrink-0">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-text-primary font-medium">
                      {item.label}
                    </span>
                    <span className={cn('text-sm font-mono font-semibold', colors.text)}>
                      {item.score}
                    </span>
                  </div>
                </div>

                {/* Middle: Bar */}
                <div className="flex-1 h-2 rounded-full bg-bg-tertiary overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-accent-teal/60', colors.bar)}
                    style={{ width: `${currentWidth}%` }}
                  />
                </div>

                {/* Right: Score / Max */}
                <div className="w-20 text-right shrink-0">
                  <span className="text-xs font-mono text-text-tertiary">
                    {item.score} / {item.max}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Tier Benefits Comparison Table
// ---------------------------------------------------------------------------

type TierColumn = 'diamond' | 'gold' | 'silver' | 'bronze' | 'unrated';

const TIER_COLUMNS: Array<{ key: TierColumn; label: string }> = [
  { key: 'diamond', label: 'Diamond' },
  { key: 'gold', label: 'Gold' },
  { key: 'silver', label: 'Silver' },
  { key: 'bronze', label: 'Bronze' },
  { key: 'unrated', label: 'Unrated' },
];

function TierBenefitsTable() {
  const currentTierKey: TierColumn = 'gold';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tier Benefits Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default">
                <th className="px-4 py-3 text-left font-medium text-text-tertiary">
                  Metric
                </th>
                {TIER_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-center font-medium text-text-tertiary',
                      col.key === currentTierKey && 'bg-accent-teal/10'
                    )}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span>{col.label}</span>
                      {col.key === currentTierKey && (
                        <span className="text-xs text-accent-teal font-normal">
                          &#8592; You
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIER_BENEFITS.map((row) => (
                <tr
                  key={row.metric}
                  className="border-b border-border-default last:border-b-0"
                >
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {row.metric}
                  </td>
                  {TIER_COLUMNS.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3 text-center font-mono text-text-secondary',
                        col.key === currentTierKey && 'bg-accent-teal/10 text-text-primary font-semibold'
                      )}
                    >
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Credit History Chart
// ---------------------------------------------------------------------------

function CreditHistoryChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Score History</CardTitle>
      </CardHeader>
      <CardContent>
        <AreaChart
          data={SCORE_HISTORY}
          xKey="month"
          yKey="score"
          color={TIER_COLOR}
          height={280}
        />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function CreditPage() {
  const { isConnected } = useWalletStore();
  const { fetchPositions } = usePositionStore();

  useEffect(() => {
    if (isConnected) {
      fetchPositions('mock');
    }
  }, [isConnected, fetchPositions]);

  // ---------- Disconnected State ----------

  if (!isConnected) {
    return (
      <div className="space-y-8">
        <h1 className="text-lg font-medium text-text-primary">Credit Score</h1>
        <Card>
          <CardContent>
            <div className="flex flex-col items-center gap-4 py-16">
              <p className="text-text-tertiary text-sm">
                Connect your wallet to view your credit score and tier benefits.
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
      <h1 className="text-lg font-medium text-text-primary">Credit Score</h1>

      {/* 1. Hero Section — Credit Score Ring */}
      <section>
        <Card>
          <CardContent>
            <HeroSection />
          </CardContent>
        </Card>
      </section>

      {/* 2. Score Breakdown */}
      <section>
        <ScoreBreakdown />
      </section>

      {/* 3. Tier Benefits Comparison Table */}
      <section>
        <TierBenefitsTable />
      </section>

      {/* 4. Credit History Chart */}
      <section>
        <CreditHistoryChart />
      </section>
    </div>
  );
}
