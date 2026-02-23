import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ApiResponse } from '@dualis/shared';
import { requireAdmin } from '../middleware/admin-auth.js';
import * as auditService from '../services/admin-audit.service.js';

const paginationSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
});

export async function adminAuditRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /admin/audit/logs — paginated, filterable audit logs
  fastify.get(
    '/admin/audit/logs',
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      const query = request.query as Record<string, string>;
      const { page, limit } = paginationSchema.parse(query);
      const filters: { action?: string; search?: string; from?: string; to?: string } = {};
      if (query.action) filters.action = query.action;
      if (query.search) filters.search = query.search;
      if (query.from) filters.from = query.from;
      if (query.to) filters.to = query.to;

      const result = await auditService.getAuditLogs(filters, { page, limit });

      const response: ApiResponse<typeof result> = { data: result };
      return reply.status(200).send(response);
    },
  );

  // POST /admin/audit/export — CSV export
  fastify.post(
    '/admin/audit/export',
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      const query = request.query as Record<string, string>;
      const exportFilters: { action?: string; search?: string; from?: string; to?: string } = {};
      if (query.action) exportFilters.action = query.action;
      if (query.search) exportFilters.search = query.search;
      if (query.from) exportFilters.from = query.from;
      if (query.to) exportFilters.to = query.to;

      const csv = await auditService.exportAuditLogsCsv(exportFilters);

      return reply
        .status(200)
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', 'attachment; filename="audit-log.csv"')
        .send(csv);
    },
  );
}
