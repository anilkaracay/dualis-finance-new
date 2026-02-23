'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@dualis/shared';
import { Table, type Column, type SortDirection } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminFilterBar } from '@/components/admin/AdminFilterBar';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import { useQuery } from '@/hooks/api/useQuery';
import { Download } from 'lucide-react';
import type { AdminUserSummary } from '@dualis/shared';

const MOCK_USERS: AdminUserSummary[] = [
  { id: 1, userId: 'usr-001', email: 'alice@acme.com', displayName: 'Alice Johnson', role: 'institutional', accountStatus: 'active', kycStatus: 'approved', isAdminActive: false, totalSupplied: 500_000, totalBorrowed: 100_000, minHealthFactor: 1.65, createdAt: '2024-06-01', lastLoginAt: '2025-02-20' },
  { id: 2, userId: 'usr-002', email: 'bob@bank.com', displayName: 'Bob Smith', role: 'institutional', accountStatus: 'active', kycStatus: 'approved', isAdminActive: false, totalSupplied: 1_200_000, totalBorrowed: 400_000, minHealthFactor: 1.42, createdAt: '2024-07-15', lastLoginAt: '2025-02-22' },
  { id: 3, userId: 'usr-003', email: 'carol@example.com', displayName: 'Carol Williams', role: 'retail', accountStatus: 'active', kycStatus: 'approved', isAdminActive: false, totalSupplied: 25_000, totalBorrowed: 10_000, minHealthFactor: 2.10, createdAt: '2024-08-01', lastLoginAt: '2025-02-19' },
  { id: 4, userId: 'usr-004', email: 'dave@fund.io', displayName: 'Dave Brown', role: 'institutional', accountStatus: 'suspended', kycStatus: 'under_review', isAdminActive: false, totalSupplied: 0, totalBorrowed: 0, minHealthFactor: null, createdAt: '2024-09-01', lastLoginAt: '2025-01-15' },
  { id: 5, userId: 'usr-005', email: 'eve@crypto.com', displayName: 'Eve Davis', role: 'retail', accountStatus: 'active', kycStatus: 'not_started', isAdminActive: false, totalSupplied: 5_000, totalBorrowed: 0, minHealthFactor: null, createdAt: '2024-10-01', lastLoginAt: '2025-02-21' },
  { id: 6, userId: 'usr-006', email: 'admin@dualis.finance', displayName: 'Admin User', role: 'admin', accountStatus: 'active', kycStatus: 'approved', isAdminActive: true, totalSupplied: 0, totalBorrowed: 0, minHealthFactor: null, createdAt: '2024-01-01', lastLoginAt: '2025-02-23' },
  { id: 7, userId: 'usr-007', email: 'compliance@dualis.finance', displayName: 'Compliance Officer', role: 'compliance_officer', accountStatus: 'active', kycStatus: 'approved', isAdminActive: true, totalSupplied: 0, totalBorrowed: 0, minHealthFactor: null, createdAt: '2024-01-01', lastLoginAt: '2025-02-23' },
  { id: 8, userId: 'usr-008', email: 'frank@hedge.com', displayName: 'Frank Miller', role: 'institutional', accountStatus: 'active', kycStatus: 'documents_submitted', isAdminActive: false, totalSupplied: 300_000, totalBorrowed: 150_000, minHealthFactor: 1.18, createdAt: '2024-11-01', lastLoginAt: '2025-02-22' },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | undefined>();
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const { data, isLoading } = useQuery<{ data: AdminUserSummary[]; pagination?: { total: number } }>(
    `/admin/users?page=${page}&limit=25${statusFilter ? `&status=${statusFilter}` : ''}${roleFilter ? `&role=${roleFilter}` : ''}${search ? `&search=${search}` : ''}`,
    { fallbackData: { data: MOCK_USERS, pagination: { total: MOCK_USERS.length } } },
  );

  const users = data?.data ?? MOCK_USERS;
  const total = data?.pagination?.total ?? users.length;

  const columns: Column<AdminUserSummary>[] = [
    { key: 'userId', header: 'ID', cell: (row) => <span className="font-mono text-xs text-text-tertiary">{row.userId}</span> },
    { key: 'email', header: 'Name / Email', sortable: true, cell: (row) => (
      <div>
        <span className="font-medium text-text-primary">{row.displayName ?? '—'}</span>
        <br />
        <span className="text-xs text-text-tertiary">{row.email}</span>
      </div>
    )},
    { key: 'role', header: 'Role', cell: (row) => (
      <span className={`text-xs font-medium capitalize ${row.role === 'admin' ? 'text-negative' : row.role === 'compliance_officer' ? 'text-warning' : 'text-text-secondary'}`}>
        {row.role.replace('_', ' ')}
      </span>
    )},
    { key: 'accountStatus', header: 'Status', cell: (row) => <AdminStatusBadge status={row.accountStatus} /> },
    { key: 'kycStatus', header: 'KYC', cell: (row) => <AdminStatusBadge status={row.kycStatus === 'approved' ? 'approved' : row.kycStatus === 'rejected' ? 'rejected' : 'pending'} /> },
    { key: 'totalSupplied', header: 'Supplied', numeric: true, sortable: true, cell: (row) => row.totalSupplied > 0 ? formatCurrency(row.totalSupplied, { compact: true }) : '—' },
    { key: 'totalBorrowed', header: 'Borrowed', numeric: true, sortable: true, cell: (row) => row.totalBorrowed > 0 ? formatCurrency(row.totalBorrowed, { compact: true }) : '—' },
    { key: 'minHealthFactor', header: 'Min HF', numeric: true, sortable: true, cell: (row) =>
      row.minHealthFactor != null ? (
        <span className={row.minHealthFactor < 1.2 ? 'text-negative font-semibold' : row.minHealthFactor < 1.5 ? 'text-warning' : 'text-positive'}>
          {row.minHealthFactor.toFixed(2)}
        </span>
      ) : <span className="text-text-tertiary">—</span>
    },
    { key: 'createdAt', header: 'Registered', sortable: true, cell: (row) => <span className="text-xs text-text-secondary">{row.createdAt}</span> },
  ];

  return (
    <div>
      <AdminPageHeader
        title="User Management"
        description="Manage users, roles, KYB reviews, and account actions"
        actions={
          <Button variant="secondary" size="sm">
            <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
          </Button>
        }
      />

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email..."
        filters={[
          {
            key: 'status',
            label: 'All Statuses',
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Suspended', value: 'suspended' },
              { label: 'Blacklisted', value: 'blacklisted' },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
          {
            key: 'role',
            label: 'All Roles',
            options: [
              { label: 'Retail', value: 'retail' },
              { label: 'Institutional', value: 'institutional' },
              { label: 'Admin', value: 'admin' },
              { label: 'Compliance', value: 'compliance_officer' },
              { label: 'Viewer', value: 'viewer' },
            ],
            value: roleFilter,
            onChange: setRoleFilter,
          },
        ]}
      />

      <Table<AdminUserSummary>
        columns={columns}
        data={users}
        rowKey={(row) => row.userId}
        onRowClick={(row) => router.push(`/admin/users/${row.userId}`)}
        {...(sortColumn !== undefined ? { sortColumn } : {})}
        {...(sortDirection !== undefined ? { sortDirection } : {})}
        onSort={(col, dir) => { setSortColumn(dir ? col : undefined); setSortDirection(dir); }}
        loading={isLoading}
        compact
      />

      <AdminPagination page={page} totalPages={Math.ceil(total / 25)} total={total} limit={25} onPageChange={setPage} />
    </div>
  );
}
