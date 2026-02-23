'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { formatCurrency } from '@dualis/shared';
import { KPICard } from '@/components/data-display/KPICard';
import { Table, type Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useQuery } from '@/hooks/api/useQuery';
import { Ban, UserCheck, UserCog } from 'lucide-react';

const MOCK_USER = {
  id: 1, userId: 'usr-001', email: 'alice@acme.com', displayName: 'Alice Johnson', role: 'institutional' as const,
  accountStatus: 'active' as const, kycStatus: 'approved', isAdminActive: false,
  totalSupplied: 500_000, totalBorrowed: 100_000, createdAt: '2024-06-01', lastLoginAt: '2025-02-20',
  institution: { companyName: 'Acme Corp', jurisdiction: 'US-DE', kybStatus: 'approved' },
};

const MOCK_POSITIONS = [
  { id: 'p1', pool: 'USDC Main Pool', type: 'supply', amount: 500_000, valueUSD: 500_000, apy: 0.032, healthFactor: null, duration: '180d' },
  { id: 'p2', pool: 'wBTC Pool', type: 'borrow', amount: 100_000, valueUSD: 100_000, apy: 0.028, healthFactor: 1.65, duration: '45d' },
];

const MOCK_TRANSACTIONS = [
  { id: 't1', type: 'supply', pool: 'USDC Main Pool', amount: 500_000, timestamp: '2024-12-01T10:00:00Z' },
  { id: 't2', type: 'borrow', pool: 'wBTC Pool', amount: 100_000, timestamp: '2024-12-15T14:00:00Z' },
  { id: 't3', type: 'repay', pool: 'wBTC Pool', amount: 20_000, timestamp: '2025-01-10T09:00:00Z' },
];

const MOCK_DOCUMENTS = [
  { id: 'd1', type: 'Certificate of Incorporation', fileName: 'cert_inc.pdf', status: 'verified' as const, uploadedAt: '2024-06-01', expiresAt: '2026-06-01' },
  { id: 'd2', type: 'Board Resolution', fileName: 'board_res.pdf', status: 'verified' as const, uploadedAt: '2024-06-01', expiresAt: '2026-06-01' },
  { id: 'd3', type: 'Tax Certificate', fileName: 'tax_cert.pdf', status: 'pending' as const, uploadedAt: '2025-02-10', expiresAt: null },
];

