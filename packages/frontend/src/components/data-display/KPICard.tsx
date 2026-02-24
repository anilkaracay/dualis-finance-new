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
  index?: number | undefined;
  className?: string | undefined;
}

const sizeConfig: Record<KPISize, { valueClass: string }> = {
  sm: { valueClass: 'text-xl' },
  md: { valueClass: 'text-3xl' },
  lg: { valueClass: 'text-4xl' },
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
  index,
  className,
}: KPICardProps) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const { formattedValue } = useCountUp({ end: numValue, decimals, duration: 800 });
  const config = sizeConfig[size];

  if (loading) {
    return (
      <div className={cn('rounded-xl bg-bg-tertiary border border-border-default p-5 shadow-card', className)}>
        <Skeleton variant="rect" height={10} width="35%" />
        <Skeleton variant="rect" height={size === 'lg' ? 44 : 32} width="65%" className="mt-3" />
        <Skeleton variant="rect" height={14} width="45%" className="mt-3" />
      </div>
    );
  }

  const trendColor = trend === 'up' ? 'text-positive' : trend === 'down' ? 'text-negative' : 'text-text-tertiary';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        'relative rounded-xl bg-bg-tertiary border border-border-default p-5 transition-all duration-200 hover:border-border-medium hover-lift-glow card-highlight-strong shadow-card animate-stagger-in',
        className
      )}
      style={{ animationDelay: `${(index ?? 0) * 80}ms` }}
    >
      <span className="text-[10.5px] font-semibold uppercase tracking-widest text-text-tertiary">{label}</span>

      <div className={cn('font-mono font-bold text-text-primary mt-2.5 tracking-tight', config.valueClass)}>
        {prefix}{formattedValue}{suffix}
      </div>

      {(trend || sparkline) && size !== 'sm' && (
        <div className="flex items-center gap-2.5 mt-3.5">
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
