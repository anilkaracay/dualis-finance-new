'use client';

import { cn } from '@/lib/utils/cn';
import { useCountUp } from '@/hooks/useCountUp';
import { SparklineChart } from './SparklineChart';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type KPISize = 'sm' | 'md' | 'lg';
type Trend = 'up' | 'down' | 'flat';

interface KPICardProps {
  label: string;
  value: number | string;
  previousValue?: number;
  trend?: Trend;
  trendValue?: string;
  sparkline?: number[];
  icon?: React.ReactNode;
  size?: KPISize;
  loading?: boolean;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

const sizeConfig: Record<KPISize, { valueClass: string; labelClass: string; iconSize: string }> = {
  sm: { valueClass: 'text-2xl', labelClass: 'text-xs', iconSize: 'h-4 w-4' },
  md: { valueClass: 'text-4xl', labelClass: 'text-sm', iconSize: 'h-5 w-5' },
  lg: { valueClass: 'text-5xl', labelClass: 'text-sm', iconSize: 'h-5 w-5' },
};

const trendConfig: Record<Trend, { icon: React.ElementType; variant: 'success' | 'danger' | 'default' }> = {
  up: { icon: TrendingUp, variant: 'success' },
  down: { icon: TrendingDown, variant: 'danger' },
  flat: { icon: Minus, variant: 'default' },
};

function KPICard({
  label,
  value,
  trend,
  trendValue,
  sparkline,
  icon,
  size = 'md',
  loading = false,
  prefix = '',
  suffix = '',
  decimals = 2,
  className,
}: KPICardProps) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const { formattedValue } = useCountUp({ end: numValue, decimals });
  const config = sizeConfig[size];

  if (loading) {
    return (
      <div className={cn('rounded-md bg-surface-card border border-border-default p-6', className)}>
        <Skeleton variant="rect" height={14} width="40%" />
        <Skeleton variant="rect" height={size === 'lg' ? 48 : 36} width="70%" className="mt-3" />
        <Skeleton variant="rect" height={20} width="50%" className="mt-3" />
      </div>
    );
  }

  return (
    <div className={cn('rounded-md bg-surface-card border border-border-default p-6', className)}>
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className={cn('text-text-tertiary', config.iconSize)}>{icon}</span>}
        <span className={cn('font-medium text-text-secondary uppercase tracking-wide', config.labelClass)}>
          {label}
        </span>
      </div>

      <div className={cn('font-mono font-bold text-text-primary tracking-tight tabular-nums', config.valueClass)}>
        {prefix}{formattedValue}{suffix}
      </div>

      {(trend || sparkline) && size !== 'sm' && (
        <div className="flex items-center gap-3 mt-3">
          {trend && trendValue && (
            <Badge variant={trendConfig[trend].variant} size="sm">
              {(() => {
                const TrendIcon = trendConfig[trend].icon;
                return <TrendIcon className="h-3 w-3 mr-1" />;
              })()}
              {trendValue}
            </Badge>
          )}
          {sparkline && sparkline.length >= 2 && (
            <SparklineChart data={sparkline} width={80} height={28} animated showArea />
          )}
        </div>
      )}
    </div>
  );
}

export { KPICard, type KPICardProps, type KPISize };
