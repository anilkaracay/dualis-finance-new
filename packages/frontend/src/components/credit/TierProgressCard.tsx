'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ArrowRight, TrendingUp, Sparkles } from 'lucide-react';
import type { CompositeScore, CreditTier } from '@dualis/shared';

interface TierProgressCardProps {
  /** Composite credit score data */
  compositeScore: CompositeScore | null;
  /** Additional CSS classes */
  className?: string | undefined;
}

interface TierProgressCardSkeletonProps {
  /** Additional CSS classes */
  className?: string | undefined;
}

const TIER_BADGE_MAP: Record<CreditTier, { variant: 'success' | 'warning' | 'info' | 'danger' | 'default'; colorClass: string }> = {
  Diamond: { variant: 'info', colorClass: 'text-accent-teal' },
  Gold: { variant: 'warning', colorClass: 'text-accent-gold' },
  Silver: { variant: 'default', colorClass: 'text-text-secondary' },
  Bronze: { variant: 'danger', colorClass: 'text-accent-gold' },
  Unrated: { variant: 'default', colorClass: 'text-text-tertiary' },
};

const TIER_SUGGESTIONS: Record<CreditTier, string[]> = {
  Unrated: [
    'Complete KYC verification to earn up to 50 points.',
    'Start borrowing and repaying on-time to build history.',
  ],
  Bronze: [
    'Submit a credit bureau attestation for up to 150 points.',
    'Improve repayment speed to boost on-chain score.',
  ],
  Silver: [
    'Verify your income to gain up to 100 off-chain points.',
    'Participate in governance staking for ecosystem points.',
  ],
  Gold: [
    'Add business verification for up to 50 more off-chain points.',
    'Build cross-protocol references for ecosystem growth.',
  ],
  Diamond: [
    'Maintain your excellent standing to keep Diamond benefits.',
    'Continue on-time repayments to protect your score.',
  ],
};

function TierProgressCard({ compositeScore, className }: TierProgressCardProps) {
  if (!compositeScore) {
    return <TierProgressCardSkeleton className={className} />;
  }

  const { tier, nextTier, compositeScore: score } = compositeScore;
  const isMaxTier = tier === 'Diamond';
  const currentTierConfig = TIER_BADGE_MAP[tier];
  const nextTierName = (nextTier.name as CreditTier) || 'Diamond';
  const nextTierConfig = TIER_BADGE_MAP[nextTierName] ?? TIER_BADGE_MAP.Diamond;

  const suggestions = useMemo(() => {
    return TIER_SUGGESTIONS[tier] ?? [];
  }, [tier]);

  const progressPercent = isMaxTier ? 100 : Math.min(100, Math.max(0, nextTier.progressPercent));

  return (
    <Card variant="default" padding="md" className={cn('w-full', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-accent-teal" />
        <h3 className="text-sm font-semibold text-text-primary">
          Tier Progress
        </h3>
      </div>

      {/* Tier badges + Progress bar */}
      <div className="flex items-center gap-3">
        {/* Current tier */}
        <Badge variant={currentTierConfig.variant} size="md" className="flex-shrink-0">
          {tier}
        </Badge>

        {/* Progress bar */}
        <div className="flex-1 relative">
          <div className="h-2 rounded-full bg-bg-secondary overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500 ease-out',
                isMaxTier
                  ? 'bg-gradient-to-r from-accent-teal to-accent-indigo'
                  : 'bg-accent-teal',
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {/* Score label */}
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] font-mono text-text-tertiary">
              {score}
            </span>
            {!isMaxTier && (
              <span className="text-[10px] font-mono text-text-tertiary">
                {nextTier.threshold}
              </span>
            )}
          </div>
        </div>

        {/* Next tier */}
        {!isMaxTier ? (
          <Badge
            variant={nextTierConfig.variant}
            size="md"
            className="flex-shrink-0 opacity-50"
          >
            {nextTierName}
          </Badge>
        ) : (
          <Sparkles className="h-4 w-4 text-accent-gold flex-shrink-0" />
        )}
      </div>

      {/* Points needed message */}
      <div className="mt-4 pt-3 border-t border-border-subtle">
        {isMaxTier ? (
          <p className="text-xs text-positive flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            You have reached the highest tier. Enjoy maximum benefits.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-text-secondary">
              <span className="font-semibold text-text-primary">
                {nextTier.pointsNeeded} more points
              </span>{' '}
              needed to reach{' '}
              <span className={cn('font-semibold', nextTierConfig.colorClass)}>
                {nextTierName}
              </span>
            </p>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-1.5">
                {suggestions.map((suggestion, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ArrowRight className="h-3 w-3 text-accent-teal mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-text-tertiary">{suggestion}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function TierProgressCardSkeleton({ className }: TierProgressCardSkeletonProps) {
  return (
    <Card variant="default" padding="md" className={cn('w-full', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Skeleton variant="rect" width={16} height={16} />
        <Skeleton variant="rect" width={100} height={14} />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton variant="rect" width={60} height={22} className="rounded-md" />
        <div className="flex-1">
          <Skeleton variant="rect" height={8} className="rounded-full" />
        </div>
        <Skeleton variant="rect" width={60} height={22} className="rounded-md opacity-50" />
      </div>
      <div className="mt-4 pt-3 border-t border-border-subtle">
        <Skeleton variant="rect" width={200} height={12} />
        <div className="mt-2 space-y-1.5">
          <Skeleton variant="rect" width="90%" height={12} />
          <Skeleton variant="rect" width="80%" height={12} />
        </div>
      </div>
    </Card>
  );
}

export {
  TierProgressCard,
  TierProgressCardSkeleton,
  type TierProgressCardProps,
  type TierProgressCardSkeletonProps,
};
