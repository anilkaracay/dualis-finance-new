'use client';

import { cn } from '@/lib/utils/cn';
import { KPICard } from '@/components/data-display/KPICard';

interface ProductiveAnalytics {
  totalFunded: string;
  activeProjects: number;
  avgReturn: number;
  defaultRate: number;
  totalEnergyProduced: string;
  co2Avoided: string;
}

interface ProductiveStatsProps {
  /** Aggregate analytics data */
  analytics: ProductiveAnalytics;
  /** Show loading skeletons */
  loading?: boolean;
  /** Additional class name */
  className?: string;
}

function ProductiveStats({ analytics, loading = false, className }: ProductiveStatsProps) {
  const totalFundedNum = parseFloat(analytics.totalFunded);
  const totalEnergyNum = parseFloat(analytics.totalEnergyProduced);
  const co2Num = parseFloat(analytics.co2Avoided);

  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      <KPICard
        label="Total Funded"
        value={totalFundedNum}
        prefix="$"
        decimals={0}
        size="sm"
        loading={loading}
        trend={totalFundedNum > 0 ? 'up' : undefined}
        trendValue={totalFundedNum > 0 ? 'Active' : undefined}
      />

      <KPICard
        label="Active Projects"
        value={analytics.activeProjects}
        decimals={0}
        size="sm"
        loading={loading}
      />

      <KPICard
        label="Avg Return"
        value={analytics.avgReturn}
        suffix="%"
        decimals={2}
        size="sm"
        loading={loading}
        trend={analytics.avgReturn > 0 ? 'up' : 'flat'}
        trendValue={analytics.avgReturn > 0 ? `${analytics.avgReturn.toFixed(2)}% APY` : undefined}
      />

      <KPICard
        label="Default Rate"
        value={analytics.defaultRate}
        suffix="%"
        decimals={2}
        size="sm"
        loading={loading}
        trend={analytics.defaultRate > 2 ? 'down' : analytics.defaultRate > 0 ? 'flat' : 'up'}
        trendValue={
          analytics.defaultRate === 0
            ? 'No defaults'
            : `${analytics.defaultRate.toFixed(2)}%`
        }
      />

      <KPICard
        label="Total Energy (kWh)"
        value={totalEnergyNum}
        decimals={0}
        size="sm"
        loading={loading}
        trend={totalEnergyNum > 0 ? 'up' : undefined}
        trendValue={totalEnergyNum > 0 ? 'Producing' : undefined}
      />

      <KPICard
        label="CO\u2082 Avoided"
        value={co2Num}
        suffix=" t"
        decimals={0}
        size="sm"
        loading={loading}
        trend={co2Num > 0 ? 'up' : undefined}
        trendValue={co2Num > 0 ? 'Impact' : undefined}
      />
    </div>
  );
}

export { ProductiveStats, type ProductiveStatsProps, type ProductiveAnalytics };
