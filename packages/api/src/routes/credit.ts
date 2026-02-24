import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { ApiResponse, CreditHistoryParams, CreditScoreResponse, CreditHistoryPoint, CreditTier, TierBenefits } from '@dualis/shared';
import { TIER_BENEFITS, CREDIT_TIER_THRESHOLDS } from '@dualis/shared';
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

  // GET /credit/tiers — All credit tier definitions with benefits
  fastify.get('/credit/tiers', async (_request, reply) => {
    const tiers = (Object.keys(TIER_BENEFITS) as CreditTier[]).map((tier) => ({
      tier,
      thresholds: CREDIT_TIER_THRESHOLDS[tier],
      benefits: TIER_BENEFITS[tier],
    }));

    const response: ApiResponse<typeof tiers> = {
      data: tiers,
    };

    return reply.status(200).send(response);
  });

  // GET /credit/benefits (auth) — Current user's tier benefits
  fastify.get(
    '/credit/benefits',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = (request as FastifyRequest & { partyId: string }).partyId;
      const score = creditService.getScore(partyId);

      const tierBenefits = TIER_BENEFITS[score.creditTier] ?? TIER_BENEFITS['Unrated'];

      const response: ApiResponse<{
        tier: CreditTier;
        score: number;
        benefits: TierBenefits;
        nextTier: typeof score.nextTier;
      }> = {
        data: {
          tier: score.creditTier,
          score: score.rawScore,
          benefits: tierBenefits,
          nextTier: score.nextTier,
        },
      };

      return reply.status(200).send(response);
    }
  );
}
