'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Activity, TrendingUp, TrendingDown, Zap, BarChart3, DollarSign } from 'lucide-react';
import type { IoTReading } from '@dualis/shared';

interface ProductionMonitorProps {
  /** Array of IoT readings */
  readings: IoTReading[];
  /** Expected daily production value */
  expectedDaily?: number;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ProductionMonitor({ readings, expectedDaily }: ProductionMonitorProps) {
  const dailyData = useMemo(() => {
    // Group readings by date and aggregate
    const grouped = new Map<string, { date: string; totalValue: number; count: number }>();

    readings.forEach((reading) => {
      const dateKey = reading.timestamp.split('T')[0] ?? reading.timestamp;
      const existing = grouped.get(dateKey);
      if (existing) {
        existing.totalValue += reading.value;
        existing.count += 1;
      } else {
        grouped.set(dateKey, { date: dateKey, totalValue: reading.value, count: 1 });
      }
    });

    return Array.from(grouped.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [readings]);

  const maxValue = useMemo(() => {
    const readingMax = Math.max(...dailyData.map((d) => d.totalValue), 0);
    return expectedDaily ? Math.max(readingMax, expectedDaily) : readingMax;
  }, [dailyData, expectedDaily]);

  const totalProduction = useMemo(
    () => dailyData.reduce((sum, d) => sum + d.totalValue, 0),
    [dailyData]
  );

  const avgDaily = dailyData.length > 0 ? totalProduction / dailyData.length : 0;
  const isAboveTarget = expectedDaily ? avgDaily >= expectedDaily : true;
  const capacityUtil = expectedDaily && expectedDaily > 0 ? (avgDaily / expectedDaily) * 100 : 0;

  // Estimate revenue at $0.05/kWh for energy projects
  const estimatedRevenue = totalProduction * 0.05;

  const unit = readings.length > 0 ? (readings[0]?.unit ?? 'kWh') : 'kWh';

  if (readings.length === 0) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-text-tertiary" />
          <h3 className="text-sm font-semibold text-text-primary">Production Monitor</h3>
        </div>
        <p className="text-sm text-text-tertiary text-center py-6">
          No production data available yet
        </p>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-text-tertiary" />
          <h3 className="text-sm font-semibold text-text-primary">Production Monitor</h3>
        </div>
        <Badge
          variant={isAboveTarget ? 'success' : 'warning'}
          size="sm"
        >
          {isAboveTarget ? (
            <TrendingUp className="h-3 w-3 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 mr-1" />
          )}
          {isAboveTarget ? 'Above Target' : 'Below Target'}
        </Badge>
      </div>

      {/* Bar Chart */}
      <div className="relative h-40 flex items-end gap-1">
        {/* Target line */}
        {expectedDaily && maxValue > 0 && (
          <div
            className="absolute left-0 right-0 border-t border-dashed border-warning/50 z-10"
            style={{ bottom: `${(expectedDaily / maxValue) * 100}%` }}
          >
            <span className="absolute -top-4 right-0 text-[9px] text-warning font-medium">
              Target: {expectedDaily.toLocaleString()} {unit}
            </span>
          </div>
        )}

        {dailyData.map((day, index) => {
          const heightPercent = maxValue > 0 ? (day.totalValue / maxValue) * 100 : 0;
          const meetsTarget = expectedDaily ? day.totalValue >= expectedDaily : true;

          return (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center gap-1 group relative"
            >
              {/* Bar */}
              <div className="w-full flex items-end justify-center h-32">
                <div
                  className={cn(
                    'w-full max-w-[28px] rounded-t-sm transition-all duration-300',
                    meetsTarget
                      ? 'bg-accent-teal hover:bg-accent-teal/80'
                      : 'bg-warning/70 hover:bg-warning/60'
                  )}
                  style={{ height: `${heightPercent}%`, minHeight: day.totalValue > 0 ? 2 : 0 }}
                />
              </div>

              {/* Date label (show every few bars) */}
              {(index === 0 || index === dailyData.length - 1 || index % Math.max(1, Math.floor(dailyData.length / 6)) === 0) && (
                <span className="text-[8px] text-text-tertiary whitespace-nowrap">
                  {formatDate(day.date)}
                </span>
              )}

              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-20 bg-surface-card border border-border-default rounded-lg shadow-lg p-2 min-w-[120px] pointer-events-none">
                <div className="text-[10px] text-text-tertiary">{formatDate(day.date)}</div>
                <div className="text-xs font-semibold text-text-primary">
                  {day.totalValue.toLocaleString()} {unit}
                </div>
                {expectedDaily && (
                  <div className={cn('text-[10px] font-medium', meetsTarget ? 'text-positive' : 'text-warning')}>
                    {meetsTarget ? '+' : ''}{((day.totalValue - expectedDaily) / expectedDaily * 100).toFixed(1)}% vs target
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-border-subtle">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-accent-teal" />
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider">
              Total Production
            </span>
          </div>
          <span className="text-sm font-semibold text-text-primary">
            {totalProduction.toLocaleString()} {unit}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="h-3 w-3 text-accent-indigo" />
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider">
              Capacity Util.
            </span>
          </div>
          <span
            className={cn(
              'text-sm font-semibold',
              capacityUtil >= 80 ? 'text-positive' : capacityUtil >= 50 ? 'text-warning' : 'text-negative'
            )}
          >
            {capacityUtil.toFixed(1)}%
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3 w-3 text-accent-gold" />
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider">
              Est. Revenue
            </span>
          </div>
          <span className="text-sm font-semibold text-text-primary">
            ${estimatedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
    </Card>
  );
}

export { ProductionMonitor, type ProductionMonitorProps };
