'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatPercent } from '@dualis/shared';
import { Table, type Column, type SortDirection } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminFilterBar } from '@/components/admin/AdminFilterBar';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useQuery } from '@/hooks/api/useQuery';
import { Plus } from 'lucide-react';
import type { AdminPoolSummary } from '@dualis/shared';

const MOCK_POOLS: AdminPoolSummary[] = [
  { poolId: 'usdc-main', name: 'USDC Main Pool', asset: 'USDC', status: 'active', tvl: 25_000_000, totalBorrow: 12_500_000, utilization: 0.50, supplyAPY: 0.032, borrowAPY: 0.058, maxLTV: 0.80, liquidationThreshold: 0.85, createdAt: '2024-06-01' },
  { poolId: 'wbtc-main', name: 'wBTC Pool', asset: 'wBTC', status: 'active', tvl: 10_000_000, totalBorrow: 3_500_000, utilization: 0.35, supplyAPY: 0.012, borrowAPY: 0.028, maxLTV: 0.73, liquidationThreshold: 0.80, createdAt: '2024-06-15' },
  { poolId: 'eth-main', name: 'ETH Pool', asset: 'ETH', status: 'active', tvl: 8_200_000, totalBorrow: 4_100_000, utilization: 0.50, supplyAPY: 0.018, borrowAPY: 0.034, maxLTV: 0.75, liquidationThreshold: 0.82, createdAt: '2024-07-01' },
  { poolId: 'tbill-main', name: 'T-Bill Pool', asset: 'T-BILL', status: 'active', tvl: 5_000_000, totalBorrow: 1_500_000, utilization: 0.30, supplyAPY: 0.042, borrowAPY: 0.052, maxLTV: 0.85, liquidationThreshold: 0.90, createdAt: '2024-08-01' },
  { poolId: 'cc-main', name: 'CC Token Pool', asset: 'CC', status: 'paused', tvl: 2_000_000, totalBorrow: 900_000, utilization: 0.45, supplyAPY: 0.045, borrowAPY: 0.095, maxLTV: 0.55, liquidationThreshold: 0.65, createdAt: '2024-09-01' },
  { poolId: 'spy-main', name: 'SPY ETF Pool', asset: 'SPY', status: 'active', tvl: 3_000_000, totalBorrow: 800_000, utilization: 0.27, supplyAPY: 0.015, borrowAPY: 0.032, maxLTV: 0.65, liquidationThreshold: 0.75, createdAt: '2024-10-01' },
];

export default function AdminPoolsPage() {
  const router = useRouter();
  const { canManagePools } = useAdminRole();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assetFilter, setAssetFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | undefined>();
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const queryUrl = `/admin/pools?page=${page}&limit=20${statusFilter ? `&status=${statusFilter}` : ''}${assetFilter ? `&asset=${assetFilter}` : ''}${search ? `&search=${search}` : ''}${sortColumn ? `&sort=${sortColumn}&order=${sortDirection ?? 'asc'}` : ''}`;
  const { data, isLoading } = useQuery<{ data: AdminPoolSummary[]; pagination?: { total: number } }>(queryUrl, { fallbackData: { data: MOCK_POOLS, pagination: { total: MOCK_POOLS.length } } });

  const pools = data?.data ?? MOCK_POOLS;
  const total = data?.pagination?.total ?? pools.length;
  const totalPages = Math.ceil(total / 20);

  const handleSort = (column: string, direction: SortDirection) => {
    setSortColumn(direction ? column : undefined);
    setSortDirection(direction);
  };

  const columns: Column<AdminPoolSummary>[] = [
    { key: 'poolId', header: 'Pool ID', sortable: true, cell: (row) => <span className="font-mono text-xs text-text-secondary">{row.poolId}</span> },
    { key: 'name', header: 'Name', sortable: true, cell: (row) => <span className="font-medium text-text-primary">{row.name}</span> },
    { key: 'asset', header: 'Asset', cell: (row) => <span className="text-text-secondary">{row.asset}</span> },
    { key: 'status', header: 'Status', cell: (row) => <AdminStatusBadge status={row.status} /> },
    { key: 'tvl', header: 'TVL', numeric: true, sortable: true, cell: (row) => formatCurrency(row.tvl, { compact: true }) },
    { key: 'totalBorrow', header: 'Total Borrow', numeric: true, sortable: true, cell: (row) => formatCurrency(row.totalBorrow, { compact: true }) },
    { key: 'utilization', header: 'Utilization', numeric: true, sortable: true, cell: (row) => (
      <div className="flex items-center gap-2 justify-end">
        <div className="w-10 h-1.5 rounded-full bg-bg-hover overflow-hidden">
          <div
            className={`h-full rounded-full ${row.utilization > 0.85 ? 'bg-negative' : row.utilization > 0.7 ? 'bg-warning' : 'bg-positive'}`}
            style={{ width: `${row.utilization * 100}%` }}
          />
        </div>
        <span>{formatPercent(row.utilization)}</span>
      </div>
    )},
    { key: 'supplyAPY', header: 'Supply APY', numeric: true, sortable: true, cell: (row) => formatPercent(row.supplyAPY) },
    { key: 'borrowAPY', header: 'Borrow APY', numeric: true, sortable: true, cell: (row) => formatPercent(row.borrowAPY) },
    { key: 'maxLTV', header: 'LTV', numeric: true, cell: (row) => formatPercent(row.maxLTV) },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Pool Management"
        description="Manage lending pools, parameters, and emergency actions"
        actions={
          canManagePools ? (
            <Button variant="primary" size="sm" onClick={() => router.push('/admin/pools/create')}>
              <Plus className="h-4 w-4 mr-1" />
              Create Pool
            </Button>
          ) : undefined
        }
      />

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search pools..."
        filters={[
          {
            key: 'status',
            label: 'All Statuses',
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Paused', value: 'paused' },
              { label: 'Archived', value: 'archived' },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
          {
            key: 'asset',
            label: 'All Assets',
            options: ['USDC', 'wBTC', 'ETH', 'T-BILL', 'CC', 'SPY'].map((a) => ({ label: a, value: a })),
            value: assetFilter,
            onChange: setAssetFilter,
          },
        ]}
      />

      <Table<AdminPoolSummary>
        columns={columns}
        data={pools}
        rowKey={(row) => row.poolId}
        onRowClick={(row) => router.push(`/admin/pools/${row.poolId}`)}
        {...(sortColumn !== undefined ? { sortColumn } : {})}
        {...(sortDirection !== undefined ? { sortDirection } : {})}
        onSort={handleSort}
        loading={isLoading}
        compact
      />

      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={20}
        onPageChange={setPage}
      />
    </div>
  );
}
