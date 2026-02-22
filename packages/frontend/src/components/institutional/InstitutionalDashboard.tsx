'use client';

import { useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useInstitutionalStore } from '@/stores/useInstitutionalStore';
import type { BulkStatus } from '@dualis/shared';
import {
  ShieldCheck,
  TrendingUp,
  Users,
  Activity,
  ArrowUpRight,
  Download,
  Key,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';

/* ─── Constants ─── */

const bulkStatusConfig: Record<BulkStatus, { variant: 'success' | 'warning' | 'danger' | 'default' | 'info'; icon: React.ElementType }> = {
  Completed: { variant: 'success', icon: CheckCircle2 },
  Processing: { variant: 'info', icon: Clock },
  Pending: { variant: 'default', icon: Clock },
  PartialFail: { variant: 'warning', icon: AlertTriangle },
};

/* ─── Helpers ─── */

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ─── KYB Status Banner ─── */

function KYBBanner({
  status,
  verifiedAt,
  expiresAt,
  legalName,
}: {
  status: string;
  verifiedAt: string | null;
  expiresAt: string | null;
  legalName: string;
}) {
  const isVerified = status === 'Verified';

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-lg border',
        isVerified
          ? 'bg-positive/5 border-positive/20'
          : 'bg-warning/5 border-warning/20'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-full',
          isVerified ? 'bg-positive/10' : 'bg-warning/10'
        )}
      >
        {isVerified ? (
          <ShieldCheck className="h-5 w-5 text-positive" />
        ) : (
          <Clock className="h-5 w-5 text-warning" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary">{legalName}</span>
          <Badge variant={isVerified ? 'success' : 'warning'} size="sm">
            {isVerified ? 'Verified' : status}
          </Badge>
        </div>
        {isVerified && (
          <p className="text-xs text-text-tertiary mt-0.5">
            Verified on {formatDate(verifiedAt)} &middot; Expires {formatDate(expiresAt)}
          </p>
        )}
      </div>

      {isVerified && (
        <Badge variant="success" size="md">
          <ShieldCheck className="h-3 w-3 mr-1" />
          KYB Full
        </Badge>
      )}
    </div>
  );
}

/* ─── Risk Report Card ─── */

