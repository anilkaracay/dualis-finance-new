import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { ApiResponse, CreditHistoryParams, CreditScoreResponse, CreditHistoryPoint } from '@dualis/shared';
import { AppError } from '../middleware/errorHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import * as creditService from '../services/credit.service.js';

const creditHistorySchema = z.object({
  period: z.enum(['3m', '6m', '1y', 'all']).optional(),
});

export async function creditRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /credit/score (auth)
  fastify.get(
    '/credit/score',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = (request as FastifyRequest & { partyId: string }).partyId;
      const score = creditService.getScore(partyId);

      const response: ApiResponse<CreditScoreResponse> = {
        data: score,
      };

      return reply.status(200).send(response);
    }
  );

  // GET /credit/history (auth)
  fastify.get(
    '/credit/history',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = creditHistorySchema.safeParse(request.query);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid query parameters', 400, parsed.error.flatten());
      }

      const partyId = (request as FastifyRequest & { partyId: string }).partyId;
      const params = parsed.data as CreditHistoryParams;
      const history = creditService.getHistory(partyId, params);

      const response: ApiResponse<CreditHistoryPoint[]> = {
        data: history,
      };

      return reply.status(200).send(response);
    }
  );
}
