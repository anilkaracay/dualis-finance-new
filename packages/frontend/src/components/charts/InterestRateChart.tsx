'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import { cn } from '@/lib/utils/cn';
import { ChartTooltip } from './ChartTooltip';

interface InterestRateChartProps {
  baseRate: number;
  multiplier: number;
  kink: number;
  jumpMultiplier: number;
  currentUtilization: number;
  protocolFeeRate?: number;
  height?: number;
  className?: string;
}

function generateCurveData(
  baseRate: number,
  multiplier: number,
  kink: number,
  jumpMultiplier: number,
  feeRate: number
): Array<{ utilization: number; borrowRate: number; supplyRate: number }> {
  const points: Array<{ utilization: number; borrowRate: number; supplyRate: number }> = [];

  for (let u = 0; u <= 100; u += 1) {
    const util = u / 100;
    let borrowRate: number;
    if (util <= kink) {
      borrowRate = baseRate + util * multiplier;
    } else {
      borrowRate = baseRate + kink * multiplier + (util - kink) * jumpMultiplier;
    }
    const supplyRate = borrowRate * util * (1 - feeRate);
    points.push({
      utilization: u,
      borrowRate: borrowRate * 100,
      supplyRate: supplyRate * 100,
    });
  }

  return points;
}

function InterestRateChart({
  baseRate,
  multiplier,
  kink,
  jumpMultiplier,
  currentUtilization,
  protocolFeeRate = 0.001,
  height = 280,
  className,
}: InterestRateChartProps) {
  const data = generateCurveData(baseRate, multiplier, kink, jumpMultiplier, protocolFeeRate);
  const currentIdx = Math.round(currentUtilization * 100);
  const currentPoint = data[Math.min(currentIdx, data.length - 1)];

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="utilization"
            tick={{ fill: 'var(--chart-axis-text)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--chart-axis-line)' }}
            tickLine={false}
            tickFormatter={(v: number) => `${v}%`}
          />
          <YAxis
            tick={{ fill: 'var(--chart-axis-text)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v.toFixed(0)}%`}
            width={50}
          />
          <Tooltip
            content={
              <ChartTooltip
                formatter={(v: number) => `${v.toFixed(2)}%`}
                labelFormatter={(l: string) => `Utilization: ${l}%`}
              />
            }
          />
          <ReferenceLine
            x={kink * 100}
            stroke="var(--chart-axis-text)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <Line
            type="monotone"
            dataKey="supplyRate"
            stroke="var(--color-accent-teal)"
            strokeWidth={2}
            dot={false}
            name="Supply Rate"
          />
          <Line
            type="monotone"
            dataKey="borrowRate"
            stroke="#6366F1"
            strokeWidth={2}
            dot={false}
            name="Borrow Rate"
          />
          {currentPoint && (
            <>
              <ReferenceLine
                x={currentUtilization * 100}
                stroke="var(--color-text-primary)"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <ReferenceDot
                x={currentUtilization * 100}
                y={currentPoint.borrowRate}
                r={4}
                fill="#6366F1"
                stroke="var(--color-bg-primary)"
                strokeWidth={2}
              />
              <ReferenceDot
                x={currentUtilization * 100}
                y={currentPoint.supplyRate}
                r={4}
                fill="var(--color-accent-teal)"
                stroke="var(--color-bg-primary)"
                strokeWidth={2}
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export { InterestRateChart, type InterestRateChartProps };
