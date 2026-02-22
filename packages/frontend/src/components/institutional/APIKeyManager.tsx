'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import type { Column } from '@/components/ui/Table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { useInstitutionalStore } from '@/stores/useInstitutionalStore';
import type { InstitutionalAPIKey } from '@dualis/shared';
import {
  Key,
  Plus,
  Copy,
  Check,
  AlertTriangle,
  Shield,
  Clock,
  XCircle,
} from 'lucide-react';

/* ─── Types ─── */

interface CreateKeyForm {
  name: string;
  permissions: Set<string>;
}

interface CreateKeyFormErrors {
  name?: string;
  permissions?: string;
}

/* ─── Constants ─── */

const AVAILABLE_PERMISSIONS = [
  { value: 'read', label: 'Read', description: 'Read account data, balances, and positions' },
  { value: 'write', label: 'Write', description: 'Execute deposits, withdrawals, and borrows' },
  { value: 'bulk', label: 'Bulk', description: 'Execute bulk operations across pools' },
  { value: 'admin', label: 'Admin', description: 'Manage sub-accounts and API keys' },
] as const;

const permissionVariantMap: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  read: 'info',
  write: 'success',
  bulk: 'warning',
  admin: 'danger',
};

/* ─── Helpers ─── */

function formatDate(iso: string | null): string {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return 'Never';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(iso);
}

