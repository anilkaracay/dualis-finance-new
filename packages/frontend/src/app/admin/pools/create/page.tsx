'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const STEPS = ['Basic Info', 'Rate Model', 'Collateral', 'Caps', 'Review'];
const ASSET_OPTIONS = ['USDC', 'wBTC', 'wETH', 'ETH', 'CC', 'T-BILL', 'TIFA-REC', 'SPY'];
const RATE_PRESETS = {
  conservative: { baseRate: 0.02, multiplier: 0.05, jumpMultiplier: 0.15, kink: 0.85 },
  moderate: { baseRate: 0.03, multiplier: 0.08, jumpMultiplier: 0.30, kink: 0.80 },
  aggressive: { baseRate: 0.05, multiplier: 0.12, jumpMultiplier: 0.60, kink: 0.70 },
};

export default function PoolCreatePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    poolId: '',
    name: '',
    asset: 'USDC',
    baseRate: 0.02,
    multiplier: 0.07,
    jumpMultiplier: 0.30,
    kink: 0.80,
    maxLTV: 0.80,
    liquidationThreshold: 0.85,
    liquidationPenalty: 0.04,
    liquidationBonus: 0.02,
    supplyCap: 1_000_000_000,
    borrowCap: 500_000_000,
  });

  const update = (key: string, value: string | number) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div>
      <AdminPageHeader title="Create New Pool" description="Set up a new lending pool" />

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                i < step ? 'bg-positive text-white' : i === step ? 'bg-accent-teal text-white' : 'bg-bg-tertiary text-text-tertiary border border-border-default'
              }`}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={`text-xs font-medium ${i === step ? 'text-text-primary' : 'text-text-tertiary'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-border-default" />}
          </div>
        ))}
      </div>

      <Card className="p-6">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Pool ID (slug)</label>
              <Input value={form.poolId} onChange={(e) => update('poolId', e.target.value)} placeholder="usdc-main" className="font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Display Name</label>
              <Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="USDC Main Pool" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Underlying Asset</label>
              <select
                value={form.asset}
                onChange={(e) => update('asset', e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-surface-input border border-border-default text-sm text-text-primary"
              >
                {ASSET_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              {Object.entries(RATE_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => setForm((prev) => ({ ...prev, ...preset }))}
                  className="px-3 py-1.5 rounded-sm text-xs font-medium bg-bg-hover hover:bg-bg-active text-text-secondary capitalize transition-colors"
                >
                  {key}
                </button>
              ))}
            </div>
            {[
              { key: 'baseRate', label: 'Base Rate Per Year' },
              { key: 'multiplier', label: 'Multiplier Per Year' },
              { key: 'jumpMultiplier', label: 'Jump Multiplier Per Year' },
              { key: 'kink', label: 'Kink (Optimal Utilization)' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-text-secondary mb-1">{label}</label>
                <Input type="number" step="0.01" value={(form as any)[key]} onChange={(e) => update(key, parseFloat(e.target.value) || 0)} className="font-mono" />
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {[
              { key: 'maxLTV', label: 'Max LTV (0-1)' },
              { key: 'liquidationThreshold', label: 'Liquidation Threshold (0-1)' },
              { key: 'liquidationPenalty', label: 'Liquidation Penalty (0-1)' },
              { key: 'liquidationBonus', label: 'Liquidation Bonus (0-1)' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-text-secondary mb-1">{label}</label>
                <Input type="number" step="0.01" value={(form as any)[key]} onChange={(e) => update(key, parseFloat(e.target.value) || 0)} className="font-mono" />
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Supply Cap ($)</label>
              <Input type="number" value={form.supplyCap} onChange={(e) => update('supplyCap', parseFloat(e.target.value) || 0)} className="font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Borrow Cap ($)</label>
              <Input type="number" value={form.borrowCap} onChange={(e) => update('borrowCap', parseFloat(e.target.value) || 0)} className="font-mono" />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-text-primary mb-2">Review Pool Configuration</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <span className="text-text-tertiary">Pool ID:</span><span className="font-mono">{form.poolId || '—'}</span>
              <span className="text-text-tertiary">Name:</span><span>{form.name || '—'}</span>
              <span className="text-text-tertiary">Asset:</span><span>{form.asset}</span>
              <span className="text-text-tertiary">Base Rate:</span><span className="font-mono">{form.baseRate}</span>
              <span className="text-text-tertiary">Multiplier:</span><span className="font-mono">{form.multiplier}</span>
              <span className="text-text-tertiary">Jump Multiplier:</span><span className="font-mono">{form.jumpMultiplier}</span>
              <span className="text-text-tertiary">Kink:</span><span className="font-mono">{form.kink}</span>
              <span className="text-text-tertiary">Max LTV:</span><span className="font-mono">{form.maxLTV}</span>
              <span className="text-text-tertiary">Liq. Threshold:</span><span className="font-mono">{form.liquidationThreshold}</span>
              <span className="text-text-tertiary">Supply Cap:</span><span className="font-mono">${form.supplyCap.toLocaleString()}</span>
              <span className="text-text-tertiary">Borrow Cap:</span><span className="font-mono">${form.borrowCap.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-default">
          <Button variant="secondary" size="sm" onClick={() => step === 0 ? router.back() : setStep(step - 1)}>
            <ChevronLeft className="h-3.5 w-3.5 mr-1" /> {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button variant="primary" size="sm" onClick={() => setStep(step + 1)}>
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => router.push('/admin/pools')}>
              <Check className="h-3.5 w-3.5 mr-1" /> Create Pool
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
