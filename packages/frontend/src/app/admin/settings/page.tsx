'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Save, Pause, Play, AlertTriangle } from 'lucide-react';

export default function AdminSettingsPage() {
  const { isAdmin } = useAdminRole();

  const [config, setConfig] = useState({
    protocolFeeRate: 0.001,
    liquidationIncentiveRate: 0.05,
    flashLoanFeeRate: 0.0009,
    minBorrowAmount: 100,
    maxBorrowAmount: 10_000_000,
  });

  const [flags, setFlags] = useState({
    flashLoans: true,
    secLending: true,
    governance: true,
    selfCustody: false,
  });

  const [isPaused, setIsPaused] = useState(false);
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  const health: { api: string; database: string; redis: string; canton: string; oracleFeeds: number; version: string } = {
    api: 'up',
    database: 'up',
    redis: 'up',
    canton: 'down',
    oracleFeeds: 6,
    version: '1.0.0',
  };

  return (
    <div>
      <AdminPageHeader title="System Settings" description="Protocol configuration, feature flags, and system health" />

      {/* Protocol Pause Banner */}
      {isPaused && (
        <div className="mb-6 p-4 rounded-md bg-negative/10 border border-negative/20 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-negative shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-negative">Protocol is PAUSED</p>
            <p className="text-xs text-negative/80">All operations are suspended. Resume to re-enable.</p>
          </div>
          {isAdmin && (
            <Button variant="success" size="sm" onClick={() => setResumeDialogOpen(true)}>
              <Play className="h-3.5 w-3.5 mr-1" /> Resume Protocol
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Protocol Configuration */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Protocol Configuration</h3>
          <div className="space-y-3">
            {[
              { key: 'protocolFeeRate', label: 'Protocol Fee Rate', step: '0.0001' },
              { key: 'liquidationIncentiveRate', label: 'Liquidation Incentive Rate', step: '0.01' },
              { key: 'flashLoanFeeRate', label: 'Flash Loan Fee Rate', step: '0.0001' },
              { key: 'minBorrowAmount', label: 'Min Borrow Amount ($)', step: '1' },
              { key: 'maxBorrowAmount', label: 'Max Borrow Amount ($)', step: '1000' },
            ].map(({ key, label, step }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-text-secondary mb-1">{label}</label>
                <Input
                  type="number"
                  step={step}
                  value={(config as any)[key]}
                  onChange={(e) => setConfig((prev) => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                  disabled={!isAdmin}
                  className="font-mono"
                />
              </div>
            ))}
            {isAdmin && (
              <Button variant="primary" size="sm" onClick={() => setSaveDialogOpen(true)} className="mt-2">
                <Save className="h-3.5 w-3.5 mr-1" /> Save Configuration
              </Button>
            )}
          </div>
        </Card>

        {/* Feature Flags */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Feature Flags</h3>
          <div className="space-y-4">
            {[
              { key: 'flashLoans', label: 'Flash Loans', desc: 'Enable flash loan functionality' },
              { key: 'secLending', label: 'Securities Lending', desc: 'Enable securities lending marketplace' },
              { key: 'governance', label: 'Governance', desc: 'Enable governance voting and proposals' },
              { key: 'selfCustody', label: 'Self-Custody (Tier 2)', desc: 'Enable self-custody wallet mode' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">{label}</p>
                  <p className="text-xs text-text-tertiary">{desc}</p>
                </div>
                <Toggle
                  pressed={(flags as any)[key]}
                  onPressedChange={(pressed) => setFlags((prev) => ({ ...prev, [key]: pressed }))}
                  disabled={!isAdmin}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Canton Configuration */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Canton Configuration</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-text-tertiary">Environment</span><span className="font-mono">sandbox</span></div>
            <div className="flex justify-between"><span className="text-text-tertiary">Operator Party</span><span className="font-mono text-xs">party::operator::0</span></div>
            <div className="flex justify-between"><span className="text-text-tertiary">Oracle Party</span><span className="font-mono text-xs">party::oracle::0</span></div>
            <div className="flex justify-between"><span className="text-text-tertiary">JSON API URL</span><span className="font-mono text-xs">localhost:7575</span></div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">Connection</span>
              <AdminStatusBadge status={health.canton === 'up' ? 'active' : 'critical'} />
            </div>
          </div>
        </Card>

        {/* System Health */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">System Health</h3>
          <div className="space-y-2 text-sm">
            {[
              { label: 'API Server', status: health.api },
              { label: 'Database', status: health.database },
              { label: 'Redis', status: health.redis },
              { label: 'Canton', status: health.canton },
            ].map(({ label, status }) => (
              <div key={label} className="flex justify-between">
                <span className="text-text-tertiary">{label}</span>
                <AdminStatusBadge status={status === 'up' ? 'active' : 'critical'} />
              </div>
            ))}
            <div className="flex justify-between"><span className="text-text-tertiary">Oracle Feeds</span><span>{health.oracleFeeds} active</span></div>
            <div className="flex justify-between"><span className="text-text-tertiary">Version</span><span className="font-mono">{health.version}</span></div>
          </div>
        </Card>
      </div>

      {/* Emergency Controls */}
      {isAdmin && (
        <div className="mt-6 rounded-md border border-negative/20 bg-negative/5 p-5">
          <h3 className="text-sm font-semibold text-negative mb-2">Emergency Controls</h3>
          <p className="text-xs text-text-secondary mb-4">These actions affect the entire protocol. Use with extreme caution.</p>
          <div className="flex gap-2">
            {!isPaused ? (
              <Button variant="danger" size="sm" onClick={() => setPauseDialogOpen(true)}>
                <Pause className="h-3.5 w-3.5 mr-1" /> PAUSE PROTOCOL
              </Button>
            ) : (
              <Button variant="success" size="sm" onClick={() => setResumeDialogOpen(true)}>
                <Play className="h-3.5 w-3.5 mr-1" /> RESUME PROTOCOL
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AdminConfirmDialog
        open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}
        title="PAUSE PROTOCOL" description="This will immediately stop ALL protocol operations — no new supplies, borrows, or trades. Existing positions remain but cannot be modified."
        confirmText="PAUSE PROTOCOL" destructive typeToConfirm="PAUSE"
        onConfirm={() => { setIsPaused(true); setPauseDialogOpen(false); }}
      />
      <AdminConfirmDialog
        open={resumeDialogOpen} onOpenChange={setResumeDialogOpen}
        title="Resume Protocol" description="This will re-enable all protocol operations."
        confirmText="Resume" onConfirm={() => { setIsPaused(false); setResumeDialogOpen(false); }}
      />
      <AdminConfirmDialog
        open={saveDialogOpen} onOpenChange={setSaveDialogOpen}
        title="Save Configuration" description="Updated protocol configuration will take effect immediately."
        confirmText="Save" onConfirm={() => setSaveDialogOpen(false)}
      />
    </div>
  );
}
