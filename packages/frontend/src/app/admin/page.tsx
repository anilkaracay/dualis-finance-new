'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatPercent } from '@dualis/shared';
import { KPICard } from '@/components/data-display/KPICard';
import { Table, type Column } from '@/components/ui/Table';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import { AreaChart } from '@/components/charts/AreaChart';
import { useAdminDashboardStore } from '@/stores/useAdminDashboardStore';
import { AlertCircle, Clock } from 'lucide-react';
import type { AdminPoolSummary } from '@dualis/shared';

type ChartTab = 'tvl' | 'revenue' | 'utilization' | 'borrow';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { stats, pools, alerts, recentActivity, isLoading, fetchDashboard } = useAdminDashboardStore();
  const [chartTab, setChartTab] = useState<ChartTab>('tvl');

  useEffect(() => {
    void fetchDashboard();
    const interval = setInterval(() => { void fetchDashboard(); }, 30_000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  // Pool table columns
  const poolColumns: Column<AdminPoolSummary>[] = [
    { key: 'name', header: 'Pool', cell: (row) => (
      <div>
        <span className="font-medium text-text-primary">{row.name}</span>
        <span className="ml-2 text-text-tertiary text-xs">{row.asset}</span>
      </div>
    )},
    { key: 'status', header: 'Status', cell: (row) => <AdminStatusBadge status={row.status} /> },
    { key: 'tvl', header: 'TVL', numeric: true, sortable: true, cell: (row) => (
      <span className="text-text-primary">{formatCurrency(row.tvl, { compact: true })}</span>
    )},
    { key: 'utilization', header: 'Util.', numeric: true, sortable: true, cell: (row) => (
      <div className="flex items-center gap-2 justify-end">
        <div className="w-12 h-1.5 rounded-full bg-bg-hover overflow-hidden">
          <div
            className={`h-full rounded-full ${row.utilization > 0.85 ? 'bg-negative' : row.utilization > 0.7 ? 'bg-warning' : 'bg-positive'}`}
            style={{ width: `${row.utilization * 100}%` }}
          />
        </div>
        <span className="text-xs">{formatPercent(row.utilization)}</span>
      </div>
    )},
    { key: 'supplyAPY', header: 'Supply APY', numeric: true, cell: (row) => formatPercent(row.supplyAPY) },
    { key: 'borrowAPY', header: 'Borrow APY', numeric: true, cell: (row) => formatPercent(row.borrowAPY) },
  ];

  const tvlSparkline = stats ? [42, 43, 41, 44, 45, 44.5, stats.totalTVL / 1_000_000] : undefined;
  const loansSparkline = [115, 118, 120, 122, 125, 124, stats?.activeLoans ?? 127];
  const usersSparkline = [1780, 1790, 1800, 1810, 1825, 1835, stats?.totalUsers ?? 1842];
  const revenueSparkline = [140, 145, 148, 150, 153, 155, (stats?.protocolRevenue ?? 156000) / 1000];

  return (
    <div>
      <AdminPageHeader title="Dashboard" description="Protocol overview at a glance" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KPICard
          label="Total TVL"
          value={stats?.totalTVL ?? 0}
          prefix="$"
          decimals={0}
          trend={stats && stats.tvlDelta24h >= 0 ? 'up' : 'down'}
          trendValue={stats ? `${stats.tvlDelta24h > 0 ? '+' : ''}${stats.tvlDelta24h.toFixed(1)}%` : undefined}
          trendContext="vs 24h ago"
          sparkline={tvlSparkline}
          loading={isLoading}
        />
        <KPICard
          label="Active Loans"
          value={stats?.activeLoans ?? 0}
          decimals={0}
          trend="up"
          trendValue={`$${formatCurrency(stats?.totalBorrowValue ?? 0, { compact: true }).replace('$', '')}`}
          trendContext="total borrowed"
          sparkline={loansSparkline}
          loading={isLoading}
        />
        <KPICard
          label="Total Users"
          value={stats?.totalUsers ?? 0}
          decimals={0}
          trend="up"
          trendValue={`+${stats?.newUsersThisWeek ?? 0}`}
          trendContext="this week"
          sparkline={usersSparkline}
          loading={isLoading}
        />
        <KPICard
          label="Protocol Revenue"
          value={stats?.protocolRevenue ?? 0}
          prefix="$"
          decimals={0}
          trend="up"
          trendValue={`$${formatCurrency(stats?.revenueThisMonth ?? 0, { compact: true }).replace('$', '')}`}
          trendContext="this month"
          sparkline={revenueSparkline}
          loading={isLoading}
        />
      </div>

      {/* Chart + Alerts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        {/* Main chart */}
        <div className="xl:col-span-2 rounded-md bg-bg-tertiary border border-border-default p-5">
          <div className="flex items-center gap-2 mb-4">
            {(['tvl', 'revenue', 'utilization', 'borrow'] as ChartTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setChartTab(tab)}
                className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                  chartTab === tab
                    ? 'bg-accent-teal/10 text-accent-teal'
                    : 'text-text-tertiary hover:text-text-primary'
                }`}
              >
                {tab === 'tvl' ? 'TVL' : tab === 'revenue' ? 'Revenue' : tab === 'utilization' ? 'Utilization' : 'Borrow Volume'}
              </button>
            ))}
          </div>
          <AreaChart
            data={Array.from({ length: 30 }, (_, i) => ({
              date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(5, 10),
              value: chartTab === 'tvl'
                ? 40_000_000 + Math.sin(i / 5) * 5_000_000 + i * 100_000
                : chartTab === 'revenue'
                  ? 3000 + Math.random() * 2000
                  : chartTab === 'utilization'
                    ? 0.5 + Math.sin(i / 7) * 0.15
                    : 1_000_000 + Math.random() * 500_000,
            }))}
            xKey="date"
            yKey="value"
            height={250}
          />
        </div>

        {/* System Alerts */}
        <div className="rounded-md bg-bg-tertiary border border-border-default p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              System Alerts
            </h3>
            <span className="text-[10px] text-text-tertiary">{alerts.length} alerts</span>
          </div>
          <div className="space-y-2 max-h-[240px] overflow-y-auto">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-2 p-2 rounded-sm bg-bg-primary/50 border border-border-subtle"
              >
                <span className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                  alert.severity === 'critical' ? 'bg-negative' : alert.severity === 'warning' ? 'bg-warning' : 'bg-info'
                }`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-text-primary truncate">{alert.message}</p>
                  <p className="text-[10px] text-text-tertiary mt-0.5">
                    {alert.asset} &middot; {formatRelativeTime(alert.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pool Overview Table */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Pool Overview</h3>
        <Table<AdminPoolSummary>
          columns={poolColumns}
          data={pools}
          rowKey={(row) => row.poolId}
          onRowClick={(row) => router.push(`/admin/pools/${row.poolId}`)}
          loading={isLoading}
          compact
        />
      </div>

      {/* Recent Admin Activity */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-text-tertiary" />
          Recent Admin Activity
        </h3>
        <div className="space-y-1">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-3 px-3 py-2 rounded-sm hover:bg-bg-hover/50 transition-colors"
            >
              <div className="h-6 w-6 rounded-full bg-bg-tertiary flex items-center justify-center text-[10px] font-medium text-text-secondary shrink-0">
                {activity.adminName?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-text-primary">
                  <span className="font-medium">{activity.adminName ?? 'Admin'}</span>
                  {' '}{formatActionLabel(activity.action)}{' '}
                  {activity.targetId && <span className="font-mono text-text-secondary">{activity.targetId}</span>}
                </span>
              </div>
              <span className="text-[10px] text-text-tertiary shrink-0">{formatRelativeTime(activity.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatActionLabel(action: string): string {
  const labels: Record<string, string> = {
    'pool.pause': 'paused pool',
    'pool.resume': 'resumed pool',
    'pool.create': 'created pool',
    'pool.update_params': 'updated params for',
    'pool.archive': 'archived pool',
    'user.approve_kyb': 'approved KYB for',
    'user.reject_kyb': 'rejected KYB for',
    'user.suspend': 'suspended user',
    'user.unsuspend': 'unsuspended user',
    'user.blacklist': 'blacklisted user',
    'user.change_role': 'changed role for',
    'oracle.reset_cb': 'reset circuit breaker for',
    'oracle.manual_price': 'set manual price for',
    'config.update': 'updated protocol config',
    'config.pause': 'paused protocol',
    'config.resume': 'resumed protocol',
  };
  return labels[action] ?? action.replace(/[._]/g, ' ');
}
