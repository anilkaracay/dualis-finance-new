'use client';

import { useState } from 'react';
import { formatCurrency, formatPercent } from '@dualis/shared';
import { KPICard } from '@/components/data-display/KPICard';
import { Table, type Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminFilterBar } from '@/components/admin/AdminFilterBar';
import { AreaChart } from '@/components/charts/AreaChart';
import { Download } from 'lucide-react';

interface PoolPerformance { poolId: string; name: string; revenue: number; avgUtilization: number; supplyVolume: number; borrowVolume: number; nim: number }
interface LiquidationEvent { id: number; date: string; borrower: string; pool: string; debtRepaid: number; collateralSeized: number; penalty: number; hfBefore: number }
interface ReserveData { poolId: string; name: string; currentReserve: number; reserveRatio: number }
interface RateData { poolId: string; name: string; supplyRate: number; borrowRate: number; avgSupply30d: number; avgBorrow30d: number }

const MOCK_POOL_PERF: PoolPerformance[] = [
  { poolId: 'usdc-main', name: 'USDC Main Pool', revenue: 85_000, avgUtilization: 0.52, supplyVolume: 45_000_000, borrowVolume: 23_000_000, nim: 0.026 },
  { poolId: 'wbtc-main', name: 'wBTC Pool', revenue: 32_000, avgUtilization: 0.36, supplyVolume: 15_000_000, borrowVolume: 5_400_000, nim: 0.016 },
  { poolId: 'eth-main', name: 'ETH Pool', revenue: 28_000, avgUtilization: 0.48, supplyVolume: 12_000_000, borrowVolume: 5_760_000, nim: 0.016 },
  { poolId: 'tbill-main', name: 'T-Bill Pool', revenue: 8_000, avgUtilization: 0.28, supplyVolume: 8_000_000, borrowVolume: 2_240_000, nim: 0.010 },
];

const MOCK_LIQUIDATIONS: LiquidationEvent[] = [
  { id: 1, date: '2025-02-20', borrower: 'party::xyx', pool: 'wBTC Pool', debtRepaid: 45_000, collateralSeized: 49_500, penalty: 4_500, hfBefore: 0.95 },
  { id: 2, date: '2025-02-18', borrower: 'party::abc', pool: 'ETH Pool', debtRepaid: 20_000, collateralSeized: 21_600, penalty: 1_600, hfBefore: 0.88 },
  { id: 3, date: '2025-02-15', borrower: 'party::def', pool: 'CC Token Pool', debtRepaid: 8_000, collateralSeized: 9_200, penalty: 1_200, hfBefore: 0.92 },
];

const MOCK_RESERVES: ReserveData[] = [
  { poolId: 'usdc-main', name: 'USDC Main Pool', currentReserve: 250_000, reserveRatio: 0.02 },
  { poolId: 'wbtc-main', name: 'wBTC Pool', currentReserve: 52_500, reserveRatio: 0.015 },
  { poolId: 'eth-main', name: 'ETH Pool', currentReserve: 41_000, reserveRatio: 0.01 },
  { poolId: 'tbill-main', name: 'T-Bill Pool', currentReserve: 7_500, reserveRatio: 0.005 },
];

const MOCK_RATES: RateData[] = [
  { poolId: 'usdc-main', name: 'USDC Main Pool', supplyRate: 0.032, borrowRate: 0.058, avgSupply30d: 0.030, avgBorrow30d: 0.055 },
  { poolId: 'wbtc-main', name: 'wBTC Pool', supplyRate: 0.012, borrowRate: 0.028, avgSupply30d: 0.011, avgBorrow30d: 0.026 },
  { poolId: 'eth-main', name: 'ETH Pool', supplyRate: 0.018, borrowRate: 0.034, avgSupply30d: 0.017, avgBorrow30d: 0.032 },
];

