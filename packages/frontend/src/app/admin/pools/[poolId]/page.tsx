'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { formatCurrency } from '@dualis/shared';
import { KPICard } from '@/components/data-display/KPICard';
import { Table, type Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import { AreaChart } from '@/components/charts/AreaChart';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useQuery } from '@/hooks/api/useQuery';
import { Pause, Play, Archive, Save, RotateCcw } from 'lucide-react';

// Mock pool detail data
const MOCK_POOL_DETAIL = {
  poolId: 'usdc-main',
  name: 'USDC Main Pool',
  asset: 'USDC',
  status: 'active' as const,
  tvl: 25_000_000,
  totalBorrow: 12_500_000,
  utilization: 0.50,
  supplyAPY: 0.032,
  borrowAPY: 0.058,
  totalSuppliers: 342,
  totalBorrowers: 89,
  params: {
    baseRatePerYear: 0.02,
    multiplierPerYear: 0.07,
    jumpMultiplierPerYear: 0.30,
    kink: 0.80,
    maxLTV: 0.80,
    liquidationThreshold: 0.85,
    liquidationPenalty: 0.04,
    liquidationBonus: 0.02,
    supplyCap: 1_000_000_000,
    borrowCap: 500_000_000,
  },
  createdAt: '2024-06-01',
};

const MOCK_POSITIONS = [
  { id: 'pos-1', user: 'party::alice', type: 'supply', amount: 500_000, valueUSD: 500_000, healthFactor: null, duration: '180 days' },
  { id: 'pos-2', user: 'party::bob', type: 'borrow', amount: 100_000, valueUSD: 100_000, healthFactor: 1.65, duration: '45 days' },
  { id: 'pos-3', user: 'party::carol', type: 'supply', amount: 250_000, valueUSD: 250_000, healthFactor: null, duration: '90 days' },
  { id: 'pos-4', user: 'party::dave', type: 'borrow', amount: 50_000, valueUSD: 50_000, healthFactor: 1.15, duration: '30 days' },
  { id: 'pos-5', user: 'party::eve', type: 'borrow', amount: 200_000, valueUSD: 200_000, healthFactor: 2.10, duration: '60 days' },
];

const MOCK_HISTORY = [
  { id: 1, event: 'supply', user: 'party::alice', amount: 500_000, timestamp: '2024-12-01T10:00:00Z' },
  { id: 2, event: 'borrow', user: 'party::bob', amount: 100_000, timestamp: '2024-12-02T14:30:00Z' },
  { id: 3, event: 'parameter_change', user: 'admin', amount: 0, timestamp: '2024-11-15T09:00:00Z' },
  { id: 4, event: 'repay', user: 'party::dave', amount: 25_000, timestamp: '2024-12-05T16:00:00Z' },
];

interface Position { id: string; user: string; type: string; amount: number; valueUSD: number; healthFactor: number | null; duration: string }
interface HistoryEvent { id: number; event: string; user: string; amount: number; timestamp: string }

