'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils/cn';
import { ChartTooltip } from './ChartTooltip';

interface HistogramBar {
  label: string;
  value: number;
  rangeMin: number;
  rangeMax: number;
}

interface HistogramChartProps {
  data: HistogramBar[];
  height?: number;
  className?: string;
}

function getBarColor(rangeMin: number): string {
  if (rangeMin >= 2.0) return '#10B981';
  if (rangeMin >= 1.5) return '#F59E0B';
  if (rangeMin >= 1.0) return '#F97316';
  return '#EF4444';
}

function HistogramChart({ data, height = 240, className }: HistogramChartProps) {
  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--chart-axis-text)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--chart-axis-line)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--chart-axis-text)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Positions">
            {data.map((entry, idx) => (
              <Cell key={idx} fill={getBarColor(entry.rangeMin)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export { HistogramChart, type HistogramChartProps, type HistogramBar };
