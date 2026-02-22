'use client';

import { cn } from '@/lib/utils/cn';
import { Card } from '@/components/ui/Card';
import { Shield, Coins, Building, FileText } from 'lucide-react';
import type { HybridCollateral } from '@dualis/shared';

interface HybridCollateralViewProps {
  /** Hybrid collateral data */
  collateral: HybridCollateral;
}

function formatCurrency(value: string): string {
  const num = parseFloat(value);
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toFixed(0)}`;
}

interface SegmentConfig {
  key: string;
  label: string;
  color: string;
  strokeColor: string;
  textColor: string;
  icon: React.ElementType;
  value: string;
}

function HybridCollateralView({ collateral }: HybridCollateralViewProps) {
  const total = parseFloat(collateral.totalValue);
  const crypto = parseFloat(collateral.cryptoCollateral);
  const projectAsset = parseFloat(collateral.projectAssetValue);
  const tifa = parseFloat(collateral.tifaCollateral);

  const cryptoPercent = total > 0 ? (crypto / total) * 100 : 0;
  const projectPercent = total > 0 ? (projectAsset / total) * 100 : 0;
  const tifaPercent = total > 0 ? (tifa / total) * 100 : 0;

  const segments: SegmentConfig[] = [
    {
      key: 'crypto',
      label: 'Crypto Collateral',
      color: 'bg-accent-teal',
      strokeColor: '#2dd4bf',
      textColor: 'text-accent-teal',
      icon: Coins,
      value: collateral.cryptoCollateral,
    },
    {
      key: 'project',
      label: 'Project Asset',
      color: 'bg-accent-indigo',
      strokeColor: '#818cf8',
      textColor: 'text-accent-indigo',
      icon: Building,
      value: collateral.projectAssetValue,
    },
    {
      key: 'tifa',
      label: 'TIFA Collateral',
      color: 'bg-accent-gold',
      strokeColor: '#fbbf24',
      textColor: 'text-accent-gold',
      icon: FileText,
      value: collateral.tifaCollateral,
    },
  ];

  const percentages = [cryptoPercent, projectPercent, tifaPercent];

  // SVG Donut chart parameters
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const gapDegrees = 3;
  const gapLength = (gapDegrees / 360) * circumference;

  // Calculate arc offsets
  let cumulativeOffset = 0;
  const arcs = segments.map((segment, i) => {
    const pct = percentages[i] ?? 0;
    const arcLength = (pct / 100) * circumference - gapLength;
    const offset = cumulativeOffset;
    cumulativeOffset += (pct / 100) * circumference;
    return {
      ...segment,
      pct,
      arcLength: Math.max(arcLength, 0),
      offset,
    };
  });

  return (
    <Card padding="lg">
      <div className="flex items-center gap-2 mb-5">
        <Shield className="h-4 w-4 text-text-tertiary" />
        <h3 className="text-sm font-semibold text-text-primary">Hybrid Collateral</h3>
      </div>

      <div className="flex items-center gap-8">
        {/* Donut Chart */}
        <div className="relative shrink-0">
          <svg width={size} height={size} className="-rotate-90">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-bg-secondary"
            />
            {/* Segments */}
            {arcs.map((arc) => (
              <circle
                key={arc.key}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={arc.strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={`${arc.arcLength} ${circumference - arc.arcLength}`}
                strokeDashoffset={-arc.offset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            ))}
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Total</span>
            <span className="text-lg font-bold text-text-primary">
              {formatCurrency(collateral.totalValue)}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3 flex-1">
          {arcs.map((arc) => {
            const Icon = arc.icon;
            return (
              <div key={arc.key} className="flex items-center gap-3">
                <div className={cn('w-3 h-3 rounded-sm shrink-0', arc.color)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Icon className={cn('h-3.5 w-3.5', arc.textColor)} />
                    <span className="text-xs text-text-secondary">{arc.label}</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-sm font-semibold text-text-primary">
                      {formatCurrency(arc.value)}
                    </span>
                    <span className={cn('text-xs font-medium', arc.textColor)}>
                      {(arc.pct ?? 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Crypto ratio indicator */}
          <div className="mt-1 pt-3 border-t border-border-subtle">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-tertiary uppercase tracking-wider">
                Crypto Ratio
              </span>
              <span className="text-xs font-semibold text-accent-teal">
                {(collateral.cryptoRatio * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-bg-secondary mt-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent-teal transition-all duration-500"
                style={{ width: `${collateral.cryptoRatio * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export { HybridCollateralView, type HybridCollateralViewProps };
