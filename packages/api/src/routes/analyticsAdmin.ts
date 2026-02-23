import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type {
  ApiResponse,
  AdminAnalyticsOverview,
  ProtocolHealthDashboard,
  RevenueSummary,
  PoolRanking,
  UserAnalytics,
  TimeSeriesPoint,
  AnalyticsTimeRange,
} from '@dualis/shared';
import { authMiddleware } from '../middleware/auth.js';
import * as adminAnalytics from '../services/analytics/adminAnalytics.service.js';
import * as protocolHealth from '../services/analytics/protocolHealth.service.js';
import * as revenue from '../services/analytics/revenue.service.js';
import { getPoolRankings } from '../services/analytics/poolAnalytics.service.js';

const rangeSchema = z.object({
  range: z.enum(['7d', '30d', '90d', '1y']).optional().default('30d'),
});

export async function analyticsAdminRoutes(fastify: FastifyInstance): Promise<void> {

  fastify.addHook('preHandler', authMiddleware);

  // GET /admin/analytics/overview — Full admin analytics dashboard
  fastify.get('/admin/analytics/overview', async (_request, reply) => {
    const overview = adminAnalytics.getAdminAnalyticsOverview();
    const response: ApiResponse<AdminAnalyticsOverview> = { data: overview };
    return reply.status(200).send(response);
  });

  // GET /admin/analytics/health — Protocol health dashboard
  fastify.get('/admin/analytics/health', async (_request, reply) => {
    const health = protocolHealth.getProtocolHealth();
    const response: ApiResponse<ProtocolHealthDashboard> = { data: health };
    return reply.status(200).send(response);
  });

  // GET /admin/analytics/health/history — Health score history
  fastify.get('/admin/analytics/health/history', async (request, reply) => {
    const parsed = rangeSchema.safeParse(request.query);
    const range = parsed.success ? parsed.data.range as AnalyticsTimeRange : '30d';

    const history = protocolHealth.getHealthScoreHistory(range);
    const response: ApiResponse<TimeSeriesPoint[]> = { data: history };
    return reply.status(200).send(response);
  });

  // GET /admin/analytics/revenue — Revenue summary
  fastify.get('/admin/analytics/revenue', async (_request, reply) => {
    const summary = revenue.getRevenueSummary();
    const response: ApiResponse<RevenueSummary> = { data: summary };
    return reply.status(200).send(response);
  });

  // GET /admin/analytics/pools — Pool comparison / ranking
  fastify.get('/admin/analytics/pools', async (request, reply) => {
    const sortSchema = z.object({
      sortBy: z.enum(['tvl', 'supplyApy', 'tvlGrowth', 'depositors', 'utilization']).optional().default('tvl'),
    });
    const parsed = sortSchema.safeParse(request.query);
    const sortBy = parsed.success ? parsed.data.sortBy : 'tvl';

    const rankings = getPoolRankings(sortBy as 'tvl' | 'supplyApy' | 'tvlGrowth' | 'depositors' | 'utilization');
    const response: ApiResponse<PoolRanking[]> = { data: rankings };
    return reply.status(200).send(response);
  });

  // GET /admin/analytics/users — User analytics (DAU/WAU/MAU + cohort)
  fastify.get('/admin/analytics/users', async (_request, reply) => {
    const overview = adminAnalytics.getAdminAnalyticsOverview();
    const response: ApiResponse<UserAnalytics> = { data: overview.userAnalytics };
    return reply.status(200).send(response);
  });
}
