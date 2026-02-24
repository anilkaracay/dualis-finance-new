'use client';

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils/cn';
import { ChartTooltip } from './ChartTooltip';
import { Skeleton } from '@/components/ui/Skeleton';

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'ALL';

interface DualisAreaChartProps {
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
  timeRange?: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
  loading?: boolean;
  formatter?: (value: number, name: string) => string;
  labelFormatter?: (label: string) => string;
  className?: string;
}

const timeRanges: TimeRange[] = ['7d', '30d', '90d', '1y', 'ALL'];

function formatCompact(v: number): string {
  if (Math.abs(v) >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function DualisAreaChart({
  data,
  xKey,
  yKey,
  color = 'var(--color-accent-teal)',
  height = 320,
  timeRange = '30d',
  onTimeRangeChange,
  loading = false,
  formatter,
  labelFormatter,
  className,
}: DualisAreaChartProps) {
  if (loading) {
    return (
      <div className={cn('w-full', className)}>
        {onTimeRangeChange && <Skeleton variant="rect" height={32} width={240} className="mb-4" />}
        <Skeleton variant="rect" height={height} />
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {onTimeRangeChange && (
        <div className="flex gap-1 mb-4">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-sm transition-colors',
                range === timeRange
                  ? 'bg-accent-teal-muted text-accent-teal font-semibold'
                  : 'text-text-tertiary hover:text-text-primary hover:bg-bg-hover'
              )}
            >
              {range}
            </button>
          ))}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 8"
            stroke="var(--chart-grid)"
            vertical={false}
          />
          <XAxis
            dataKey={xKey}
            tick={{ fill: 'var(--chart-axis-text)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--chart-axis-line)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--chart-axis-text)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatCompact}
            width={60}
          />
          <Tooltip
            content={
              <ChartTooltip formatter={formatter} labelFormatter={labelFormatter} />
            }
          />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2.5}
            fill="url(#areaGradient)"
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export { DualisAreaChart as AreaChart, type DualisAreaChartProps, type TimeRange };
