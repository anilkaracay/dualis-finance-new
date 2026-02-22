'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import type { CompositeScore } from '@dualis/shared';

type RingSize = 'sm' | 'md' | 'lg';

interface CompositeScoreRingProps {
  /** Composite credit score data */
  compositeScore: CompositeScore | null;
  /** Ring display size */
  size?: RingSize | undefined;
  /** Whether to animate the fill on mount */
  animated?: boolean | undefined;
  /** Additional CSS classes */
  className?: string | undefined;
}

interface LayerConfig {
  label: string;
  colorVar: string;
  strokeColor: string;
  max: number;
  key: 'onChain' | 'offChain' | 'ecosystem';
}

const LAYERS: LayerConfig[] = [
  { label: 'On-chain', colorVar: 'text-accent-teal', strokeColor: 'var(--accent-teal, #00D68F)', max: 400, key: 'onChain' },
  { label: 'Off-chain', colorVar: 'text-accent-indigo', strokeColor: 'var(--accent-indigo, #6366F1)', max: 350, key: 'offChain' },
  { label: 'Ecosystem', colorVar: 'text-accent-gold', strokeColor: 'var(--accent-gold, #F5A623)', max: 250, key: 'ecosystem' },
];

const SIZE_CONFIG: Record<RingSize, {
  dim: number;
  strokeWidth: number;
  ringGap: number;
  scoreFontSize: string;
  showTier: boolean;
  showBreakdown: boolean;
}> = {
  sm: { dim: 120, strokeWidth: 6, ringGap: 10, scoreFontSize: '1.25rem', showTier: false, showBreakdown: false },
  md: { dim: 200, strokeWidth: 8, ringGap: 14, scoreFontSize: '2rem', showTier: true, showBreakdown: false },
  lg: { dim: 280, strokeWidth: 10, ringGap: 16, scoreFontSize: '2.75rem', showTier: true, showBreakdown: true },
};

const TIER_VARIANT_MAP: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
  Diamond: 'info',
  Gold: 'warning',
  Silver: 'default',
  Bronze: 'danger',
  Unrated: 'default',
};

function CompositeScoreRing({
  compositeScore,
  size = 'md',
  animated = true,
  className,
}: CompositeScoreRingProps) {
  const [animationProgress, setAnimationProgress] = useState<number[]>([0, 0, 0]);
  const config = SIZE_CONFIG[size];

  useEffect(() => {
    if (!animated || !compositeScore) {
      setAnimationProgress([1, 1, 1]);
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setAnimationProgress([1, 1, 1]);
      return;
    }

    // Stagger animation: each ring starts 200ms after the previous
    const duration = 800;
    const stagger = 200;
    const startTimes: (number | null)[] = [null, null, null];
    const progress = [0, 0, 0];

    const tick = (ts: number) => {
      let allDone = true;

      for (let i = 0; i < 3; i++) {
        const delayedStart = i * stagger;

        if (startTimes[i] === null) {
          startTimes[i] = ts + delayedStart;
        }

        const elapsed = ts - (startTimes[i] as number);

        if (elapsed < 0) {
          progress[i] = 0;
          allDone = false;
        } else {
          const rawProgress = Math.min(elapsed / duration, 1);
          // Ease-out cubic
          progress[i] = 1 - Math.pow(1 - rawProgress, 3);
          if (rawProgress < 1) allDone = false;
        }
      }

      setAnimationProgress([...progress]);

      if (!allDone) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [compositeScore, animated]);

  if (!compositeScore) {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        <Skeleton variant="circle" width={config.dim} height={config.dim} />
        {config.showTier && <Skeleton variant="rect" width={80} height={20} />}
      </div>
    );
  }

  const { layers, tier, compositeScore: totalScore } = compositeScore;
  const center = config.dim / 2;

  // Build ring data from outside in: onChain (outer), offChain (middle), ecosystem (inner)
  const rings = LAYERS.map((layer, i) => {
    const layerData = layers[layer.key];
    const radius = center - config.strokeWidth / 2 - i * (config.strokeWidth + config.ringGap);
    const circumference = 2 * Math.PI * radius;
    const progress = animationProgress[i] ?? 0;
    const fillPercent = (layerData.score / layer.max) * progress;
    const dashOffset = circumference * (1 - fillPercent);

    return {
      ...layer,
      radius,
      circumference,
      dashOffset,
      score: layerData.score,
    };
  });

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: config.dim, height: config.dim }}>
        <svg
          width={config.dim}
          height={config.dim}
          viewBox={`0 0 ${config.dim} ${config.dim}`}
          className="transform -rotate-90"
        >
          {rings.map((ring) => (
            <g key={ring.key}>
              {/* Background track */}
              <circle
                cx={center}
                cy={center}
                r={ring.radius}
                fill="none"
                stroke="var(--border-subtle, rgba(255,255,255,0.06))"
                strokeWidth={config.strokeWidth}
              />
              {/* Filled arc */}
              <circle
                cx={center}
                cy={center}
                r={ring.radius}
                fill="none"
                stroke={ring.strokeColor}
                strokeWidth={config.strokeWidth}
                strokeLinecap="round"
                strokeDasharray={ring.circumference}
                strokeDashoffset={ring.dashOffset}
                className="transition-none"
                style={{ opacity: 0.9 }}
              />
            </g>
          ))}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-mono font-bold text-text-primary leading-none"
            style={{ fontSize: config.scoreFontSize }}
          >
            {totalScore}
          </span>
          {size === 'sm' && (
            <span className="text-[10px] text-text-tertiary mt-0.5">/ 1000</span>
          )}
          {config.showTier && (
            <Badge
              variant={TIER_VARIANT_MAP[tier] ?? 'default'}
              size="sm"
              className="mt-1.5"
            >
              {tier}
            </Badge>
          )}
        </div>
      </div>

      {/* Full breakdown legend (lg only) */}
      {config.showBreakdown && (
        <div className="mt-4 grid grid-cols-3 gap-4 w-full max-w-xs">
          {LAYERS.map((layer) => {
            const layerData = layers[layer.key];
            return (
              <div key={layer.key} className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: layer.strokeColor }}
                  />
                  <span className="text-xs text-text-secondary font-medium">
                    {layer.label}
                  </span>
                </div>
                <span className="text-sm font-mono text-text-primary">
                  {layerData.score}
                  <span className="text-text-tertiary">/{layer.max}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { CompositeScoreRing, type CompositeScoreRingProps };