interface Pos { id: string; pool: string; type: string; amount: number; valueUSD: number; apy: number; healthFactor: number | null; duration: string }
interface Tx { id: string; type: string; pool: string; amount: number; timestamp: string }
interface Doc { id: string; type: string; fileName: string; status: 'verified' | 'pending' | 'rejected'; uploadedAt: string; expiresAt: string | null }

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.userId as string;
  const { isAdmin, canManageCompliance } = useAdminRole();

  const { data: userData, isLoading } = useQuery(`/admin/users/${userId}`, {
    fallbackData: { data: { ...MOCK_USER, userId } },
  });
  const user = (userData as any)?.data ?? { ...MOCK_USER, userId };

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [blacklistOpen, setBlacklistOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [_selectedRole, _setSelectedRole] = useState(user.role);

  const posColumns: Column<Pos>[] = [
    { key: 'pool', header: 'Pool', cell: (row) => <span className="text-text-primary">{row.pool}</span> },
    { key: 'type', header: 'Type', cell: (row) => <AdminStatusBadge status={row.type === 'supply' ? 'active' : 'pending'} /> },
    { key: 'amount', header: 'Amount', numeric: true, cell: (row) => formatCurrency(row.amount, { compact: true }) },
    { key: 'apy', header: 'APY', numeric: true, cell: (row) => `${(row.apy * 100).toFixed(2)}%` },
    { key: 'healthFactor', header: 'HF', numeric: true, cell: (row) =>
      row.healthFactor != null ? (
        <span className={row.healthFactor < 1.2 ? 'text-negative' : row.healthFactor < 1.5 ? 'text-warning' : 'text-positive'}>{row.healthFactor.toFixed(2)}</span>
      ) : <span className="text-text-tertiary">—</span>
    },
    { key: 'duration', header: 'Duration', cell: (row) => row.duration },
  ];

  const txColumns: Column<Tx>[] = [
    { key: 'type', header: 'Type', cell: (row) => <span className="capitalize text-text-primary">{row.type}</span> },
    { key: 'pool', header: 'Pool', cell: (row) => row.pool },
    { key: 'amount', header: 'Amount', numeric: true, cell: (row) => formatCurrency(row.amount, { compact: true }) },
    { key: 'timestamp', header: 'Time', cell: (row) => new Date(row.timestamp).toLocaleString() },
  ];

  const docColumns: Column<Doc>[] = [
    { key: 'type', header: 'Document Type', cell: (row) => <span className="text-text-primary">{row.type}</span> },
    { key: 'fileName', header: 'File', cell: (row) => <span className="font-mono text-xs">{row.fileName}</span> },
    { key: 'status', header: 'Status', cell: (row) => <AdminStatusBadge status={row.status === 'verified' ? 'approved' : row.status === 'rejected' ? 'rejected' : 'pending'} /> },
    { key: 'uploadedAt', header: 'Uploaded', cell: (row) => row.uploadedAt },
    { key: 'actions', header: 'Actions', cell: (row) =>
      row.status === 'pending' && canManageCompliance ? (
        <div className="flex gap-1">
          <Button variant="success" size="sm">Approve</Button>
          <Button variant="danger" size="sm">Reject</Button>
        </div>
      ) : null
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title={user.displayName ?? userId}
        description={`${user.email} · ${user.role?.replace('_', ' ')} · Registered ${user.createdAt}`}
        actions={
          <div className="flex items-center gap-2">
            <AdminStatusBadge status={user.accountStatus} size="md" />
            {isAdmin && user.accountStatus === 'active' && (
              <Button variant="danger" size="sm" onClick={() => setSuspendOpen(true)}>
                <Ban className="h-3.5 w-3.5 mr-1" /> Suspend
              </Button>
            )}
            {isAdmin && user.accountStatus === 'suspended' && (
              <Button variant="success" size="sm" onClick={() => {}}>
                <UserCheck className="h-3.5 w-3.5 mr-1" /> Unsuspend
              </Button>
            )}
            {isAdmin && (
              <Button variant="secondary" size="sm" onClick={() => setRoleOpen(true)}>
                <UserCog className="h-3.5 w-3.5 mr-1" /> Change Role
              </Button>
            )}
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KPICard label="Total Supplied" value={user.totalSupplied ?? 0} prefix="$" decimals={0} size="sm" loading={isLoading} />
        <KPICard label="Total Borrowed" value={user.totalBorrowed ?? 0} prefix="$" decimals={0} size="sm" loading={isLoading} />
        <KPICard label="KYC Status" value={user.kycStatus ?? 'N/A'} size="sm" loading={isLoading} />
        <KPICard label="Last Login" value={user.lastLoginAt ?? 'Never'} size="sm" loading={isLoading} />
      </div>

      <Tabs defaultValue="positions">
        <TabsList>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          {canManageCompliance && <TabsTrigger value="documents">KYB Documents</TabsTrigger>}
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="mt-4">
          <Table<Pos> columns={posColumns} data={MOCK_POSITIONS} rowKey={(row) => row.id} compact />
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <Table<Tx> columns={txColumns} data={MOCK_TRANSACTIONS} rowKey={(row) => row.id} compact />
        </TabsContent>

        {canManageCompliance && (
          <TabsContent value="documents" className="mt-4">
            <Table<Doc> columns={docColumns} data={MOCK_DOCUMENTS} rowKey={(row) => row.id} compact />
          </TabsContent>
        )}

        <TabsContent value="activity" className="mt-4">
          <div className="text-sm text-text-tertiary py-8 text-center">Activity log will be populated from audit data.</div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AdminConfirmDialog
        open={suspendOpen} onOpenChange={setSuspendOpen}
        title="Suspend User" description={`Suspend ${user.displayName ?? userId}? They will not be able to login or perform transactions.`}
        confirmText="Suspend" destructive onConfirm={() => setSuspendOpen(false)}
      />
      <AdminConfirmDialog
        open={blacklistOpen} onOpenChange={setBlacklistOpen}
        title="Blacklist User" description={`Permanently blacklist ${user.displayName ?? userId}? This action is hard to reverse.`}
        confirmText="Blacklist" destructive typeToConfirm={userId} onConfirm={() => setBlacklistOpen(false)}
      />
      <AdminConfirmDialog
        open={roleOpen} onOpenChange={setRoleOpen}
        title="Change User Role" description={`Change role for ${user.displayName ?? userId}. Current role: ${user.role}`}
        confirmText="Change Role" onConfirm={() => setRoleOpen(false)}
      />
    </div>
  );
}
