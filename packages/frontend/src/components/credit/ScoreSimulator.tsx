'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { CompositeScoreRing } from '@/components/credit/CompositeScoreRing';
import {
  Wand2,
  Shield,
  DollarSign,
  Building,
  CheckCircle,
  Globe,
  Link2,
  Lock,
  RotateCcw,
} from 'lucide-react';
import { useCompositeScoreStore } from '@/stores/useCompositeScoreStore';
import type { AttestationType, CompositeScore } from '@dualis/shared';

interface SimulationOption {
  /** Attestation type this option simulates */
  type: AttestationType;
  /** Display label */
  label: string;
  /** Description of the attestation */
  description: string;
  /** Estimated point gain */
  estimatedPoints: number;
  /** Icon component */
  icon: React.ElementType;
  /** Which layer this contributes to */
  layer: 'offChain' | 'ecosystem';
}

const SIMULATION_OPTIONS: SimulationOption[] = [
  {
    type: 'credit_bureau',
    label: 'Credit Bureau Score',
    description: 'Submit a ZK proof of credit bureau score range',
    estimatedPoints: 150,
    icon: Shield,
    layer: 'offChain',
  },
  {
    type: 'income_verification',
    label: 'Income Verification',
    description: 'Prove income range without revealing exact amount',
    estimatedPoints: 100,
    icon: DollarSign,
    layer: 'offChain',
  },
  {
    type: 'business_verification',
    label: 'Business Verification',
    description: 'Verify registered business standing',
    estimatedPoints: 50,
    icon: Building,
    layer: 'offChain',
  },
  {
    type: 'kyc_completion',
    label: 'KYC Completion',
    description: 'Complete identity verification',
    estimatedPoints: 50,
    icon: CheckCircle,
    layer: 'offChain',
  },
  {
    type: 'tifa_performance',
    label: 'TIFA Performance',
    description: 'Track record from TIFA ecosystem',
    estimatedPoints: 100,
    icon: Globe,
    layer: 'ecosystem',
  },
  {
    type: 'cross_protocol',
    label: 'Cross-Protocol References',
    description: 'Verified credit history from other protocols',
    estimatedPoints: 80,
    icon: Link2,
    layer: 'ecosystem',
  },
];

function getTierFromScore(score: number): string {
  if (score >= 850) return 'Diamond';
  if (score >= 700) return 'Gold';
  if (score >= 500) return 'Silver';
  if (score >= 300) return 'Bronze';
  return 'Unrated';
}

