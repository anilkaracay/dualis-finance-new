'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils/cn';

type GaugeSize = 'sm' | 'md' | 'lg';

interface HealthFactorGaugeProps {
  value: number;
  liquidationThreshold?: number | undefined;
  size?: GaugeSize | undefined;
  showLabel?: boolean | undefined;
  animated?: boolean | undefined;
  className?: string | undefined;
}

const sizeMap: Record<GaugeSize, { dim: number; strokeWidth: number; fontSize: string; showLabel: boolean }> = {
  sm: { dim: 80, strokeWidth: 4, fontSize: 'text-lg', showLabel: false },
  md: { dim: 140, strokeWidth: 6, fontSize: 'text-3xl', showLabel: true },
  lg: { dim: 200, strokeWidth: 8, fontSize: 'text-4xl', showLabel: true },
};

function getStatus(value: number): { text: string; colorClass: string } {
  if (value >= 2.0) return { text: 'Safe', colorClass: 'text-positive' };
  if (value >= 1.5) return { text: 'Caution', colorClass: 'text-warning' };
  if (value >= 1.0) return { text: 'At Risk', colorClass: 'text-orange-400' };
  return { text: 'Liquidatable', colorClass: 'text-negative' };
}

function HealthFactorGauge({
  value,
  size = 'md',
  showLabel = true,
  animated = true,
  className,
}: HealthFactorGaugeProps) {
  const [animatedProgress, setAnimatedProgress] = useState(animated ? 0 : 1);
  const config = sizeMap[size];
  const displayLabel = showLabel && config.showLabel;

  useEffect(() => {
    if (!animated) {
      setAnimatedProgress(1);
      return;
    }
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setAnimatedProgress(1);
      return;
    }

    let start: number | null = null;
    const duration = 600;

    const tick = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedProgress(eased);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [value, animated]);

  const radius = (config.dim - config.strokeWidth) / 2;
  const cx = config.dim / 2;
  const cy = config.dim / 2;
  const circumference = Math.PI * radius;
  const clampedValue = Math.min(Math.max(value, 0), 3);
  const fillPercent = (clampedValue / 3) * animatedProgress;
  const dashOffset = circumference * (1 - fillPercent);
  const status = getStatus(value);
  const isDanger = value < 1.0;

  const gradientId = `hf-gradient-${size}`;

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <svg
        width={config.dim}
        height={config.dim / 2 + config.strokeWidth}
        viewBox={`0 0 ${config.dim} ${config.dim / 2 + config.strokeWidth}`}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00D68F" />
            <stop offset="40%" stopColor="#FFB020" />
            <stop offset="70%" stopColor="#FF8C42" />
            <stop offset="100%" stopColor="#FF4C6A" />
          </linearGradient>
        </defs>
        <path
          d={`M ${config.strokeWidth / 2} ${cy} A ${radius} ${radius} 0 0 1 ${config.dim - config.strokeWidth / 2} ${cy}`}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={`M ${config.strokeWidth / 2} ${cy} A ${radius} ${radius} 0 0 1 ${config.dim - config.strokeWidth / 2} ${cy}`}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: animated ? 'none' : 'stroke-dashoffset 0.3s ease' }}
        />
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          className={cn('fill-text-primary font-mono font-medium', isDanger && 'animate-pulse-number')}
          style={{ fontSize: config.fontSize === 'text-4xl' ? '2.4rem' : config.fontSize === 'text-3xl' ? '1.9rem' : '1.1rem' }}
        >
          {value.toFixed(2)}
        </text>
      </svg>
      {displayLabel && (
        <span className={cn('text-xs uppercase font-medium tracking-wide mt-1', status.colorClass)}>
          {status.text}
        </span>
      )}
    </div>
  );
}

export { HealthFactorGauge, type HealthFactorGaugeProps, type GaugeSize };
