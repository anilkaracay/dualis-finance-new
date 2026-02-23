'use client';

import { useState } from 'react';
import { Table, type Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminFilterBar } from '@/components/admin/AdminFilterBar';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { useQuery } from '@/hooks/api/useQuery';
import { Download } from 'lucide-react';
import type { AdminAuditLog } from '@dualis/shared';

const MOCK_LOGS: AdminAuditLog[] = [
  { id: 1, userId: 6, adminName: 'Admin User', adminEmail: 'admin@dualis.finance', action: 'pool.pause', targetType: 'pool', targetId: 'cc-main', oldValue: { status: 'active' }, newValue: { status: 'paused' }, ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0', createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: 2, userId: 7, adminName: 'Compliance Officer', adminEmail: 'compliance@dualis.finance', action: 'user.approve_kyb', targetType: 'user', targetId: 'usr-001', oldValue: { kybStatus: 'pending' }, newValue: { kybStatus: 'approved' }, ipAddress: '192.168.1.2', userAgent: 'Mozilla/5.0', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, userId: 6, adminName: 'Admin User', adminEmail: 'admin@dualis.finance', action: 'oracle.reset_cb', targetType: 'oracle', targetId: 'TIFA-REC', oldValue: { cbStatus: 'tripped' }, newValue: { cbStatus: 'ok' }, ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0', createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 4, userId: 6, adminName: 'Admin User', adminEmail: 'admin@dualis.finance', action: 'config.update', targetType: 'config', targetId: '1', oldValue: { protocolFeeRate: 0.001 }, newValue: { protocolFeeRate: 0.0012 }, ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0', createdAt: new Date(Date.now() - 14400000).toISOString() },
  { id: 5, userId: 6, adminName: 'Admin User', adminEmail: 'admin@dualis.finance', action: 'user.change_role', targetType: 'user', targetId: 'usr-007', oldValue: { role: 'viewer' }, newValue: { role: 'compliance_officer' }, ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0', createdAt: new Date(Date.now() - 28800000).toISOString() },
  { id: 6, userId: 6, adminName: 'Admin User', adminEmail: 'admin@dualis.finance', action: 'pool.create', targetType: 'pool', targetId: 'spy-main', oldValue: null, newValue: { poolId: 'spy-main', asset: 'SPY' }, ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0', createdAt: new Date(Date.now() - 86400000).toISOString() },
];

export default function AdminAuditPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [_adminFilter, _setAdminFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const queryUrl = `/admin/audit/logs?page=${page}&limit=50${actionFilter ? `&action=${actionFilter}` : ''}${search ? `&search=${search}` : ''}${dateFrom ? `&from=${dateFrom}` : ''}${dateTo ? `&to=${dateTo}` : ''}`;
  const { data, isLoading } = useQuery<{ data: AdminAuditLog[]; total: number }>(queryUrl, {
    fallbackData: { data: MOCK_LOGS, total: MOCK_LOGS.length },
  });

  const logs = data?.data ?? MOCK_LOGS;
  const total = data?.total ?? logs.length;

  const columns: Column<AdminAuditLog>[] = [
    { key: 'createdAt', header: 'Timestamp', sortable: true, cell: (row) => (
      <span className="text-xs text-text-secondary font-mono">{new Date(row.createdAt).toLocaleString()}</span>
    )},
    { key: 'adminName', header: 'Admin', cell: (row) => (
      <div>
        <span className="text-text-primary text-xs font-medium">{row.adminName}</span>
        <br /><span className="text-[10px] text-text-tertiary">{row.adminEmail}</span>
      </div>
    )},
    { key: 'action', header: 'Action', cell: (row) => (
      <span className="font-mono text-xs text-accent-teal">{row.action}</span>
    )},
    { key: 'targetType', header: 'Target', cell: (row) => (
      <div>
        <span className="text-xs text-text-secondary capitalize">{row.targetType}</span>
        {row.targetId && <span className="ml-1 font-mono text-xs text-text-tertiary">{row.targetId}</span>}
      </div>
    )},
    { key: 'details', header: 'Details', cell: (row) => {
      if (!row.oldValue && !row.newValue) return <span className="text-text-tertiary">—</span>;
      return (
        <div className="text-[10px] font-mono max-w-[200px] truncate text-text-tertiary">
          {row.oldValue ? JSON.stringify(row.oldValue) : '—'} → {row.newValue ? JSON.stringify(row.newValue) : '—'}
        </div>
      );
    }},
    { key: 'ipAddress', header: 'IP', cell: (row) => <span className="font-mono text-xs text-text-tertiary">{row.ipAddress ?? '—'}</span> },
  ];

  const actionOptions = [
    { label: 'Pool Pause', value: 'pool.pause' },
    { label: 'Pool Resume', value: 'pool.resume' },
    { label: 'Pool Create', value: 'pool.create' },
    { label: 'Pool Update Params', value: 'pool.update_params' },
    { label: 'User Approve KYB', value: 'user.approve_kyb' },
    { label: 'User Suspend', value: 'user.suspend' },
    { label: 'User Change Role', value: 'user.change_role' },
    { label: 'Oracle Reset CB', value: 'oracle.reset_cb' },
    { label: 'Config Update', value: 'config.update' },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Audit Log"
        description="Complete record of all admin actions"
        actions={
          <Button variant="secondary" size="sm"><Download className="h-3.5 w-3.5 mr-1" /> Export CSV</Button>
        }
      />

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search targets..."
        filters={[
          { key: 'action', label: 'All Actions', options: actionOptions, value: actionFilter, onChange: setActionFilter },
        ]}
        dateRange={{ from: dateFrom, to: dateTo, onFromChange: setDateFrom, onToChange: setDateTo }}
      />

      <Table<AdminAuditLog>
        columns={columns}
        data={logs}
        rowKey={(row) => String(row.id)}
        loading={isLoading}
        compact
      />

      <AdminPagination page={page} totalPages={Math.ceil(total / 50)} total={total} limit={50} onPageChange={setPage} />
    </div>
  );
}
