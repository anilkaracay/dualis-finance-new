'use client';

import { cn } from '@/lib/utils/cn';
import { useCountUp } from '@/hooks/useCountUp';
import { SparklineChart } from './SparklineChart';
import { Skeleton } from '@/components/ui/Skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type KPISize = 'sm' | 'md' | 'lg';
type Trend = 'up' | 'down' | 'flat';

interface KPICardProps {
  label: string;
  value: number | string;
  previousValue?: number | undefined;
  trend?: Trend | undefined;
  trendValue?: string | undefined;
  trendContext?: string | undefined;
  sparkline?: number[] | undefined;
  size?: KPISize | undefined;
  loading?: boolean | undefined;
  prefix?: string | undefined;
  suffix?: string | undefined;
  decimals?: number | undefined;
  className?: string | undefined;
}

const sizeConfig: Record<KPISize, { valueClass: string }> = {
  sm: { valueClass: 'text-2xl' },
  md: { valueClass: 'text-4xl' },
  lg: { valueClass: 'text-5xl' },
};

function KPICard({
  label,
  value,
  trend,
  trendValue,
  trendContext,
  sparkline,
  size = 'md',
  loading = false,
  prefix = '',
  suffix = '',
  decimals = 2,
  className,
}: KPICardProps) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const { formattedValue } = useCountUp({ end: numValue, decimals, duration: 800 });
  const config = sizeConfig[size];

  if (loading) {
    return (
      <div className={cn('rounded-lg bg-surface-card border border-border-default p-5', className)}>
        <Skeleton variant="rect" height={10} width="35%" />
        <Skeleton variant="rect" height={size === 'lg' ? 44 : 32} width="65%" className="mt-3" />
        <Skeleton variant="rect" height={14} width="45%" className="mt-3" />
      </div>
    );
  }

  const trendColor = trend === 'up' ? 'text-positive' : trend === 'down' ? 'text-negative' : 'text-text-tertiary';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className={cn(
      'rounded-lg bg-surface-card border border-border-default p-5 transition-all duration-200 hover:border-border-hover',
      className
    )}>
      <span className="text-label">{label}</span>

      <div className={cn('text-kpi mt-2', config.valueClass)}>
        {prefix}{formattedValue}{suffix}
      </div>

      {(trend || sparkline) && size !== 'sm' && (
        <div className="flex items-center gap-2 mt-3">
          {trend && trendValue && (
            <>
              <TrendIcon className={cn('h-3 w-3', trendColor)} />
              <span className={cn('text-xs font-medium', trendColor)}>{trendValue}</span>
              {trendContext && <span className="text-xs text-text-tertiary">{trendContext}</span>}
            </>
          )}
          {sparkline && sparkline.length >= 2 && (
            <SparklineChart data={sparkline} width={60} height={16} animated showArea className="ml-auto" />
          )}
        </div>
      )}
    </div>
  );
}

export { KPICard, type KPICardProps, type KPISize };