function generateMockFullKey(prefix: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  for (let i = 0; i < 40; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}_${suffix}`;
}

/* ─── Create Key Modal ─── */

function CreateKeyDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, permissions: string[]) => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<CreateKeyForm>({
    name: '',
    permissions: new Set(),
  });
  const [errors, setErrors] = useState<CreateKeyFormErrors>({});

  const handleTogglePermission = useCallback((perm: string) => {
    setForm((prev) => {
      const next = new Set(prev.permissions);
      if (next.has(perm)) {
        next.delete(perm);
      } else {
        next.add(perm);
      }
      return { ...prev, permissions: next };
    });
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: CreateKeyFormErrors = {};
    if (!form.name.trim()) newErrors.name = 'Key name is required';
    if (form.permissions.size === 0) newErrors.permissions = 'Select at least one permission';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;
    onSubmit(form.name.trim(), Array.from(form.permissions));
  }, [form, validate, onSubmit]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setForm({ name: '', permissions: new Set() });
      setErrors({});
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Create New API Key</DialogTitle>
          <DialogDescription>
            Configure the name and permissions for your new API key. The full key will be shown
            only once after creation.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 my-4">
          <Input
            label="Key Name"
            placeholder="e.g. Production API, Reporting Key"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            error={errors.name}
          />

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-secondary">Permissions</label>
            <div className="flex flex-col gap-2">
              {AVAILABLE_PERMISSIONS.map((perm) => (
                <label
                  key={perm.value}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-all duration-200',
                    form.permissions.has(perm.value)
                      ? 'border-accent-teal/40 bg-accent-teal/5'
                      : 'border-border-default hover:border-border-hover hover:bg-bg-hover/50'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={form.permissions.has(perm.value)}
                    onChange={() => handleTogglePermission(perm.value)}
                    className="mt-0.5 accent-accent-teal"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">{perm.label}</span>
                      <Badge variant={permissionVariantMap[perm.value] ?? 'default'} size="sm">
                        {perm.value}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-tertiary mt-0.5">{perm.description}</p>
                  </div>
                </label>
              ))}
            </div>
            {errors.permissions && (
              <p className="text-xs text-negative">{errors.permissions}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="md" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            loading={isLoading}
            icon={<Key className="h-4 w-4" />}
          >
            Create Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Key Reveal Dialog ─── */

function KeyRevealDialog({
  open,
  onOpenChange,
  fullKey,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fullKey: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: create a textarea for copying
      const textarea = document.createElement('textarea');
      textarea.value = fullKey;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [fullKey]);

  useEffect(() => {
    if (open) setCopied(false);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>API Key Created</DialogTitle>
          <DialogDescription>
            Copy your API key now. This is the only time it will be displayed.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4">
          {/* Warning */}
          <div className="flex items-start gap-2 p-3 rounded-md bg-warning/5 border border-warning/20 mb-4">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-warning">
              This API key will not be shown again. Please copy and store it securely. If lost,
              you will need to create a new key.
            </p>
          </div>

          {/* Key Display */}
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 rounded-md bg-bg-primary border border-border-default font-mono text-xs text-text-primary break-all select-all">
              {fullKey}
            </div>
            <Button
              variant={copied ? 'success' : 'secondary'}
              size="md"
              onClick={handleCopy}
              icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="primary" size="md" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Revoke Confirmation Dialog ─── */

function RevokeDialog({
  open,
  onOpenChange,
  keyName,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyName: string;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Revoke API Key</DialogTitle>
          <DialogDescription>
            Are you sure you want to revoke &quot;{keyName}&quot;? This action cannot be undone.
            Any systems using this key will immediately lose access.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 p-3 rounded-md bg-negative/5 border border-negative/20 my-4">
          <XCircle className="h-4 w-4 text-negative shrink-0 mt-0.5" />
          <p className="text-xs text-negative">
            Revoking this key is permanent. All requests authenticated with this key will be rejected.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="md" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={onConfirm}
            loading={isLoading}
          >
            Revoke Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main Component ─── */

function APIKeyManager() {
  const { apiKeys, isLoading, createAPIKey, revokeAPIKey, fetchInstitutionStatus, institution } = useInstitutionalStore();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [revealDialogOpen, setRevealDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [revealedKey, setRevealedKey] = useState('');
  const [revokeTarget, setRevokeTarget] = useState<InstitutionalAPIKey | null>(null);

  useEffect(() => {
    if (!institution) {
      fetchInstitutionStatus();
    }
  }, [institution, fetchInstitutionStatus]);

  const handleCreateKey = useCallback(
    async (name: string, permissions: string[]) => {
      await createAPIKey(name, permissions);

      // Generate a mock full key for display
      const prefix = `dsk_${Math.random().toString(36).slice(2, 10)}`;
      const fullKey = generateMockFullKey(prefix);

      setCreateDialogOpen(false);
      setRevealedKey(fullKey);
      setRevealDialogOpen(true);
    },
    [createAPIKey]
  );

  const handleRevokeClick = useCallback((key: InstitutionalAPIKey) => {
    setRevokeTarget(key);
    setRevokeDialogOpen(true);
  }, []);

  const handleRevokeConfirm = useCallback(async () => {
    if (!revokeTarget) return;
    await revokeAPIKey(revokeTarget.id);
    setRevokeDialogOpen(false);
    setRevokeTarget(null);
  }, [revokeTarget, revokeAPIKey]);

  const columns: Column<InstitutionalAPIKey>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        width: '160px',
        cell: (row) => (
          <div className="flex items-center gap-2">
            <Key className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
            <span className="text-sm font-medium text-text-primary truncate">{row.name}</span>
          </div>
        ),
      },
      {
        key: 'keyPrefix',
        header: 'Key',
        width: '140px',
        cell: (row) => (
          <span className="text-sm font-mono-nums text-text-secondary">
            {row.keyPrefix}****
          </span>
        ),
      },
      {
        key: 'permissions',
        header: 'Permissions',
        cell: (row) => (
          <div className="flex flex-wrap gap-1">
            {row.permissions.map((perm) => (
              <Badge key={perm} variant={permissionVariantMap[perm] ?? 'default'} size="sm">
                {perm}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: '100px',
        cell: (row) => (
          <Badge variant={row.isActive ? 'success' : 'danger'} size="sm">
            {row.isActive ? 'Active' : 'Revoked'}
          </Badge>
        ),
      },
      {
        key: 'lastUsed',
        header: 'Last Used',
        width: '120px',
        cell: (row) => (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-text-tertiary" />
            <span className="text-xs text-text-secondary">
              {formatRelativeTime(row.lastUsedAt)}
            </span>
          </div>
        ),
      },
      {
        key: 'created',
        header: 'Created',
        width: '120px',
        cell: (row) => (
          <span className="text-xs text-text-secondary">{formatDate(row.createdAt)}</span>
        ),
      },
      {
        key: 'actions',
        header: '',
        width: '100px',
        cell: (row) =>
          row.isActive ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRevokeClick(row);
              }}
              className="text-negative hover:text-negative"
            >
              Revoke
            </Button>
          ) : (
            <span className="text-xs text-text-tertiary">Revoked</span>
          ),
      },
    ],
    [handleRevokeClick]
  );

  return (
    <Card padding="lg">
      <CardHeader>
        <CardTitle>
          <Shield className="h-4 w-4 text-accent-teal inline mr-2" />
          API Key Management
        </CardTitle>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setCreateDialogOpen(true)}
          icon={<Plus className="h-3.5 w-3.5" />}
        >
          Create New Key
        </Button>
      </CardHeader>

      <CardContent>
        <Table<InstitutionalAPIKey>
          columns={columns}
          data={apiKeys}
          rowKey={(row) => row.id}
          loading={isLoading && apiKeys.length === 0}
          loadingRows={3}
          compact
          emptyState={
            <div className="flex flex-col items-center gap-2 py-4">
              <Key className="h-8 w-8 text-text-tertiary" />
              <p className="text-sm text-text-tertiary">No API keys created yet</p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCreateDialogOpen(true)}
                icon={<Plus className="h-3.5 w-3.5" />}
              >
                Create Your First Key
              </Button>
            </div>
          }
        />
      </CardContent>

      {/* Create Key Dialog */}
      <CreateKeyDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateKey}
        isLoading={isLoading}
      />

      {/* Key Reveal Dialog */}
      <KeyRevealDialog
        open={revealDialogOpen}
        onOpenChange={setRevealDialogOpen}
        fullKey={revealedKey}
      />

      {/* Revoke Confirmation Dialog */}
      <RevokeDialog
        open={revokeDialogOpen}
        onOpenChange={setRevokeDialogOpen}
        keyName={revokeTarget?.name ?? ''}
        onConfirm={handleRevokeConfirm}
        isLoading={isLoading}
      />
    </Card>
  );
}

export { APIKeyManager };