function RiskReportCard({
  totalExposure,
  maxExposure,
  positionCount,
  healthFactor,
  riskCategory,
}: {
  totalExposure: string;
  maxExposure: string;
  positionCount: number;
  healthFactor: number;
  riskCategory: string;
}) {
  const exposureNum = parseFloat(totalExposure);
  const maxNum = parseFloat(maxExposure);
  const utilizationPct = maxNum > 0 ? (exposureNum / maxNum) * 100 : 0;

  const healthColor =
    healthFactor >= 2.0
      ? 'text-positive'
      : healthFactor >= 1.5
        ? 'text-warning'
        : 'text-negative';

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <TrendingUp className="h-4 w-4 text-accent-teal inline mr-2" />
          Risk Report
        </CardTitle>
        <Badge variant="default" size="sm" className="capitalize">{riskCategory} Risk</Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {/* Total Exposure */}
          <div className="flex flex-col">
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Total Exposure</span>
            <span className="text-lg font-semibold text-text-primary font-mono-nums">
              {formatCurrency(totalExposure)}
            </span>
            <div className="mt-1.5">
              <div className="w-full h-1.5 rounded-full bg-bg-hover overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    utilizationPct < 60 ? 'bg-positive' : utilizationPct < 85 ? 'bg-warning' : 'bg-negative'
                  )}
                  style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-text-tertiary mt-0.5">
                {utilizationPct.toFixed(1)}% of {formatCurrency(maxExposure)} limit
              </span>
            </div>
          </div>

          {/* Position Count */}
          <div className="flex flex-col">
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Positions</span>
            <span className="text-lg font-semibold text-text-primary font-mono-nums">
              {positionCount}
            </span>
            <span className="text-[10px] text-text-tertiary mt-0.5">Active across pools</span>
          </div>

          {/* Avg Health Factor */}
          <div className="flex flex-col">
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Avg Health Factor</span>
            <span className={cn('text-lg font-semibold font-mono-nums', healthColor)}>
              {healthFactor.toFixed(2)}
            </span>
            <span className="text-[10px] text-text-tertiary mt-0.5">
              {healthFactor >= 2.0 ? 'Healthy' : healthFactor >= 1.5 ? 'Moderate' : 'At Risk'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Sub-Account Overview ─── */

function SubAccountOverview({ subAccounts }: { subAccounts: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Users className="h-4 w-4 text-accent-indigo inline mr-2" />
          Sub-Accounts
        </CardTitle>
        <Badge variant="default" size="sm">{subAccounts.length} Active</Badge>
      </CardHeader>
      <CardContent>
        {subAccounts.length === 0 ? (
          <p className="text-sm text-text-tertiary">No sub-accounts configured.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {subAccounts.map((account) => (
              <div
                key={account}
                className="flex items-center gap-3 p-2.5 rounded-md bg-bg-hover/50 border border-border-default"
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-md bg-accent-indigo/10">
                  <Users className="h-3.5 w-3.5 text-accent-indigo" />
                </div>
                <span className="text-sm text-text-primary font-mono-nums truncate">
                  {account}
                </span>
                <Badge variant="success" size="sm" className="ml-auto">Active</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Bulk Operations Summary ─── */

function BulkOperationsSummary({ operations }: { operations: Array<{ opId: string; operations: Array<{ opType: string; poolId: string; amount: string }>; status: BulkStatus; submittedAt: string }> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Layers className="h-4 w-4 text-accent-gold inline mr-2" />
          Recent Bulk Operations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {operations.length === 0 ? (
          <p className="text-sm text-text-tertiary">No bulk operations yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {operations.map((op) => {
              const config = bulkStatusConfig[op.status];
              const StatusIcon = config.icon;
              const totalAmount = op.operations.reduce((sum, o) => sum + parseFloat(o.amount), 0);

              return (
                <div
                  key={op.opId}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border-default hover:bg-bg-hover/50 transition-colors"
                >
                  <div className={cn('flex items-center justify-center w-8 h-8 rounded-md', `bg-${config.variant === 'success' ? 'positive' : config.variant === 'warning' ? 'warning' : config.variant === 'danger' ? 'negative' : 'accent-teal'}/10`)}>
                    <StatusIcon className={cn('h-4 w-4', config.variant === 'success' ? 'text-positive' : config.variant === 'warning' ? 'text-warning' : config.variant === 'danger' ? 'text-negative' : 'text-accent-teal')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">
                        {op.operations.length} operation{op.operations.length !== 1 ? 's' : ''}
                      </span>
                      <Badge variant={config.variant} size="sm">{op.status}</Badge>
                    </div>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {formatDateTime(op.submittedAt)} &middot; Total: {formatCurrency(totalAmount)}
                    </p>
                  </div>
                  <span className="text-xs font-mono-nums text-text-tertiary">
                    {op.opId}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Quick Actions ─── */

function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Activity className="h-4 w-4 text-accent-teal inline mr-2" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            variant="secondary"
            size="lg"
            className="flex-col h-auto py-4 gap-2"
            icon={<ArrowUpRight className="h-5 w-5 text-accent-teal" />}
          >
            <span className="text-sm font-medium">Bulk Deposit</span>
            <span className="text-[10px] text-text-tertiary font-normal">Multi-pool deposits</span>
          </Button>

          <Button
            variant="secondary"
            size="lg"
            className="flex-col h-auto py-4 gap-2"
            icon={<Download className="h-5 w-5 text-accent-indigo" />}
          >
            <span className="text-sm font-medium">Export Report</span>
            <span className="text-[10px] text-text-tertiary font-normal">CSV or PDF format</span>
          </Button>

          <Button
            variant="secondary"
            size="lg"
            className="flex-col h-auto py-4 gap-2"
            icon={<Key className="h-5 w-5 text-accent-gold" />}
          >
            <span className="text-sm font-medium">Manage API Keys</span>
            <span className="text-[10px] text-text-tertiary font-normal">Create or revoke keys</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Loading State ─── */

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton variant="rect" height={72} />
      <Skeleton variant="rect" height={160} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Skeleton variant="rect" height={200} />
        <Skeleton variant="rect" height={200} />
      </div>
      <Skeleton variant="rect" height={120} />
    </div>
  );
}

/* ─── Main Component ─── */

function InstitutionalDashboard() {
  const { institution, bulkOperations, isLoading, fetchInstitutionStatus } = useInstitutionalStore();

  useEffect(() => {
    if (!institution) {
      fetchInstitutionStatus();
    }
  }, [institution, fetchInstitutionStatus]);

  // Mock risk data derived from institution
  const riskData = useMemo(() => {
    if (!institution) return null;

    const maxExposure = institution.riskProfile.maxTotalExposure;
    // Simulated current exposure (40% of max for demo)
    const currentExposure = (parseFloat(maxExposure) * 0.4).toString();

    return {
      totalExposure: currentExposure,
      maxExposure,
      positionCount: 12,
      healthFactor: 2.34,
      riskCategory: institution.riskProfile.riskCategory,
    };
  }, [institution]);

  if (isLoading && !institution) {
    return <DashboardSkeleton />;
  }

  if (!institution) {
    return (
      <Card className="flex flex-col items-center justify-center py-16">
        <XCircle className="h-10 w-10 text-text-tertiary mb-3" />
        <h3 className="text-lg font-semibold text-text-primary">No Institution Found</h3>
        <p className="text-sm text-text-secondary mt-1">
          Complete the onboarding process to access your institutional dashboard.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* KYB Status Banner */}
      <KYBBanner
        status={institution.kybStatus}
        verifiedAt={institution.verifiedAt}
        expiresAt={institution.expiresAt}
        legalName={institution.legalName}
      />

      {/* Risk Report */}
      {riskData && (
        <RiskReportCard
          totalExposure={riskData.totalExposure}
          maxExposure={riskData.maxExposure}
          positionCount={riskData.positionCount}
          healthFactor={riskData.healthFactor}
          riskCategory={riskData.riskCategory}
        />
      )}

      {/* Sub-Accounts & Bulk Ops */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SubAccountOverview subAccounts={institution.subAccounts} />
        <BulkOperationsSummary operations={bulkOperations} />
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}

export { InstitutionalDashboard };