export default function PoolDetailPage() {
  const params = useParams();
  const { canManagePools } = useAdminRole();
  const poolId = params.poolId as string;

  const { data: poolData, isLoading } = useQuery(`/admin/pools/${poolId}`, {
    fallbackData: { data: { ...MOCK_POOL_DETAIL, poolId } },
  });
  const pool = (poolData as any)?.data ?? { ...MOCK_POOL_DETAIL, poolId };

  const [editParams, setEditParams] = useState(pool.params ?? MOCK_POOL_DETAIL.params);
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  const positionColumns: Column<Position>[] = [
    { key: 'user', header: 'User', cell: (row) => <span className="font-mono text-xs">{row.user}</span> },
    { key: 'type', header: 'Type', cell: (row) => <AdminStatusBadge status={row.type === 'supply' ? 'active' : 'pending'} /> },
    { key: 'amount', header: 'Amount', numeric: true, cell: (row) => formatCurrency(row.amount, { compact: true }) },
    { key: 'valueUSD', header: 'Value', numeric: true, cell: (row) => formatCurrency(row.valueUSD, { compact: true }) },
    { key: 'healthFactor', header: 'Health Factor', numeric: true, cell: (row) =>
      row.healthFactor != null ? (
        <span className={row.healthFactor < 1.2 ? 'text-negative' : row.healthFactor < 1.5 ? 'text-warning' : 'text-positive'}>
          {row.healthFactor.toFixed(2)}
        </span>
      ) : <span className="text-text-tertiary">—</span>
    },
    { key: 'duration', header: 'Duration', cell: (row) => <span className="text-text-secondary">{row.duration}</span> },
  ];

  const historyColumns: Column<HistoryEvent>[] = [
    { key: 'event', header: 'Event', cell: (row) => <span className="capitalize text-text-primary">{row.event.replace('_', ' ')}</span> },
    { key: 'user', header: 'User', cell: (row) => <span className="font-mono text-xs">{row.user}</span> },
    { key: 'amount', header: 'Amount', numeric: true, cell: (row) => row.amount > 0 ? formatCurrency(row.amount, { compact: true }) : '—' },
    { key: 'timestamp', header: 'Time', cell: (row) => new Date(row.timestamp).toLocaleString() },
  ];

  return (
    <div>
      <AdminPageHeader
        title={pool.name ?? poolId}
        description={`Pool ID: ${poolId} · Asset: ${pool.asset ?? 'N/A'}`}
        actions={
          <div className="flex items-center gap-2">
            <AdminStatusBadge status={pool.status ?? 'active'} size="md" />
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <KPICard label="TVL" value={pool.tvl ?? 0} prefix="$" decimals={0} size="sm" loading={isLoading} />
        <KPICard label="Utilization" value={(pool.utilization ?? 0) * 100} suffix="%" decimals={1} size="sm" loading={isLoading} />
        <KPICard label="Supply APY" value={(pool.supplyAPY ?? 0) * 100} suffix="%" decimals={2} size="sm" loading={isLoading} />
        <KPICard label="Borrow APY" value={(pool.borrowAPY ?? 0) * 100} suffix="%" decimals={2} size="sm" loading={isLoading} />
        <KPICard label="Borrowers" value={pool.totalBorrowers ?? 0} decimals={0} size="sm" loading={isLoading} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="rounded-md bg-bg-tertiary border border-border-default p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-3">TVL & Utilization (30d)</h3>
            <AreaChart
              data={Array.from({ length: 30 }, (_, i) => ({
                date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(5, 10),
                value: (pool.tvl ?? 25_000_000) * (0.9 + Math.random() * 0.2),
              }))}
              xKey="date"
              yKey="value"
              height={250}
            />
          </div>
        </TabsContent>

        <TabsContent value="parameters" className="mt-4">
          <div className="rounded-md bg-bg-tertiary border border-border-default p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Rate Model Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {[
                { key: 'baseRatePerYear', label: 'Base Rate / Year', max: 1 },
                { key: 'multiplierPerYear', label: 'Multiplier / Year', max: 2 },
                { key: 'jumpMultiplierPerYear', label: 'Jump Multiplier / Year', max: 5 },
                { key: 'kink', label: 'Kink (Optimal Utilization)', max: 1 },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-text-secondary mb-1">{label}</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={(editParams as any)[key] ?? 0}
                    onChange={(e) => setEditParams((prev: any) => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                    disabled={!canManagePools}
                    className="font-mono"
                  />
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-text-primary mb-4">Collateral Config</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {[
                { key: 'maxLTV', label: 'Max LTV' },
                { key: 'liquidationThreshold', label: 'Liquidation Threshold' },
                { key: 'liquidationPenalty', label: 'Liquidation Penalty' },
                { key: 'liquidationBonus', label: 'Liquidation Bonus' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-text-secondary mb-1">{label}</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={(editParams as any)[key] ?? 0}
                    onChange={(e) => setEditParams((prev: any) => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                    disabled={!canManagePools}
                    className="font-mono"
                  />
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-text-primary mb-4">Caps</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Supply Cap ($)</label>
                <Input
                  type="number"
                  value={editParams.supplyCap ?? 0}
                  onChange={(e) => setEditParams((prev: any) => ({ ...prev, supplyCap: parseFloat(e.target.value) || 0 }))}
                  disabled={!canManagePools}
                  className="font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Borrow Cap ($)</label>
                <Input
                  type="number"
                  value={editParams.borrowCap ?? 0}
                  onChange={(e) => setEditParams((prev: any) => ({ ...prev, borrowCap: parseFloat(e.target.value) || 0 }))}
                  disabled={!canManagePools}
                  className="font-mono"
                />
              </div>
            </div>

            {canManagePools && (
              <div className="flex items-center gap-2 pt-4 border-t border-border-default">
                <Button variant="primary" size="sm" onClick={() => setSaveDialogOpen(true)}>
                  <Save className="h-3.5 w-3.5 mr-1" /> Save Changes
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setEditParams(MOCK_POOL_DETAIL.params)}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
                </Button>
              </div>
            )}
          </div>

          {/* Emergency Actions */}
          {canManagePools && (
            <div className="mt-6 rounded-md border border-negative/20 bg-negative/5 p-5">
              <h3 className="text-sm font-semibold text-negative mb-3">Emergency Actions</h3>
              <div className="flex items-center gap-2">
                {pool.status === 'active' ? (
                  <Button variant="danger" size="sm" onClick={() => setPauseDialogOpen(true)}>
                    <Pause className="h-3.5 w-3.5 mr-1" /> Pause Pool
                  </Button>
                ) : pool.status === 'paused' ? (
                  <Button variant="success" size="sm" onClick={() => setResumeDialogOpen(true)}>
                    <Play className="h-3.5 w-3.5 mr-1" /> Resume Pool
                  </Button>
                ) : null}
                <Button variant="secondary" size="sm" onClick={() => setArchiveDialogOpen(true)}>
                  <Archive className="h-3.5 w-3.5 mr-1" /> Archive Pool
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="positions" className="mt-4">
          <Table<Position>
            columns={positionColumns}
            data={MOCK_POSITIONS}
            rowKey={(row) => row.id}
            compact
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Table<HistoryEvent>
            columns={historyColumns}
            data={MOCK_HISTORY}
            rowKey={(row) => String(row.id)}
            compact
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AdminConfirmDialog
        open={pauseDialogOpen}
        onOpenChange={setPauseDialogOpen}
        title="Pause Pool"
        description="Pausing this pool will stop all new supply and borrow operations. Existing positions will not be affected."
        confirmText="Pause Pool"
        destructive
        typeToConfirm={poolId}
        onConfirm={() => setPauseDialogOpen(false)}
      />
      <AdminConfirmDialog
        open={resumeDialogOpen}
        onOpenChange={setResumeDialogOpen}
        title="Resume Pool"
        description="Resuming this pool will re-enable supply and borrow operations."
        confirmText="Resume Pool"
        onConfirm={() => setResumeDialogOpen(false)}
      />
      <AdminConfirmDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        title="Archive Pool"
        description="Archiving this pool is permanent. Only archive pools with zero TVL and no active positions."
        confirmText="Archive Pool"
        destructive
        typeToConfirm={poolId}
        onConfirm={() => setArchiveDialogOpen(false)}
      />
      <AdminConfirmDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        title="Save Parameter Changes"
        description="Are you sure you want to update the pool parameters? This will take effect immediately."
        confirmText="Save Changes"
        onConfirm={() => setSaveDialogOpen(false)}
      />
    </div>
  );
}
