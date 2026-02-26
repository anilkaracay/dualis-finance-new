import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type {
  ApiResponse,
  ProtocolStats,
  PoolAnalyticsSummary,
  TimeSeriesPoint,
  AnalyticsTimeRange,
  AnalyticsMetric,
} from '@dualis/shared';
import { AppError } from '../middleware/errorHandler.js';
import * as poolAnalytics from '../services/analytics/poolAnalytics.service.js';
import * as protocolHealth from '../services/analytics/protocolHealth.service.js';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const timeRangeSchema = z.object({
  range: z.enum(['7d', '30d', '90d', '1y']).optional().default('30d'),
});

const poolHistorySchema = z.object({
  metric: z.enum(['tvl', 'supply_apy', 'borrow_apy', 'utilization']).optional().default('tvl'),
  range: z.enum(['7d', '30d', '90d', '1y']).optional().default('30d'),
});

const poolIdParams = z.object({
  id: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Routes — public (no auth required)
// ---------------------------------------------------------------------------

export async function analyticsPublicRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /analytics/protocol/tvl — TVL (current + history)
  fastify.get('/analytics/protocol/tvl', async (request, reply) => {
    const parsed = timeRangeSchema.safeParse(request.query);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid query parameters', 400, parsed.error.flatten());
    }

    const allPools = poolAnalytics.getAllPoolAnalytics();
    const currentTvl = allPools.reduce((sum, p) => sum + p.tvlUsd, 0);

    // Generate protocol-level TVL history
    const range = parsed.data.range as AnalyticsTimeRange;
    const tvlHistory: TimeSeriesPoint[] = [];
    const rangeConfig: Record<AnalyticsTimeRange, { points: number; stepMs: number }> = {
      '7d': { points: 168, stepMs: 3_600_000 },
      '30d': { points: 180, stepMs: 4 * 3_600_000 },
      '90d': { points: 90, stepMs: 86_400_000 },
      '1y': { points: 52, stepMs: 7 * 86_400_000 },
    };
    const cfg = rangeConfig[range];
    const now = Date.now();
    for (let i = cfg.points; i >= 0; i--) {
      const trend = 1 + (cfg.points - i) / cfg.points * 0.08;
      const noise = 1 + Math.sin(i * 0.2) * 0.02 + (Math.random() - 0.5) * 0.01;
      tvlHistory.push({
        timestamp: new Date(now - i * cfg.stepMs).toISOString(),
        value: Number((currentTvl * trend * noise).toFixed(2)),
      });
    }

    const response: ApiResponse<{ current: number; history: TimeSeriesPoint[] }> = {
      data: { current: currentTvl, history: tvlHistory },
    };
    return reply.status(200).send(response);
  });

  // GET /analytics/protocol/stats — Protocol summary
  fastify.get('/analytics/protocol/stats', async (_request, reply) => {
    const allPools = poolAnalytics.getAllPoolAnalytics();
    const health = protocolHealth.getProtocolHealth();

    const stats: ProtocolStats = {
      tvlUsd: allPools.reduce((sum, p) => sum + p.tvlUsd, 0),
      totalSupplyUsd: allPools.reduce((sum, p) => sum + p.totalSupplyUsd, 0),
      totalBorrowUsd: allPools.reduce((sum, p) => sum + p.totalBorrowUsd, 0),
      avgUtilization: allPools.reduce((sum, p) => sum + p.utilization, 0) / allPools.length,
      totalUsers: 1_234,
      healthScore: health.healthScore,
      pools: allPools.map(p => ({
        id: p.poolId,
        asset: p.asset,
        tvlUsd: p.tvlUsd,
        supplyApy: p.supplyApy,
        borrowApy: p.borrowApy,
        utilization: p.utilization,
      })),
    };

    const response: ApiResponse<ProtocolStats> = { data: stats };
    return reply.status(200).send(response);
  });

  // GET /analytics/pools — All pools with analytics
  fastify.get('/analytics/pools', async (_request, reply) => {
    const pools = poolAnalytics.getAllPoolAnalytics();
    const response: ApiResponse<PoolAnalyticsSummary[]> = { data: pools };
    return reply.status(200).send(response);
  });

  // GET /analytics/pools/:id/history — Pool historical data
  fastify.get('/analytics/pools/:id/history', async (request, reply) => {
    const params = poolIdParams.safeParse(request.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid pool ID', 400);
    }

    const query = poolHistorySchema.safeParse(request.query);
    if (!query.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid query parameters', 400, query.error.flatten());
    }

    const history = poolAnalytics.getPoolTimeSeries(
      params.data.id,
      query.data.metric as AnalyticsMetric,
      query.data.range as AnalyticsTimeRange,
    );

    if (history.length === 0) {
      throw new AppError('POOL_NOT_FOUND', `Pool ${params.data.id} not found`, 404);
    }

    const response: ApiResponse<TimeSeriesPoint[]> = { data: history };
    return reply.status(200).send(response);
  });

  // GET /analytics/pools/:id/rates — Pool rate history
  fastify.get('/analytics/pools/:id/rates', async (request, reply) => {
    const params = poolIdParams.safeParse(request.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid pool ID', 400);
    }

    const query = timeRangeSchema.safeParse(request.query);
    if (!query.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid query parameters', 400, query.error.flatten());
    }

    const range = query.data.range as AnalyticsTimeRange;
    const supplyApy = poolAnalytics.getPoolTimeSeries(params.data.id, 'supply_apy', range);
    const borrowApy = poolAnalytics.getPoolTimeSeries(params.data.id, 'borrow_apy', range);

    if (supplyApy.length === 0) {
      throw new AppError('POOL_NOT_FOUND', `Pool ${params.data.id} not found`, 404);
    }

    const response: ApiResponse<{ supplyApy: TimeSeriesPoint[]; borrowApy: TimeSeriesPoint[] }> = {
      data: { supplyApy, borrowApy },
    };
    return reply.status(200).send(response);
  });

  // GET /analytics/protocol-health — Protocol health score (public)
  fastify.get('/analytics/protocol-health', async (_request, reply) => {
    const health = protocolHealth.getProtocolHealth();

    const response: ApiResponse<typeof health> = {
      data: health,
    };

    return reply.status(200).send(response);
  });

  // GET /analytics/protocol/volume — Protocol volume data
  fastify.get('/analytics/protocol/volume', async (request, reply) => {
    const parsed = timeRangeSchema.safeParse(request.query);
    const range = parsed.success ? (parsed.data.range as AnalyticsTimeRange) : '30d';

    const allPools = poolAnalytics.getAllPoolAnalytics();
    const totalBorrowUsd = allPools.reduce((sum, p) => sum + p.totalBorrowUsd, 0);

    const rangeConfig: Record<AnalyticsTimeRange, { points: number; stepMs: number }> = {
      '7d': { points: 7, stepMs: 86_400_000 },
      '30d': { points: 30, stepMs: 86_400_000 },
      '90d': { points: 90, stepMs: 86_400_000 },
      '1y': { points: 52, stepMs: 7 * 86_400_000 },
    };
    const cfg = rangeConfig[range];
    const now = Date.now();
    const dailyVolume: TimeSeriesPoint[] = [];

    for (let i = cfg.points; i >= 0; i--) {
      const noise = 1 + Math.sin(i * 0.3) * 0.15 + (Math.random() - 0.5) * 0.05;
      dailyVolume.push({
        timestamp: new Date(now - i * cfg.stepMs).toISOString(),
        value: Number((totalBorrowUsd * 0.05 * noise).toFixed(2)),
      });
    }

    const totalVolume = dailyVolume.reduce((sum, p) => sum + p.value, 0);

    const response: ApiResponse<{ totalVolume: number; dailyVolume: TimeSeriesPoint[]; period: string; currency: string }> = {
      data: { totalVolume: Number(totalVolume.toFixed(2)), dailyVolume, period: range, currency: 'USD' },
    };
    return reply.status(200).send(response);
  });

  // GET /analytics/protocol/users — Protocol user stats
  fastify.get('/analytics/protocol/users', async (request, reply) => {
    const parsed = timeRangeSchema.safeParse(request.query);
    const range = parsed.success ? (parsed.data.range as AnalyticsTimeRange) : '30d';

    const rangeConfig: Record<AnalyticsTimeRange, { points: number; stepMs: number }> = {
      '7d': { points: 7, stepMs: 86_400_000 },
      '30d': { points: 30, stepMs: 86_400_000 },
      '90d': { points: 90, stepMs: 86_400_000 },
      '1y': { points: 52, stepMs: 7 * 86_400_000 },
    };
    const cfg = rangeConfig[range];
    const now = Date.now();
    const dailyActiveUsers: TimeSeriesPoint[] = [];

    for (let i = cfg.points; i >= 0; i--) {
      const trend = 1 + (cfg.points - i) / cfg.points * 0.3;
      const noise = 1 + Math.sin(i * 0.4) * 0.1;
      dailyActiveUsers.push({
        timestamp: new Date(now - i * cfg.stepMs).toISOString(),
        value: Math.round(50 * trend * noise),
      });
    }

    const response: ApiResponse<{ totalUsers: number; activeUsers: number; newUsersToday: number; dailyActiveUsers: TimeSeriesPoint[] }> = {
      data: { totalUsers: 1_234, activeUsers: 89, newUsersToday: 5, dailyActiveUsers },
    };
    return reply.status(200).send(response);
  });

  // GET /analytics/snapshots — Recent analytics snapshots
  fastify.get('/analytics/snapshots', async (request, reply) => {
    const parsed = timeRangeSchema.safeParse(request.query);
    const range = parsed.success ? (parsed.data.range as AnalyticsTimeRange) : '30d';

    const allPools = poolAnalytics.getAllPoolAnalytics();
    const health = protocolHealth.getProtocolHealth();

    // Generate mock snapshots based on time range
    const rangeConfig: Record<AnalyticsTimeRange, { points: number; stepMs: number }> = {
      '7d': { points: 7, stepMs: 86_400_000 },
      '30d': { points: 30, stepMs: 86_400_000 },
      '90d': { points: 90, stepMs: 86_400_000 },
      '1y': { points: 52, stepMs: 7 * 86_400_000 },
    };
    const cfg = rangeConfig[range];
    const now = Date.now();
    const snapshots: Array<{
      timestamp: string;
      tvlUsd: number;
      totalSupplyUsd: number;
      totalBorrowUsd: number;
      healthScore: number;
      avgUtilization: number;
      poolCount: number;
    }> = [];

    const baseTvl = allPools.reduce((sum, p) => sum + p.tvlUsd, 0);
    for (let i = cfg.points; i >= 0; i--) {
      const trend = 1 + (cfg.points - i) / cfg.points * 0.06;
      const noise = 1 + Math.sin(i * 0.2) * 0.015;
      snapshots.push({
        timestamp: new Date(now - i * cfg.stepMs).toISOString(),
        tvlUsd: Number((baseTvl * trend * noise).toFixed(2)),
        totalSupplyUsd: Number((baseTvl * 1.3 * trend * noise).toFixed(2)),
        totalBorrowUsd: Number((baseTvl * 0.72 * trend * noise).toFixed(2)),
        healthScore: Math.round(Math.min(100, Math.max(0, health.healthScore + Math.sin(i * 0.1) * 5))),
        avgUtilization: Number((0.68 + Math.sin(i * 0.15) * 0.05).toFixed(4)),
        poolCount: allPools.length,
      });
    }

    const response: ApiResponse<typeof snapshots> = {
      data: snapshots,
    };

    return reply.status(200).send(response);
  });
}
