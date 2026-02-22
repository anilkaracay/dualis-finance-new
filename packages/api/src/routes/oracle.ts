import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { ApiResponse, OraclePriceParams, OraclePriceItem, OraclePriceWithHistory } from '@dualis/shared';
import { AppError } from '../middleware/errorHandler.js';
import * as oracleService from '../services/oracle.service.js';

const oraclePriceParamsSchema = z.object({
  history: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  period: z.enum(['1h', '24h', '7d', '30d']).optional(),
});

export async function oracleRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /oracle/prices
  fastify.get('/oracle/prices', async (_request, reply) => {
    const prices = oracleService.getAllPrices();

    const response: ApiResponse<OraclePriceItem[]> = {
      data: prices,
    };

    return reply.status(200).send(response);
  });

  // GET /oracle/prices/:asset
  fastify.get(
    '/oracle/prices/:asset',
    async (
      request: FastifyRequest<{ Params: { asset: string } }>,
      reply
    ) => {
      const { asset } = request.params;
      const parsed = oraclePriceParamsSchema.safeParse(request.query);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid query parameters', 400, parsed.error.flatten());
      }

      try {
        const oracleParams = {
          history: parsed.data.history,
          period: parsed.data.period,
        } as OraclePriceParams;
        const result = oracleService.getAssetPrice(asset, oracleParams);

        const response: ApiResponse<OraclePriceItem | OraclePriceWithHistory> = {
          data: result,
        };

        return reply.status(200).send(response);
      } catch {
        throw new AppError('NOT_FOUND', `Asset ${asset} not found`, 404);
      }
    }
  );
}
