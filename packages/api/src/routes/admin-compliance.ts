import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ApiResponse } from '@dualis/shared';
import { requireCompliance } from '../middleware/admin-auth.js';

// ---------------------------------------------------------------------------
// Mock compliance data
// ---------------------------------------------------------------------------

const MOCK_KYB_QUEUE = [
  { userId: 'usr-011', displayName: 'Acme Capital LLC', email: 'legal@acme-capital.com', submittedAt: '2024-12-10T08:00:00Z', status: 'pending', riskScore: 25, assignedTo: null, documentsCount: 4, completedDocs: 3 },
  { userId: 'usr-012', displayName: 'Blockchain Ventures GmbH', email: 'compliance@bv-gmbh.de', submittedAt: '2024-12-08T14:00:00Z', status: 'in_review', riskScore: 45, assignedTo: 'usr-007', documentsCount: 5, completedDocs: 5 },
  { userId: 'usr-013', displayName: 'Pacific Trust Fund', email: 'ops@pacifictrust.sg', submittedAt: '2024-12-05T10:00:00Z', status: 'pending', riskScore: 60, assignedTo: null, documentsCount: 6, completedDocs: 4 },
  { userId: 'usr-014', displayName: 'Nordic DeFi AB', email: 'legal@nordic-defi.se', submittedAt: '2024-12-01T09:00:00Z', status: 'in_review', riskScore: 15, assignedTo: 'usr-007', documentsCount: 4, completedDocs: 4 },
];

const MOCK_EXPIRING_DOCS = [
  { userId: 'usr-003', displayName: 'Carol Chen', docType: 'beneficial_ownership', expiresAt: '2024-12-15T00:00:00Z', status: 'expired' },
  { userId: 'usr-008', displayName: 'Frank Global Fund', docType: 'financial_statement', expiresAt: '2025-01-15T00:00:00Z', status: 'expiring_soon' },
  { userId: 'usr-008', displayName: 'Frank Global Fund', docType: 'aml_policy', expiresAt: '2025-02-01T00:00:00Z', status: 'expiring_soon' },
  { userId: 'usr-003', displayName: 'Carol Chen', docType: 'incorporation_cert', expiresAt: '2025-06-01T00:00:00Z', status: 'valid' },
];

const paginationSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export async function adminComplianceRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /admin/compliance/queue — pending KYB applications
  fastify.get(
    '/admin/compliance/queue',
    { preHandler: [requireCompliance] },
    async (request, reply) => {
      const query = request.query as Record<string, string>;
      const { page, limit } = paginationSchema.parse(query);
      const { status } = query;

      let queue = [...MOCK_KYB_QUEUE];
      if (status) queue = queue.filter((q) => q.status === status);

      const total = queue.length;
      const offset = (page - 1) * limit;

      const response: ApiResponse<{ data: typeof queue; total: number; page: number; limit: number }> = {
        data: { data: queue.slice(offset, offset + limit), total, page, limit },
      };
      return reply.status(200).send(response);
    },
  );

  // GET /admin/compliance/expiring — expiring documents
  fastify.get(
    '/admin/compliance/expiring',
    { preHandler: [requireCompliance] },
    async (_request, reply) => {
      const expired = MOCK_EXPIRING_DOCS.filter((d) => d.status === 'expired');
      const expiringSoon = MOCK_EXPIRING_DOCS.filter((d) => d.status === 'expiring_soon');
      const valid = MOCK_EXPIRING_DOCS.filter((d) => d.status === 'valid');

      const response: ApiResponse<{ expired: typeof expired; expiringSoon: typeof expiringSoon; valid: typeof valid }> = {
        data: { expired, expiringSoon, valid },
      };
      return reply.status(200).send(response);
    },
  );

  // POST /admin/compliance/export/users — CSV export
  fastify.post(
    '/admin/compliance/export/users',
    { preHandler: [requireCompliance] },
    async (_request, reply) => {
      const csv = 'userId,displayName,email,status,riskScore\n' +
        MOCK_KYB_QUEUE.map((q) => `${q.userId},${q.displayName},${q.email},${q.status},${q.riskScore}`).join('\n');

      return reply
        .status(200)
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', 'attachment; filename="compliance-users.csv"')
        .send(csv);
    },
  );

  // POST /admin/compliance/export/transactions — CSV export
  fastify.post(
    '/admin/compliance/export/transactions',
    { preHandler: [requireCompliance] },
    async (_request, reply) => {
      const csv = 'txId,userId,type,amount,timestamp\nmock-data-placeholder';

      return reply
        .status(200)
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', 'attachment; filename="compliance-transactions.csv"')
        .send(csv);
    },
  );
}
