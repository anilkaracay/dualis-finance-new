'use client';

import { cn } from '@/lib/utils/cn';

interface SparklineChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  animated?: boolean;
  showArea?: boolean;
  className?: string;
}

function SparklineChart({
  data,
  width = 80,
  height = 32,
  color = '#00D4AA',
  animated = true,
  showArea = false,
  className,
}: SparklineChartProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data.map((val, i) => ({
    x: padding + (i / (data.length - 1)) * (width - padding * 2),
    y: padding + (1 - (val - min) / range) * (height - padding * 2),
  }));

  const first = points[0]!;
  const last = points[points.length - 1]!;

  let pathD = `M ${first.x} ${first.y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const cpx = (prev.x + curr.x) / 2;
    pathD += ` Q ${cpx} ${prev.y}, ${curr.x} ${curr.y}`;
  }

  const areaD = `${pathD} L ${last.x} ${height} L ${first.x} ${height} Z`;

  const pathLength = width * 2;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
      role="img"
      aria-label="Sparkline chart"
    >
      {showArea && (
        <defs>
          <linearGradient id={`sparkline-grad-${width}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.15} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
      )}
      {showArea && (
        <path d={areaD} fill={`url(#sparkline-grad-${width})`} />
      )}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={animated ? {
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength,
          animation: `drawLine 0.6s ease-out forwards`,
        } : undefined}
      />
    </svg>
  );
}

export { SparklineChart, type SparklineChartProps };
