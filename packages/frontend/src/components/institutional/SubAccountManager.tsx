'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import type { Column } from '@/components/ui/Table';
import { useInstitutionalStore } from '@/stores/useInstitutionalStore';
import {
  Users,
  Plus,
  X,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';

/* ─── Types ─── */

interface SubAccountRow {
  partyId: string;
  createdAt: string;
  isActive: boolean;
}

/* ─── Helpers ─── */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Generate a mock creation date based on partyId hash for deterministic display. */
function generateMockDate(partyId: string): string {
  let hash = 0;
  for (let i = 0; i < partyId.length; i++) {
    hash = (hash << 5) - hash + partyId.charCodeAt(i);
    hash |= 0;
  }
  // Place the date somewhere in 2025-2026
  const baseTime = new Date('2025-06-01').getTime();
  const offsetDays = Math.abs(hash % 365);
  const date = new Date(baseTime + offsetDays * 86_400_000);
  return date.toISOString();
}

function generatePartyId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 20);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `party::sub-${slug}-${suffix}`;
}

/* ─── Inline Add Form ─── */

function AddSubAccountForm({
  onSubmit,
  onCancel,
  isLoading,
}: {
  onSubmit: (name: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = useCallback(() => {
    if (!name.trim()) {
      setError('Sub-account name is required');
      return;
    }
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    setError('');
    onSubmit(name.trim());
  }, [name, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === 'Escape') {
        onCancel();
      }
    },
    [handleSubmit, onCancel]
  );

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-dashed border-accent-teal/30 bg-accent-teal/5">
      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-accent-teal/10 shrink-0 mt-0.5">
        <UserPlus className="h-4 w-4 text-accent-teal" />
      </div>
      <div className="flex-1 min-w-0">
        <div onKeyDown={handleKeyDown}>
          <Input
            label="Sub-Account Name"
            placeholder="e.g. Treasury Operations, Research Fund"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error}
          />
        </div>
        <p className="text-xs text-text-tertiary mt-1.5">
          A party ID will be auto-generated from the name.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0 mt-5">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          icon={<X className="h-3.5 w-3.5" />}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSubmit}
          loading={isLoading}
          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */

function SubAccountManager() {
  const { institution, isLoading, fetchInstitutionStatus } = useInstitutionalStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [localSubAccounts, setLocalSubAccounts] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!institution) {
      fetchInstitutionStatus();
    }
  }, [institution, fetchInstitutionStatus]);

  // Combine store sub-accounts with locally added ones
  const allSubAccounts = useMemo(() => {
    const storeAccounts = institution?.subAccounts ?? [];
    return [...storeAccounts, ...localSubAccounts];
  }, [institution?.subAccounts, localSubAccounts]);

  // Transform into table rows with mock dates
  const tableData: SubAccountRow[] = useMemo(
    () =>
      allSubAccounts.map((partyId) => ({
        partyId,
        createdAt: generateMockDate(partyId),
        isActive: true,
      })),
    [allSubAccounts]
  );

  const handleAddSubAccount = useCallback(async (name: string) => {
    setIsAdding(true);
    // Simulate async creation
    await new Promise((resolve) => setTimeout(resolve, 800));
    const partyId = generatePartyId(name);
    setLocalSubAccounts((prev) => [...prev, partyId]);
    setIsAdding(false);
    setShowAddForm(false);
  }, []);

  const columns: Column<SubAccountRow>[] = useMemo(
    () => [
      {
        key: 'partyId',
        header: 'Party ID',
        cell: (row) => (
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-accent-indigo/10 shrink-0">
              <Users className="h-3.5 w-3.5 text-accent-indigo" />
            </div>
            <span className="text-sm font-mono-nums text-text-primary truncate">
              {row.partyId}
            </span>
          </div>
        ),
      },
      {
        key: 'createdAt',
        header: 'Created',
        width: '140px',
        cell: (row) => (
          <span className="text-xs text-text-secondary">{formatDate(row.createdAt)}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: '100px',
        cell: (row) => (
          <Badge variant={row.isActive ? 'success' : 'danger'} size="sm">
            {row.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
    ],
    []
  );

  return (
    <Card padding="lg">
      <CardHeader>
        <CardTitle>
          <Users className="h-4 w-4 text-accent-indigo inline mr-2" />
          Sub-Account Management
        </CardTitle>
        {!showAddForm && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddForm(true)}
            icon={<Plus className="h-3.5 w-3.5" />}
          >
            Add Sub-Account
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {/* Inline Add Form */}
        {showAddForm && (
          <div className="mb-4">
            <AddSubAccountForm
              onSubmit={handleAddSubAccount}
              onCancel={() => setShowAddForm(false)}
              isLoading={isAdding}
            />
          </div>
        )}

        {/* Sub-Account Count */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-text-tertiary">
            {allSubAccounts.length} sub-account{allSubAccounts.length !== 1 ? 's' : ''} configured
          </span>
          {allSubAccounts.length > 0 && (
            <Badge variant="success" size="sm">
              {allSubAccounts.length} Active
            </Badge>
          )}
        </div>

        {/* Table */}
        <Table<SubAccountRow>
          columns={columns}
          data={tableData}
          rowKey={(row) => row.partyId}
          loading={isLoading && tableData.length === 0}
          loadingRows={3}
          emptyState={
            <div className="flex flex-col items-center gap-2 py-6">
              <Users className="h-8 w-8 text-text-tertiary" />
              <p className="text-sm text-text-tertiary">No sub-accounts created yet</p>
              <p className="text-xs text-text-tertiary">
                Sub-accounts allow you to segregate positions and manage access.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddForm(true)}
                icon={<Plus className="h-3.5 w-3.5" />}
                className="mt-2"
              >
                Create First Sub-Account
              </Button>
            </div>
          }
        />
      </CardContent>
    </Card>
  );
}

export { SubAccountManager };