function ScoreSimulator() {
  const { compositeScore, isLoading, fetchCompositeScore } = useCompositeScoreStore();
  const [selectedOptions, setSelectedOptions] = useState<Set<AttestationType>>(new Set());

  useEffect(() => {
    if (!compositeScore && !isLoading) {
      fetchCompositeScore();
    }
  }, [compositeScore, isLoading, fetchCompositeScore]);

  const handleToggle = useCallback((type: AttestationType) => {
    setSelectedOptions((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setSelectedOptions(new Set());
  }, []);

  const totalEstimatedGain = useMemo(() => {
    let total = 0;
    for (const option of SIMULATION_OPTIONS) {
      if (selectedOptions.has(option.type)) {
        total += option.estimatedPoints;
      }
    }
    return total;
  }, [selectedOptions]);

  const simulatedScore: CompositeScore | null = useMemo(() => {
    if (!compositeScore || selectedOptions.size === 0) return compositeScore;

    let offChainBonus = 0;
    let ecosystemBonus = 0;

    for (const option of SIMULATION_OPTIONS) {
      if (selectedOptions.has(option.type)) {
        if (option.layer === 'offChain') {
          offChainBonus += option.estimatedPoints;
        } else {
          ecosystemBonus += option.estimatedPoints;
        }
      }
    }

    const newOffChain = Math.min(350, compositeScore.layers.offChain.score + offChainBonus);
    const newEcosystem = Math.min(250, compositeScore.layers.ecosystem.score + ecosystemBonus);
    const newTotal = compositeScore.layers.onChain.score + newOffChain + newEcosystem;
    const clampedTotal = Math.min(1000, newTotal);
    const newTier = getTierFromScore(clampedTotal);

    return {
      ...compositeScore,
      compositeScore: clampedTotal,
      tier: newTier as CompositeScore['tier'],
      layers: {
        onChain: compositeScore.layers.onChain,
        offChain: { score: newOffChain, max: 350 },
        ecosystem: { score: newEcosystem, max: 250 },
      },
      offChainDetail: {
        ...compositeScore.offChainDetail,
        total: newOffChain,
      },
      ecosystemDetail: {
        ...compositeScore.ecosystemDetail,
        total: newEcosystem,
      },
      nextTier: {
        ...compositeScore.nextTier,
        pointsNeeded: Math.max(0, (newTier === 'Diamond' ? 1000 : newTier === 'Gold' ? 850 : newTier === 'Silver' ? 700 : 500) - clampedTotal),
        progressPercent: Math.min(100, Math.round((clampedTotal / 1000) * 100)),
      },
    };
  }, [compositeScore, selectedOptions]);

  if (isLoading || !compositeScore) {
    return (
      <Card variant="default" padding="lg" className="w-full">
        <CardHeader>
          <Skeleton variant="rect" width={180} height={20} />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6">
            <Skeleton variant="circle" width={200} height={200} />
            <div className="flex-1 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="rect" height={56} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasChanges = selectedOptions.size > 0;

  return (
    <Card variant="default" padding="lg" className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-accent-indigo" />
          Score Simulator
        </CardTitle>
        {hasChanges && (
          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={handleReset}
          >
            Reset
          </Button>
        )}
      </CardHeader>

      <CardContent>
        <p className="text-xs text-text-tertiary mb-5">
          Explore how adding attestations could improve your credit score.
          Check the boxes below to see estimated impact.
        </p>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Ring preview */}
          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            <CompositeScoreRing
              compositeScore={simulatedScore}
              size="md"
              animated={false}
            />
            {hasChanges && (
              <div className="flex items-center gap-1.5">
                <Badge variant="success" size="sm">
                  +{totalEstimatedGain} pts
                </Badge>
                {simulatedScore && simulatedScore.tier !== compositeScore.tier && (
                  <Badge variant="info" size="sm">
                    {simulatedScore.tier}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Checkboxes */}
          <div className="flex-1 space-y-2">
            {SIMULATION_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isChecked = selectedOptions.has(option.type);

              return (
                <label
                  key={option.type}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-150',
                    isChecked
                      ? 'border-accent-indigo/40 bg-accent-indigo/5'
                      : 'border-border-default hover:bg-bg-hover hover:border-border-hover',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggle(option.type)}
                    className={cn(
                      'h-4 w-4 rounded border-border-default',
                      'text-accent-indigo focus:ring-accent-indigo/30 focus:ring-2',
                      'cursor-pointer',
                    )}
                  />
                  <div
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0',
                      isChecked ? 'bg-accent-indigo/15 text-accent-indigo' : 'bg-bg-secondary text-text-tertiary',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        'text-sm font-medium',
                        isChecked ? 'text-text-primary' : 'text-text-secondary',
                      )}>
                        {option.label}
                      </span>
                      <Badge
                        variant={isChecked ? 'success' : 'outline'}
                        size="sm"
                        className="flex-shrink-0"
                      >
                        +{option.estimatedPoints}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-tertiary mt-0.5 truncate">
                      {option.description}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Apply button -- disabled with coming soon */}
        <div className="mt-6 pt-4 border-t border-border-subtle flex items-center justify-between">
          <p className="text-xs text-text-tertiary flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            Estimates are approximate. Actual scores depend on proof verification.
          </p>
          <Button
            variant="primary"
            size="md"
            disabled
            icon={<Lock className="h-3.5 w-3.5" />}
          >
            Apply -- Coming soon
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { ScoreSimulator };
