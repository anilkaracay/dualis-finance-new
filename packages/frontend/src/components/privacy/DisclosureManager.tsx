'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Table, type Column } from '@/components/ui/Table';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Plus, Trash2 } from 'lucide-react';
import type { DisclosureRule, DataScope } from '@dualis/shared';

interface DisclosureManagerProps {
  /** Current disclosure rules */
  rules: DisclosureRule[];
  /** Callback to add a new disclosure rule */
  onAdd: (rule: {
    discloseTo: string;
    displayName: string;
    dataScope: DataScope;
    purpose: string;
    expiresAt: string | null;
  }) => void;
  /** Callback to remove a disclosure rule by ID */
  onRemove: (ruleId: string) => void;
  /** Show loading state */
  loading?: boolean;
}

const DATA_SCOPE_OPTIONS: { value: DataScope; label: string }[] = [
  { value: 'Positions', label: 'Positions' },
  { value: 'Transactions', label: 'Transactions' },
  { value: 'CreditScore', label: 'Credit Score' },
  { value: 'SecLendingDeals', label: 'Sec Lending Deals' },
  { value: 'All', label: 'All' },
];

const SCOPE_BADGE_VARIANT: Record<DataScope, 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
  Positions: 'info',
  Transactions: 'default',
  CreditScore: 'warning',
  SecLendingDeals: 'success',
  All: 'danger',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function DisclosureManager({ rules, onAdd, onRemove, loading = false }: DisclosureManagerProps) {
  const [open, setOpen] = useState(false);
  const [partyId, setPartyId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [dataScope, setDataScope] = useState<DataScope>('Positions');
  const [purpose, setPurpose] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const resetForm = () => {
    setPartyId('');
    setDisplayName('');
    setDataScope('Positions');
    setPurpose('');
    setExpiresAt('');
  };

  const handleSubmit = () => {
    if (!partyId.trim() || !displayName.trim() || !purpose.trim()) return;

    onAdd({
      discloseTo: partyId.trim(),
      displayName: displayName.trim(),
      dataScope,
      purpose: purpose.trim(),
      expiresAt: expiresAt || null,
    });

    resetForm();
    setOpen(false);
  };

  const handleRemove = (ruleId: string, ruleName: string) => {
    const confirmed = window.confirm(
      `"${ruleName}" kuralını silmek istediğinize emin misiniz?`
    );
    if (confirmed) {
      onRemove(ruleId);
    }
  };

  const columns: Column<DisclosureRule>[] = [
    {
      key: 'displayName',
      header: 'Ad',
      cell: (row) => (
        <span className="text-sm font-medium text-text-primary">{row.displayName}</span>
      ),
    },
    {
      key: 'discloseTo',
      header: 'Taraf',
      cell: (row) => (
        <span className="text-sm text-text-secondary font-mono text-xs">{row.discloseTo}</span>
      ),
    },
    {
      key: 'dataScope',
      header: 'Kapsam',
      cell: (row) => (
        <Badge variant={SCOPE_BADGE_VARIANT[row.dataScope]} size="sm">
          {row.dataScope}
        </Badge>
      ),
    },
    {
      key: 'purpose',
      header: 'Amaç',
      cell: (row) => (
        <span className="text-sm text-text-secondary truncate max-w-[200px] block">
          {row.purpose}
        </span>
      ),
    },
    {
      key: 'expiresAt',
      header: 'Bitiş',
      cell: (row) => (
        <span className="text-xs text-text-tertiary">{formatDate(row.expiresAt)}</span>
      ),
    },
    {
      key: 'isActive',
      header: 'Durum',
      cell: (row) => (
        <Badge variant={row.isActive ? 'success' : 'default'} size="sm">
          {row.isActive ? 'Aktif' : 'Pasif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '48px',
      cell: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRemove(row.id, row.displayName);
          }}
          className="p-1.5 rounded-md text-text-tertiary hover:text-negative hover:bg-negative/10 transition-colors"
          aria-label={`Delete ${row.displayName}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  const isFormValid = partyId.trim() && displayName.trim() && purpose.trim();

  return (
    <div className="flex flex-col gap-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-text-primary">Disclosure Kuralları</h3>
          <span className="text-xs text-text-tertiary">({rules.length})</span>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
            >
              Add Disclosure
            </Button>
          </DialogTrigger>

          <DialogContent size="md">
            <DialogHeader>
              <DialogTitle>Yeni Disclosure Kuralı</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <Input
                label="Taraf ID (Party ID)"
                placeholder="Örn: party-abc-123"
                value={partyId}
                onChange={(e) => setPartyId(e.target.value)}
              />

              <Input
                label="Görünen Ad"
                placeholder="Örn: SEC Reporting"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary text-label">
                  Veri Kapsamı (Data Scope)
                </label>
                <select
                  value={dataScope}
                  onChange={(e) => setDataScope(e.target.value as DataScope)}
                  className={cn(
                    'h-9 w-full rounded-md bg-bg-tertiary border border-border-default text-sm text-text-primary',
                    'px-3 transition-colors duration-100 focus-ring focus:border-border-focus',
                  )}
                >
                  {DATA_SCOPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Amaç"
                placeholder="Örn: Regulatory compliance"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />

              <Input
                label="Bitiş Tarihi (Opsiyonel)"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  resetForm();
                  setOpen(false);
                }}
              >
                İptal
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!isFormValid}
                onClick={handleSubmit}
              >
                Ekle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rules Table */}
      <Table
        columns={columns}
        data={rules}
        rowKey={(row) => row.id}
        loading={loading}
        loadingRows={3}
        compact
        emptyState={
          <p className="text-sm text-text-tertiary">Henüz disclosure kuralı bulunmuyor.</p>
        }
      />
    </div>
  );
}

export { DisclosureManager, type DisclosureManagerProps };
