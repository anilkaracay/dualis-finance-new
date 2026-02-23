// ---------------------------------------------------------------------------
// Compliance Audit Routes — admin only
// ---------------------------------------------------------------------------

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { requireCompliance } from '../middleware/admin-auth.js';
import { queryAuditLog, exportAuditLogCSV } from '../compliance/audit.js';

export default async function complianceAuditRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /admin/compliance/audit — filterable audit log
  fastify.get(
    '/admin/compliance/audit',
    { preHandler: [authMiddleware, requireCompliance] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as Record<string, string | undefined>;

      const auditParams: Parameters<typeof queryAuditLog>[0] = {
        page: parseInt(query.page ?? '1', 10),
        limit: Math.min(parseInt(query.limit ?? '50', 10), 200),
      };
      if (query.userId) auditParams.userId = query.userId;
      if (query.action) auditParams.action = query.action;
      if (query.category) auditParams.category = query.category;
      if (query.from) auditParams.from = new Date(query.from);
      if (query.to) auditParams.to = new Date(query.to);

      const result = await queryAuditLog(auditParams);

      return reply.send(result);
    },
  );

  // GET /admin/compliance/audit/:userId — audit log for specific user
  fastify.get(
    '/admin/compliance/audit/:userId',
    { preHandler: [authMiddleware, requireCompliance] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as { userId: string };
      const query = request.query as Record<string, string | undefined>;

      const result = await queryAuditLog({
        userId: params.userId,
        page: parseInt(query.page ?? '1', 10),
        limit: Math.min(parseInt(query.limit ?? '50', 10), 200),
      });

      return reply.send(result);
    },
  );

  // GET /admin/compliance/audit/export — CSV export
  fastify.get(
    '/admin/compliance/audit/export',
    { preHandler: [authMiddleware, requireCompliance] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as Record<string, string | undefined>;

      const csvParams: Parameters<typeof exportAuditLogCSV>[0] = {};
      if (query.userId) csvParams.userId = query.userId;
      if (query.action) csvParams.action = query.action;
      if (query.category) csvParams.category = query.category;
      if (query.from) csvParams.from = new Date(query.from);
      if (query.to) csvParams.to = new Date(query.to);

      const csv = await exportAuditLogCSV(csvParams);

      return reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="compliance-audit-${new Date().toISOString().slice(0, 10)}.csv"`)
        .send(csv);
    },
  );
}
