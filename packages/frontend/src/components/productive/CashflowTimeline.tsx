'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Card } from '@/components/ui/Card';
import type { CashflowEntry, CashflowStatus } from '@dualis/shared';

interface CashflowTimelineProps {
  /** Array of cashflow entries */
  cashflows: CashflowEntry[];
  /** Grace period end date (ISO string) */
  gracePeriodEnd?: string;
}

const statusColors: Record<CashflowStatus, { bg: string; ring: string; label: string }> = {
  Received: {
    bg: 'bg-positive',
    ring: 'ring-positive/30',
    label: 'Received',
  },
  Projected: {
    bg: 'bg-info',
    ring: 'ring-info/30',
    label: 'Projected',
  },
  Partial: {
    bg: 'bg-warning',
    ring: 'ring-warning/30',
    label: 'Partial',
  },
  Missed: {
    bg: 'bg-negative',
    ring: 'ring-negative/30',
    label: 'Missed',
  },
  Overdue: {
    bg: 'bg-negative',
    ring: 'ring-negative/30',
    label: 'Overdue',
  },
};

function formatMonth(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function formatCurrency(value: string | null): string {
  if (!value) return '$0';
  const num = parseFloat(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(num);
}

function CashflowTimeline({ cashflows, gracePeriodEnd }: CashflowTimelineProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (cashflows.length === 0) {
    return (
      <Card>
        <p className="text-sm text-text-tertiary text-center py-6">No cashflow data available</p>
      </Card>
    );
  }

  const gracePeriodDate = gracePeriodEnd ? new Date(gracePeriodEnd) : null;

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">Cashflow Timeline</h3>
        {/* Legend */}
        <div className="flex items-center gap-3">
          {(['Received', 'Projected', 'Partial', 'Missed'] as CashflowStatus[]).map((status) => (
            <div key={status} className="flex items-center gap-1.5">
              <span className={cn('inline-block w-2 h-2 rounded-full', statusColors[status].bg)} />
              <span className="text-[10px] text-text-tertiary">{statusColors[status].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grace period indicator */}
      {gracePeriodDate && (
        <div className="mb-3">
          <span className="text-[10px] text-warning font-medium">
            Grace period ends: {gracePeriodDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      )}

      {/* Timeline horizontal bar */}
      <div className="relative">
        {/* Base line */}
        <div className="absolute top-3 left-3 right-3 h-0.5 bg-border-subtle" />

        {/* Markers */}
        <div className="relative flex items-start justify-between overflow-x-auto pb-2">
          {cashflows.map((entry, index) => {
            const config = statusColors[entry.status];
            const isHovered = hoveredIndex === index;
            const isWithinGrace =
              gracePeriodDate && new Date(entry.expectedDate) <= gracePeriodDate;

            return (
              <div
                key={`${entry.expectedDate}-${index}`}
                className="relative flex flex-col items-center min-w-[48px] flex-1"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Marker dot */}
                <div
                  className={cn(
                    'relative z-10 w-3 h-3 rounded-full transition-all duration-150 cursor-pointer',
                    config.bg,
                    isHovered && cn('w-4 h-4 ring-4', config.ring),
                    isWithinGrace && 'ring-2 ring-warning/40'
                  )}
                />

                {/* Month label */}
                <span className="text-[9px] text-text-tertiary mt-2 whitespace-nowrap">
                  {formatMonth(entry.expectedDate)}
                </span>

                {/* Tooltip on hover */}
                {isHovered && (
                  <div className="absolute top-full mt-2 z-20 bg-bg-tertiary border border-border-default rounded-lg shadow-lg p-3 min-w-[160px] pointer-events-none">
                    <div className="text-xs font-semibold text-text-primary mb-1.5">
                      {new Date(entry.expectedDate).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-text-tertiary">Expected</span>
                        <span className="text-text-primary font-medium">
                          {formatCurrency(entry.expectedAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-text-tertiary">Actual</span>
                        <span
                          className={cn(
                            'font-medium',
                            entry.actualAmount
                              ? parseFloat(entry.actualAmount) >= parseFloat(entry.expectedAmount)
                                ? 'text-positive'
                                : 'text-warning'
                              : 'text-text-tertiary'
                          )}
                        >
                          {entry.actualAmount ? formatCurrency(entry.actualAmount) : '--'}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-text-tertiary">Source</span>
                        <span className="text-text-secondary">{entry.source}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-text-tertiary">Status</span>
                        <span className={cn('font-medium', config.bg.replace('bg-', 'text-'))}>
                          {config.label}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary row */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border-subtle">
        <div className="flex flex-col">
          <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Total Expected</span>
          <span className="text-sm font-semibold text-text-primary">
            {formatCurrency(
              cashflows
                .reduce((sum, cf) => sum + parseFloat(cf.expectedAmount), 0)
                .toString()
            )}
          </span>
        </div>
        <div className="w-px h-8 bg-border-subtle" />
        <div className="flex flex-col">
          <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Total Received</span>
          <span className="text-sm font-semibold text-positive">
            {formatCurrency(
              cashflows
                .reduce((sum, cf) => sum + (cf.actualAmount ? parseFloat(cf.actualAmount) : 0), 0)
                .toString()
            )}
          </span>
        </div>
        <div className="w-px h-8 bg-border-subtle" />
        <div className="flex flex-col">
          <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Payments</span>
          <span className="text-sm font-semibold text-text-primary">
            {cashflows.filter((cf) => cf.status === 'Received').length}/{cashflows.length}
          </span>
        </div>
      </div>
    </Card>
  );
}

export { CashflowTimeline, type CashflowTimelineProps };
