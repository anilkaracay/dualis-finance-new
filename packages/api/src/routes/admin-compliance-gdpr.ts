// ---------------------------------------------------------------------------
// Admin GDPR + MASAK Routes
// ---------------------------------------------------------------------------

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireCompliance } from '../middleware/admin-auth.js';
import {
  getPendingDeletionRequests,
  processDataDeletion,
} from '../compliance/services/gdpr.service.js';
import { createSIB, getSIBList } from '../compliance/services/masak.service.js';

export default async function adminComplianceGDPRRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /admin/compliance/deletion-requests
  fastify.get(
    '/admin/compliance/deletion-requests',
    { preHandler: [requireCompliance] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const requests = await getPendingDeletionRequests();
      return reply.send({ requests });
    },
  );

  // PUT /admin/compliance/deletion-requests/:id
  fastify.put(
    '/admin/compliance/deletion-requests/:id',
    { preHandler: [requireCompliance] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const body = request.body as { decision?: string; note?: string };
      const adminId = request.user!.userId!;

      if (!body?.decision || !['approve', 'reject'].includes(body.decision)) {
        return reply.status(400).send({ error: 'Invalid decision. Must be "approve" or "reject"' });
      }

      await processDataDeletion(id, adminId, body.decision as 'approve' | 'reject', body.note);
      return reply.send({ success: true });
    },
  );

  // POST /admin/compliance/sib — create ŞİB report
  fastify.post(
    '/admin/compliance/sib',
    { preHandler: [requireCompliance] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as { userId?: string; reason?: string; details?: Record<string, unknown> };
      const adminId = request.user!.userId!;

      if (!body?.userId || !body?.reason) {
        return reply.status(400).send({ error: 'userId and reason are required' });
      }

      const report = await createSIB(body.userId, body.reason, body.details ?? {}, adminId);
      return reply.send({ report });
    },
  );

  // GET /admin/compliance/sib/list
  fastify.get(
    '/admin/compliance/sib/list',
    { preHandler: [requireCompliance] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as { userId?: string };
      const filters: { userId?: string } = {};
      if (query.userId) filters.userId = query.userId;
      const reports = await getSIBList(filters);
      return reply.send({ reports });
    },
  );
}
