'use client';

import { cn } from '@/lib/utils/cn';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ESGBadge } from './ESGBadge';
import { Sun, Wind, Server, Truck, Wrench, Battery, Building2, Wheat, Radio, Ship, MapPin } from 'lucide-react';
import type { ProductiveProject, ProjectCategory, ProjectStatus } from '@dualis/shared';

interface ProjectCardProps {
  /** The productive project data */
  project: ProductiveProject;
  /** Click handler */
  onClick?: () => void;
}

const categoryIcons: Record<ProjectCategory, React.ElementType> = {
  SolarEnergy: Sun,
  WindEnergy: Wind,
  DataCenter: Server,
  SupplyChain: Truck,
  EquipmentLeasing: Wrench,
  BatteryStorage: Battery,
  RealEstate: Building2,
  AgriInfra: Wheat,
  TelecomInfra: Radio,
  ExportFinance: Ship,
};

const categoryLabels: Record<ProjectCategory, string> = {
  SolarEnergy: 'Solar',
  WindEnergy: 'Wind',
  DataCenter: 'Data Center',
  SupplyChain: 'Supply Chain',
  EquipmentLeasing: 'Equipment',
  BatteryStorage: 'Battery',
  RealEstate: 'Real Estate',
  AgriInfra: 'Agriculture',
  TelecomInfra: 'Telecom',
  ExportFinance: 'Export',
};

const statusVariantMap: Record<ProjectStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  Proposed: 'default',
  UnderReview: 'info',
  Approved: 'info',
  Funded: 'success',
  InConstruction: 'warning',
  Operational: 'success',
  Repaying: 'success',
  Completed: 'default',
  Defaulted: 'danger',
};

const statusLabels: Record<ProjectStatus, string> = {
  Proposed: 'Proposed',
  UnderReview: 'Under Review',
  Approved: 'Approved',
  Funded: 'Funded',
  InConstruction: 'In Construction',
  Operational: 'Operational',
  Repaying: 'Repaying',
  Completed: 'Completed',
  Defaulted: 'Defaulted',
};

function formatAmount(value: string): string {
  const num = parseFloat(value);
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num.toFixed(0)}`;
}

function ProjectCard({ project, onClick }: ProjectCardProps) {
  const CategoryIcon = categoryIcons[project.category];
  const fundedNum = parseFloat(project.fundedAmount);
  const requestedNum = parseFloat(project.requestedAmount);
  const fundedPercent = requestedNum > 0 ? Math.min((fundedNum / requestedNum) * 100, 100) : 0;
  const isOperational = project.status === 'Operational';

  return (
    <Card
      hoverable
      clickable={!!onClick}
      className={cn('flex flex-col gap-4', onClick && 'cursor-pointer')}
      onClick={onClick}
    >
      {/* Top: Category icon + Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent-teal/10">
          <CategoryIcon className="h-4.5 w-4.5 text-accent-teal" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary truncate">
            {project.metadata.location}
          </h3>
          <span className="text-xs text-text-tertiary">{categoryLabels[project.category]}</span>
        </div>
      </div>

      {/* Middle: Key stats */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex flex-col">
          <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Amount</span>
          <span className="text-sm font-semibold text-text-primary">
            {formatAmount(project.requestedAmount)}
          </span>
        </div>

        <div className="w-px h-8 bg-border-subtle" />

        <div className="flex flex-col">
          <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Funded</span>
          <span className="text-sm font-semibold text-accent-teal">
            {fundedPercent.toFixed(0)}%
          </span>
        </div>

        <div className="w-px h-8 bg-border-subtle" />

        <ESGBadge rating={project.metadata.esgRating} size="sm" />

        {project.metadata.location && (
          <>
            <div className="w-px h-8 bg-border-subtle" />
            <div className="flex items-center gap-1 text-xs text-text-secondary">
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-[80px]">{project.metadata.location}</span>
            </div>
          </>
        )}
      </div>

      {/* Bottom: Status badge + progress bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant={statusVariantMap[project.status]} size="sm">
            {isOperational && (
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-positive opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-positive" />
              </span>
            )}
            {statusLabels[project.status]}
          </Badge>
        </div>

        {/* Funded progress bar */}
        <div className="w-full h-1.5 rounded-full bg-bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-accent-teal transition-all duration-500"
            style={{ width: `${fundedPercent}%` }}
          />
        </div>
      </div>
    </Card>
  );
}

export { ProjectCard, type ProjectCardProps };
