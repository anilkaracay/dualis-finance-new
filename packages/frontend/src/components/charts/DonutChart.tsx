'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
  animated?: boolean;
  className?: string;
}

function DonutChart({
  segments,
  size = 200,
  thickness = 30,
  centerLabel,
  centerValue,
  animated = true,
  className,
}: DonutChartProps) {
  const [progress, setProgress] = useState(animated ? 0 : 1);

  useEffect(() => {
    if (!animated) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setProgress(1);
      return;
    }

    let start: number | null = null;
    const duration = 800;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const p = Math.min(elapsed / duration, 1);
      setProgress(1 - Math.pow(1 - p, 3));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [animated, segments]);

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return null;

  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeAngle = 0;
  const arcs = segments.map((seg) => {
    const fraction = seg.value / total;
    const dashLength = circumference * fraction * progress;
    const dashGap = circumference - dashLength;
    const rotation = cumulativeAngle * 360 - 90;
    cumulativeAngle += fraction;

    return {
      ...seg,
      dashLength,
      dashGap,
      rotation,
      fraction,
    };
  });

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={thickness}
            className="text-bg-hover"
          />
          {arcs.map((arc, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={thickness}
              strokeDasharray={`${arc.dashLength} ${arc.dashGap}`}
              strokeLinecap="butt"
              transform={`rotate(${arc.rotation} ${cx} ${cy})`}
              className="transition-all duration-300"
            />
          ))}
        </svg>
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && (
              <span className="font-mono text-2xl font-bold text-text-primary tracking-tight">{centerValue}</span>
            )}
            {centerLabel && (
              <span className="text-xs text-text-tertiary">{centerLabel}</span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-text-secondary">{seg.label}</span>
            <span className="font-mono text-text-tertiary tabular-nums">
              {total > 0 ? ((seg.value / total) * 100).toFixed(1) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export { DonutChart, type DonutChartProps, type DonutSegment };
