'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, type Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { KPICard } from '@/components/data-display/KPICard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import { AdminFilterBar } from '@/components/admin/AdminFilterBar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Download } from 'lucide-react';

interface KYBApplication {
  id: string;
  applicant: string;
  companyName: string;
  type: string;
  submittedAt: string;
  documentCount: number;
  requiredDocuments: number;
  riskScore: 'low' | 'medium' | 'high';
  assignedTo: string | null;
}

interface ExpiringDoc {
  id: string;
  userId: string;
  userName: string;
  documentType: string;
  expiryDate: string;
  status: 'expired' | 'expiring_soon' | 'valid';
}

const MOCK_QUEUE: KYBApplication[] = [
  { id: 'kyb-1', applicant: 'Frank Miller', companyName: 'Hedge Fund Alpha', type: 'Fund', submittedAt: '2025-02-18', documentCount: 4, requiredDocuments: 5, riskScore: 'low', assignedTo: null },
  { id: 'kyb-2', applicant: 'Grace Kim', companyName: 'Korea Digital Bank', type: 'Bank', submittedAt: '2025-02-15', documentCount: 6, requiredDocuments: 6, riskScore: 'medium', assignedTo: 'compliance@dualis.finance' },
  { id: 'kyb-3', applicant: 'Henry Chen', companyName: 'DeFi Ventures LLC', type: 'Corporation', submittedAt: '2025-02-20', documentCount: 3, requiredDocuments: 5, riskScore: 'high', assignedTo: null },
];

const MOCK_EXPIRING: ExpiringDoc[] = [
  { id: 'exp-1', userId: 'usr-001', userName: 'Alice Johnson', documentType: 'Tax Certificate', expiryDate: '2025-02-10', status: 'expired' },
  { id: 'exp-2', userId: 'usr-002', userName: 'Bob Smith', documentType: 'Board Resolution', expiryDate: '2025-03-15', status: 'expiring_soon' },
  { id: 'exp-3', userId: 'usr-008', userName: 'Frank Miller', documentType: 'Certificate of Incorporation', expiryDate: '2026-06-01', status: 'valid' },
];

export default function AdminCompliancePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const queueColumns: Column<KYBApplication>[] = [
    { key: 'applicant', header: 'Applicant', cell: (row) => (
      <div>
        <span className="font-medium text-text-primary">{row.companyName}</span>
        <br /><span className="text-xs text-text-tertiary">{row.applicant}</span>
      </div>
    )},
    { key: 'type', header: 'Type', cell: (row) => row.type },
    { key: 'submittedAt', header: 'Submitted', cell: (row) => row.submittedAt },
    { key: 'docs', header: 'Documents', cell: (row) => (
      <span className={row.documentCount < row.requiredDocuments ? 'text-warning' : 'text-positive'}>
        {row.documentCount}/{row.requiredDocuments}
      </span>
    )},
    { key: 'riskScore', header: 'Risk', cell: (row) => (
      <AdminStatusBadge status={row.riskScore === 'low' ? 'active' : row.riskScore === 'medium' ? 'paused' : 'critical'} />
    )},
    { key: 'assignedTo', header: 'Assigned', cell: (row) => row.assignedTo ? <span className="text-xs">{row.assignedTo}</span> : <span className="text-text-tertiary text-xs">Unassigned</span> },
    { key: 'actions', header: '', cell: (row) => (
      <div className="flex gap-1">
        <Button variant="primary" size="sm" onClick={() => router.push(`/admin/users/${row.id}`)}>Review</Button>
        {!row.assignedTo && <Button variant="secondary" size="sm">Assign to Me</Button>}
      </div>
    )},
  ];

  const expiryColumns: Column<ExpiringDoc>[] = [
    { key: 'userName', header: 'User', cell: (row) => <span className="text-text-primary">{row.userName}</span> },
    { key: 'documentType', header: 'Document', cell: (row) => row.documentType },
    { key: 'expiryDate', header: 'Expiry Date', cell: (row) => row.expiryDate },
    { key: 'status', header: 'Status', cell: (row) => <AdminStatusBadge status={row.status === 'expired' ? 'expired' : row.status === 'expiring_soon' ? 'paused' : 'active'} /> },
    { key: 'actions', header: '', cell: () => <Button variant="secondary" size="sm">Notify</Button> },
  ];

  const expired = MOCK_EXPIRING.filter((d) => d.status === 'expired');
  const expiringSoon = MOCK_EXPIRING.filter((d) => d.status === 'expiring_soon');

  return (
    <div>
      <AdminPageHeader
        title="Compliance Dashboard"
        description="KYB review queue, document tracking, and regulatory exports"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm"><Download className="h-3.5 w-3.5 mr-1" /> Export Users</Button>
            <Button variant="secondary" size="sm"><Download className="h-3.5 w-3.5 mr-1" /> Export Transactions</Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KPICard label="Pending Reviews" value={MOCK_QUEUE.length} decimals={0} size="sm" />
        <KPICard label="Avg Review Time" value={3.2} suffix=" days" decimals={1} size="sm" />
        <KPICard label="Approval Rate" value={87} suffix="%" decimals={0} size="sm" />
        <KPICard label="Expiring This Month" value={expired.length + expiringSoon.length} decimals={0} size="sm" />
      </div>

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">KYB Review Queue ({MOCK_QUEUE.length})</TabsTrigger>
          <TabsTrigger value="expiry">Document Expiry</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-4">
          <AdminFilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search applicants..." />
          <Table<KYBApplication> columns={queueColumns} data={MOCK_QUEUE} rowKey={(row) => row.id} compact />
        </TabsContent>

        <TabsContent value="expiry" className="mt-4">
          {expired.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-negative uppercase tracking-wider mb-2">Expired</h4>
              <Table<ExpiringDoc> columns={expiryColumns} data={expired} rowKey={(row) => row.id} compact />
            </div>
          )}
          {expiringSoon.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-warning uppercase tracking-wider mb-2">Expiring Soon (30 days)</h4>
              <Table<ExpiringDoc> columns={expiryColumns} data={expiringSoon} rowKey={(row) => row.id} compact />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
