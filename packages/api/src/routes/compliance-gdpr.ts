import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  requestDataExport,
  requestDataDeletion,
  getDataRequests,
} from '../compliance/services/gdpr.service.js';

export default async function complianceGDPRRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /compliance/data-export
  fastify.post(
    '/compliance/data-export',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);

      const result = await requestDataExport(userId);
      return reply.send(result);
    },
  );

  // POST /compliance/data-deletion
  fastify.post(
    '/compliance/data-deletion',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);

      const body = request.body as { reason?: string };
      const result = await requestDataDeletion(userId, body?.reason);
      return reply.send(result);
    },
  );

  // GET /compliance/data-deletion/status
  fastify.get(
    '/compliance/data-deletion/status',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);

      const requests = await getDataRequests(userId);
      return reply.send({ requests });
    },
  );
}
