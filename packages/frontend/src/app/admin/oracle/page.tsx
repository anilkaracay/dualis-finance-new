'use client';

import { useState } from 'react';
import { Table, type Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { AreaChart } from '@/components/charts/AreaChart';
import { useAdminRole } from '@/hooks/useAdminRole';
import { RotateCcw, Upload } from 'lucide-react';

interface OracleFeed {
  asset: string;
  price: number;
  change24h: number;
  activeSources: number;
  totalSources: number;
  confidence: number;
  twap5m: number;
  deviation: number;
  staleness: number;
  cbStatus: 'ok' | 'tripped';
}

const MOCK_FEEDS: OracleFeed[] = [
  { asset: 'wBTC', price: 62_450, change24h: 1.2, activeSources: 3, totalSources: 3, confidence: 0.98, twap5m: 62_430, deviation: 0.03, staleness: 15, cbStatus: 'ok' },
  { asset: 'wETH', price: 3_420, change24h: -0.8, activeSources: 3, totalSources: 3, confidence: 0.97, twap5m: 3_425, deviation: 0.05, staleness: 12, cbStatus: 'ok' },
  { asset: 'USDC', price: 1.0, change24h: 0.0, activeSources: 2, totalSources: 2, confidence: 1.0, twap5m: 1.0, deviation: 0.0, staleness: 8, cbStatus: 'ok' },
  { asset: 'CC', price: 0.85, change24h: -2.5, activeSources: 2, totalSources: 3, confidence: 0.92, twap5m: 0.86, deviation: 0.8, staleness: 180, cbStatus: 'ok' },
  { asset: 'T-BILL', price: 99.72, change24h: 0.01, activeSources: 1, totalSources: 1, confidence: 0.99, twap5m: 99.72, deviation: 0.0, staleness: 3600, cbStatus: 'ok' },
  { asset: 'TIFA-REC', price: 0.92, change24h: -5.0, activeSources: 1, totalSources: 1, confidence: 0.85, twap5m: 0.94, deviation: 2.1, staleness: 7200, cbStatus: 'tripped' },
  { asset: 'SPY', price: 520.30, change24h: 0.3, activeSources: 1, totalSources: 1, confidence: 0.96, twap5m: 520.10, deviation: 0.04, staleness: 60, cbStatus: 'ok' },
];

const MOCK_ALERTS = [
  { id: 1, severity: 'critical', asset: 'TIFA-REC', type: 'CIRCUIT_BREAKER_TRIPPED', message: 'TIFA-REC circuit breaker tripped: 12% deviation', timestamp: new Date(Date.now() - 600000).toISOString() },
  { id: 2, severity: 'warning', asset: 'CC', type: 'STALE_PRICE', message: 'CC price feed stale for 3 minutes', timestamp: new Date(Date.now() - 300000).toISOString() },
  { id: 3, severity: 'warning', asset: 'USDC', type: 'SOURCE_DOWN', message: 'USDC source 3 offline', timestamp: new Date(Date.now() - 900000).toISOString() },
];

interface Alert { id: number; severity: string; asset: string; type: string; message: string; timestamp: string }

export default function AdminOraclePage() {
  const { canManagePools: isAdmin } = useAdminRole();
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetAsset, setResetAsset] = useState('');
  const [navDialogOpen, setNavDialogOpen] = useState(false);

  const trippedCount = MOCK_FEEDS.filter((f) => f.cbStatus === 'tripped').length;
  const staleCount = MOCK_FEEDS.filter((f) => f.staleness > 300).length;
  const healthStatus = trippedCount > 0 ? 'critical' : staleCount > 0 ? 'degraded' : 'healthy';

  const feedColumns: Column<OracleFeed>[] = [
    { key: 'asset', header: 'Asset', cell: (row) => <span className="font-medium text-text-primary">{row.asset}</span> },
    { key: 'price', header: 'Price', numeric: true, cell: (row) => <span className="font-mono">${row.price.toLocaleString()}</span> },
    { key: 'change24h', header: '24h', numeric: true, cell: (row) => (
      <span className={row.change24h >= 0 ? 'text-positive' : 'text-negative'}>
        {row.change24h > 0 ? '+' : ''}{row.change24h.toFixed(1)}%
      </span>
    )},
    { key: 'sources', header: 'Sources', cell: (row) => (
      <span className={row.activeSources < row.totalSources ? 'text-warning' : 'text-text-secondary'}>
        {row.activeSources}/{row.totalSources}
      </span>
    )},
    { key: 'confidence', header: 'Confidence', numeric: true, cell: (row) => (
      <div className="flex items-center gap-2 justify-end">
        <div className="w-10 h-1.5 rounded-full bg-bg-hover overflow-hidden">
          <div className={`h-full rounded-full ${row.confidence > 0.95 ? 'bg-positive' : row.confidence > 0.9 ? 'bg-warning' : 'bg-negative'}`} style={{ width: `${row.confidence * 100}%` }} />
        </div>
        <span className="text-xs">{(row.confidence * 100).toFixed(0)}%</span>
      </div>
    )},
    { key: 'staleness', header: 'Staleness', numeric: true, cell: (row) => (
      <span className={row.staleness > 300 ? 'text-negative' : row.staleness > 60 ? 'text-warning' : 'text-positive'}>
        {row.staleness < 60 ? `${row.staleness}s` : row.staleness < 3600 ? `${Math.floor(row.staleness / 60)}m` : `${Math.floor(row.staleness / 3600)}h`}
      </span>
    )},
    { key: 'cbStatus', header: 'CB', cell: (row) => <AdminStatusBadge status={row.cbStatus} /> },
    { key: 'actions', header: '', cell: (row) => (
      <div className="flex gap-1">
        {row.cbStatus === 'tripped' && isAdmin && (
          <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); setResetAsset(row.asset); setResetDialogOpen(true); }}>
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}
      </div>
    )},
  ];

  const alertColumns: Column<Alert>[] = [
    { key: 'severity', header: '', width: '32px', cell: (row) => (
      <span className={`h-2 w-2 rounded-full inline-block ${row.severity === 'critical' ? 'bg-negative' : row.severity === 'warning' ? 'bg-warning' : 'bg-info'}`} />
    )},
    { key: 'asset', header: 'Asset', cell: (row) => row.asset },
    { key: 'type', header: 'Type', cell: (row) => <span className="font-mono text-xs">{row.type}</span> },
    { key: 'message', header: 'Message', cell: (row) => row.message },
    { key: 'timestamp', header: 'Time', cell: (row) => new Date(row.timestamp).toLocaleTimeString() },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Oracle Management"
        description="Monitor price feeds, circuit breakers, and oracle health"
        actions={
          <div className="flex items-center gap-2">
            <AdminStatusBadge status={healthStatus} size="md" />
            {isAdmin && (
              <Button variant="secondary" size="sm" onClick={() => setNavDialogOpen(true)}>
                <Upload className="h-3.5 w-3.5 mr-1" /> Manual NAV
              </Button>
            )}
          </div>
        }
      />

      {/* Price Feed Table */}
      <h3 className="text-sm font-semibold text-text-primary mb-3">Price Feeds</h3>
      <Table<OracleFeed>
        columns={feedColumns}
        data={MOCK_FEEDS}
        rowKey={(row) => row.asset}
        onRowClick={(row) => setSelectedAsset(row.asset)}
        compact
      />

      {/* Price Chart for selected asset */}
      {selectedAsset && (
        <div className="mt-6 rounded-md bg-bg-tertiary border border-border-default p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">{selectedAsset} Price History</h3>
            <button onClick={() => setSelectedAsset(null)} className="text-xs text-text-tertiary hover:text-text-primary">Close</button>
          </div>
          <AreaChart
            data={Array.from({ length: 24 }, (_, i) => ({
              date: `${i}:00`,
              value: (MOCK_FEEDS.find((f) => f.asset === selectedAsset)?.price ?? 100) * (0.98 + Math.random() * 0.04),
            }))}
            xKey="date" yKey="value" height={200}
          />
        </div>
      )}

      {/* Alert History */}
      <h3 className="text-sm font-semibold text-text-primary mt-6 mb-3">Alert History</h3>
      <Table<Alert> columns={alertColumns} data={MOCK_ALERTS} rowKey={(row) => String(row.id)} compact />

      {/* Reset CB Dialog */}
      <AdminConfirmDialog
        open={resetDialogOpen} onOpenChange={setResetDialogOpen}
        title={`Reset Circuit Breaker: ${resetAsset}`}
        description="This will reset the circuit breaker and allow price updates to resume. Enter a new base price if needed."
        confirmText="Reset Circuit Breaker" destructive
        onConfirm={() => setResetDialogOpen(false)}
      />

      {/* Manual NAV Dialog */}
      <Dialog open={navDialogOpen} onOpenChange={setNavDialogOpen}>
        <DialogContent size="sm">
          <DialogHeader><DialogTitle>Manual NAV Entry</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Asset</label>
              <select className="w-full h-9 px-3 rounded-md bg-surface-input border border-border-default text-sm">
                <option>T-BILL</option><option>TIFA-REC</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Price ($)</label>
              <Input type="number" step="0.01" placeholder="99.72" className="font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Valuation Date</label>
              <Input type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setNavDialogOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={() => setNavDialogOpen(false)}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
