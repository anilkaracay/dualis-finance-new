'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ESGBadge } from './ESGBadge';
import {
  Sun, Wind, Server, Truck, Wrench, Battery, Building2, Wheat, Radio, Ship,
  MapPin, Clock, Shield, Users, Building, DollarSign, Percent, Lock, BarChart3, Activity,
} from 'lucide-react';
import type { ProductiveProject, ProjectCategory, ProjectStatus } from '@dualis/shared';

interface ProjectDetailPanelProps {
  /** The productive project to display */
  project: ProductiveProject;
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
  SolarEnergy: 'Solar Energy',
  WindEnergy: 'Wind Energy',
  DataCenter: 'Data Center',
  SupplyChain: 'Supply Chain',
  EquipmentLeasing: 'Equipment Leasing',
  BatteryStorage: 'Battery Storage',
  RealEstate: 'Real Estate',
  AgriInfra: 'Agriculture',
  TelecomInfra: 'Telecom Infrastructure',
  ExportFinance: 'Export Finance',
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

function formatCurrencyFull(value: string): string {
  const num = parseFloat(value);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
}

interface DetailRowProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}

function DetailRow({ icon: Icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border-subtle last:border-b-0">
      <div className="flex items-center gap-2 text-text-secondary">
        <Icon className="h-3.5 w-3.5 text-text-tertiary" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-sm font-medium text-text-primary">{value}</div>
    </div>
  );
}

function ProjectDetailPanel({ project }: ProjectDetailPanelProps) {
  const CategoryIcon = categoryIcons[project.category];
  const { metadata } = project;
  const fundedNum = parseFloat(project.fundedAmount);
  const requestedNum = parseFloat(project.requestedAmount);
  const fundedPercent = requestedNum > 0 ? Math.min((fundedNum / requestedNum) * 100, 100) : 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent-teal/10 shrink-0">
            <CategoryIcon className="h-6 w-6 text-accent-teal" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-text-primary">
              {metadata.location}
            </h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="default" size="sm">
                {categoryLabels[project.category]}
              </Badge>
              <Badge variant={statusVariantMap[project.status]} size="sm">
                {statusLabels[project.status]}
              </Badge>
              <ESGBadge rating={metadata.esgRating} size="sm" />
            </div>
          </div>
        </div>

        {/* Funded progress */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-text-tertiary">Funding Progress</span>
            <span className="text-xs font-semibold text-accent-teal">{fundedPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-accent-teal transition-all duration-500"
              style={{ width: `${fundedPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-text-tertiary">
              {formatCurrencyFull(project.fundedAmount)} funded
            </span>
            <span className="text-xs text-text-tertiary">
              of {formatCurrencyFull(project.requestedAmount)}
            </span>
          </div>
        </div>
      </Card>

      {/* Metadata Section */}
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-1">Project Details</h3>
        <CardContent>
          <DetailRow icon={MapPin} label="Location" value={metadata.location} />
          {metadata.capacity && (
            <DetailRow icon={Activity} label="Capacity" value={metadata.capacity} />
          )}
          {metadata.offTaker && (
            <DetailRow icon={Users} label="Off-Taker" value={metadata.offTaker} />
          )}
          {metadata.insurancePolicy && (
            <DetailRow icon={Shield} label="Insurance" value={metadata.insurancePolicy} />
          )}
          <DetailRow
            icon={Clock}
            label="Construction Period"
            value={`${metadata.constructionPeriod} months`}
          />
          <DetailRow
            icon={Building}
            label="Operational Life"
            value={`${metadata.operationalLife} years`}
          />
          <DetailRow
            icon={Percent}
            label="Expected IRR"
            value={`${(metadata.expectedIRR * 100).toFixed(1)}%`}
          />
          <DetailRow
            icon={DollarSign}
            label="Independent Valuation"
            value={formatCurrencyFull(metadata.independentValue)}
          />
        </CardContent>
      </Card>

      {/* Financial Section */}
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-1">Financials</h3>
        <CardContent>
          <DetailRow
            icon={DollarSign}
            label="Requested Amount"
            value={formatCurrencyFull(project.requestedAmount)}
          />
          <DetailRow
            icon={DollarSign}
            label="Funded Amount"
            value={formatCurrencyFull(project.fundedAmount)}
          />
          <DetailRow
            icon={Lock}
            label="Collateral"
            value="View Collateral Details"
          />
        </CardContent>
      </Card>

      {/* Navigation Links */}
      <div className="grid grid-cols-2 gap-3">
        <Card hoverable clickable className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent-indigo/10">
            <BarChart3 className="h-4 w-4 text-accent-indigo" />
          </div>
          <div>
            <span className="text-sm font-medium text-text-primary">Cashflow Timeline</span>
            <p className="text-[10px] text-text-tertiary">View payment schedule</p>
          </div>
        </Card>

        <Card hoverable clickable className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent-gold/10">
            <Activity className="h-4 w-4 text-accent-gold" />
          </div>
          <div>
            <span className="text-sm font-medium text-text-primary">Production Monitor</span>
            <p className="text-[10px] text-text-tertiary">IoT data & output</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export { ProjectDetailPanel, type ProjectDetailPanelProps };
