// ---------------------------------------------------------------------------
// AML User Routes — /compliance/aml/*
// ---------------------------------------------------------------------------

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { getScreeningHistory } from '../compliance/services/aml.service.js';

export default async function complianceAMLRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /compliance/aml/status — latest AML status for current user
  fastify.get(
    '/compliance/aml/status',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);

      const screenings = await getScreeningHistory(userId);
      const latestByWallet = new Map<string, (typeof screenings)[0]>();

      for (const s of screenings) {
        const addr = s.walletAddress ?? '';
        if (addr && !latestByWallet.has(addr)) {
          latestByWallet.set(addr, s);
        }
      }

      // Determine overall status
      let overallStatus = 'not_screened';
      const statusPriority: Record<string, number> = { blocked: 4, high_risk: 3, flagged: 2, clear: 1, pending: 0 };
      let maxPriority = -1;

      for (const s of latestByWallet.values()) {
        const priority = statusPriority[s.status] ?? 0;
        if (priority > maxPriority) {
          maxPriority = priority;
          overallStatus = s.status;
        }
      }

      return reply.send({
        status: overallStatus,
        walletCount: latestByWallet.size,
        wallets: Array.from(latestByWallet.values()).map((s) => ({
          walletAddress: s.walletAddress,
          status: s.status,
          riskScore: s.riskScore,
          riskCategory: s.riskCategory,
          screenedAt: s.screenedAt,
          nextScreeningAt: s.nextScreeningAt,
        })),
      });
    },
  );

  // GET /compliance/aml/screenings — full screening history
  fastify.get(
    '/compliance/aml/screenings',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);

      const screenings = await getScreeningHistory(userId);

      return reply.send({
        screenings: screenings.map((s) => ({
          screeningId: s.screeningId,
          walletAddress: s.walletAddress,
          status: s.status,
          riskScore: s.riskScore,
          riskCategory: s.riskCategory,
          provider: s.provider,
          screenedAt: s.screenedAt,
          nextScreeningAt: s.nextScreeningAt,
        })),
      });
    },
  );
}