export default function AdminReportsPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const totalRevenue = MOCK_POOL_PERF.reduce((s, p) => s + p.revenue, 0);
  const totalLiqDebt = MOCK_LIQUIDATIONS.reduce((s, l) => s + l.debtRepaid, 0);
  const totalLiqPenalty = MOCK_LIQUIDATIONS.reduce((s, l) => s + l.penalty, 0);
  const totalReserves = MOCK_RESERVES.reduce((s, r) => s + r.currentReserve, 0);

  const perfColumns: Column<PoolPerformance>[] = [
    { key: 'name', header: 'Pool', cell: (row) => <span className="font-medium text-text-primary">{row.name}</span> },
    { key: 'revenue', header: 'Revenue', numeric: true, sortable: true, cell: (row) => formatCurrency(row.revenue, { compact: true }) },
    { key: 'avgUtilization', header: 'Avg Util.', numeric: true, cell: (row) => formatPercent(row.avgUtilization) },
    { key: 'supplyVolume', header: 'Supply Vol.', numeric: true, cell: (row) => formatCurrency(row.supplyVolume, { compact: true }) },
    { key: 'borrowVolume', header: 'Borrow Vol.', numeric: true, cell: (row) => formatCurrency(row.borrowVolume, { compact: true }) },
    { key: 'nim', header: 'NIM', numeric: true, cell: (row) => formatPercent(row.nim) },
  ];

  const liqColumns: Column<LiquidationEvent>[] = [
    { key: 'date', header: 'Date', cell: (row) => row.date },
    { key: 'borrower', header: 'Borrower', cell: (row) => <span className="font-mono text-xs">{row.borrower}</span> },
    { key: 'pool', header: 'Pool', cell: (row) => row.pool },
    { key: 'debtRepaid', header: 'Debt Repaid', numeric: true, cell: (row) => formatCurrency(row.debtRepaid) },
    { key: 'collateralSeized', header: 'Collateral', numeric: true, cell: (row) => formatCurrency(row.collateralSeized) },
    { key: 'penalty', header: 'Penalty', numeric: true, cell: (row) => formatCurrency(row.penalty) },
    { key: 'hfBefore', header: 'HF Before', numeric: true, cell: (row) => <span className="text-negative">{row.hfBefore.toFixed(2)}</span> },
  ];

  const reserveColumns: Column<ReserveData>[] = [
    { key: 'name', header: 'Pool', cell: (row) => row.name },
    { key: 'currentReserve', header: 'Reserve', numeric: true, cell: (row) => formatCurrency(row.currentReserve) },
    { key: 'reserveRatio', header: 'Ratio', numeric: true, cell: (row) => formatPercent(row.reserveRatio) },
  ];

  const rateColumns: Column<RateData>[] = [
    { key: 'name', header: 'Pool', cell: (row) => row.name },
    { key: 'supplyRate', header: 'Supply Rate', numeric: true, cell: (row) => formatPercent(row.supplyRate) },
    { key: 'borrowRate', header: 'Borrow Rate', numeric: true, cell: (row) => formatPercent(row.borrowRate) },
    { key: 'avgSupply30d', header: 'Avg Supply 30d', numeric: true, cell: (row) => formatPercent(row.avgSupply30d) },
    { key: 'avgBorrow30d', header: 'Avg Borrow 30d', numeric: true, cell: (row) => formatPercent(row.avgBorrow30d) },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Financial Reports"
        description="Revenue, pool performance, liquidations, reserves, and rate analytics"
        actions={
          <Button variant="secondary" size="sm"><Download className="h-3.5 w-3.5 mr-1" /> Export CSV</Button>
        }
      />

      <AdminFilterBar
        dateRange={{ from: dateFrom, to: dateTo, onFromChange: setDateFrom, onToChange: setDateTo }}
      />

      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="pools">Pool Performance</TabsTrigger>
          <TabsTrigger value="liquidations">Liquidations</TabsTrigger>
          <TabsTrigger value="reserves">Reserves</TabsTrigger>
          <TabsTrigger value="rates">Rates</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <KPICard label="Total Revenue" value={totalRevenue} prefix="$" decimals={0} size="sm" />
            <KPICard label="This Month" value={12_400} prefix="$" decimals={0} size="sm" />
            <KPICard label="This Week" value={3_200} prefix="$" decimals={0} size="sm" />
            <KPICard label="Avg Daily" value={450} prefix="$" decimals={0} size="sm" />
          </div>
          <div className="rounded-md bg-bg-tertiary border border-border-default p-5">
            <AreaChart
              data={Array.from({ length: 30 }, (_, i) => ({
                date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(5, 10),
                value: 300 + Math.random() * 400,
              }))}
              xKey="date" yKey="value" height={250}
            />
          </div>
        </TabsContent>

        <TabsContent value="pools" className="mt-4">
          <Table<PoolPerformance> columns={perfColumns} data={MOCK_POOL_PERF} rowKey={(row) => row.poolId} compact />
        </TabsContent>

        <TabsContent value="liquidations" className="mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <KPICard label="Total Liquidations" value={MOCK_LIQUIDATIONS.length} decimals={0} size="sm" />
            <KPICard label="Total Debt Repaid" value={totalLiqDebt} prefix="$" decimals={0} size="sm" />
            <KPICard label="Total Penalties" value={totalLiqPenalty} prefix="$" decimals={0} size="sm" />
            <KPICard label="Avg HF at Liq." value={0.92} decimals={2} size="sm" />
          </div>
          <Table<LiquidationEvent> columns={liqColumns} data={MOCK_LIQUIDATIONS} rowKey={(row) => String(row.id)} compact />
        </TabsContent>

        <TabsContent value="reserves" className="mt-4">
          <div className="mb-4">
            <KPICard label="Total Reserves" value={totalReserves} prefix="$" decimals={0} size="sm" className="max-w-xs" />
          </div>
          <Table<ReserveData> columns={reserveColumns} data={MOCK_RESERVES} rowKey={(row) => row.poolId} compact />
        </TabsContent>

        <TabsContent value="rates" className="mt-4">
          <Table<RateData> columns={rateColumns} data={MOCK_RATES} rowKey={(row) => row.poolId} compact />
        </TabsContent>
      </Tabs>
    </div>
  );
}
