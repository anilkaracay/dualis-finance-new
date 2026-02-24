import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { initiateKYC, getKYCStatus, retryKYC } from '../compliance/services/kyc.service.js';

async function complianceKYCRoutesPlugin(fastify: FastifyInstance): Promise<void> {
  // POST /compliance/kyc/initiate
  fastify.post(
    '/compliance/kyc/initiate',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);

      const result = await initiateKYC(userId);
      return reply.send(result);
    },
  );

  // GET /compliance/kyc/status
  fastify.get(
    '/compliance/kyc/status',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);

      const status = await getKYCStatus(userId);
      if (!status) return reply.send({ status: 'not_started' });
      return reply.send(status);
    },
  );

  // POST /compliance/kyc/retry
  fastify.post(
    '/compliance/kyc/retry',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);

      const result = await retryKYC(userId);
      return reply.send(result);
    },
  );

  // GET /kyc/status (auth) — User's KYC verification status (alias)
  fastify.get(
    '/kyc/status',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);

      const status = await getKYCStatus(userId);
      if (!status) {
        return reply.send({
          data: {
            status: 'not_started',
            verified: false,
            tier: 'none',
            submittedAt: null,
            verifiedAt: null,
            expiresAt: null,
          },
        });
      }

      return reply.send({
        data: {
          status: status.status,
          verified: status.status === 'approved',
          tier: status.reviewAnswer === 'GREEN' ? 'full' : 'none',
          submittedAt: status.createdAt,
          verifiedAt: status.verifiedAt,
          expiresAt: status.expiresAt,
          attemptCount: status.attemptCount,
          rejectionReason: status.rejectionReason ?? null,
        },
      });
    },
  );
}

export { complianceKYCRoutesPlugin as complianceKYCRoutes };
