import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ApiResponse, AnalyticsHistoryParams, AnalyticsOverview, AnalyticsHistoryPoint } from '@dualis/shared';
import { AppError } from '../middleware/errorHandler.js';
import * as analyticsService from '../services/analytics.service.js';

const analyticsHistorySchema = z.object({
  metric: z.enum(['tvl', 'borrowed', 'fees', 'users', 'liquidations']).optional(),
  period: z.enum(['7d', '30d', '90d', '1y']).optional(),
});

export async function analyticsRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /analytics/overview
  fastify.get('/analytics/overview', async (_request, reply) => {
    const overview = analyticsService.getOverview();

    const response: ApiResponse<AnalyticsOverview> = {
      data: overview,
    };

    return reply.status(200).send(response);
  });

  // GET /analytics/history
  fastify.get('/analytics/history', async (request, reply) => {
    const parsed = analyticsHistorySchema.safeParse(request.query);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid query parameters', 400, parsed.error.flatten());
    }

    const params = parsed.data as AnalyticsHistoryParams;
    const history = analyticsService.getHistory(params);

    const response: ApiResponse<AnalyticsHistoryPoint[]> = {
      data: history,
    };

    return reply.status(200).send(response);
  });
}
