/**
 * Rewards API Routes — MP25 Canton Coin Rewards
 *
 * Endpoints for reward summary, activity logs, leaderboard, and epochs.
 */
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import * as activityService from '../services/activity.service.js';
import { findFeaturedAppRight } from '../services/canton-rewards.service.js';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const activitiesQuerySchema = z.object({
  userId: z.string().optional(),
  activityType: z.enum(['deposit', 'withdraw', 'borrow', 'repay', 'add_collateral']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const epochParamSchema = z.object({
  epochNumber: z.coerce.number().int().min(1),
});

const leaderboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const userParamSchema = z.object({
  userId: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function rewardRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /rewards/summary — combined Canton + Protocol reward summary
  fastify.get('/rewards/summary', { preHandler: authMiddleware }, async (request, reply) => {
    const user = (request as FastifyRequest & { user?: { userId?: string; partyId: string } }).user;
    const userId = user?.userId;

    const [userStats, stats, featuredAppRight] = await Promise.all([
      userId ? activityService.getUserRewardStats(userId) : null,
      activityService.getActivityStats(),
      findFeaturedAppRight(),
    ]);

    return reply.send({
      data: {
        canton: {
          featuredAppActive: !!featuredAppRight,
          featuredAppContractId: featuredAppRight ?? null,
        },
        protocol: {
          user: userStats
            ? {
                totalPoints: userStats.totalPoints,
                tier: userStats.tier,
                tierMultiplier: parseFloat(userStats.tierMultiplier),
                totalActivities: userStats.totalActivities,
                totalVolume: userStats.totalVolume,
                lastActivityAt: userStats.lastActivityAt,
              }
            : null,
          global: stats
            ? {
                totalActivities: stats.totalActivities,
                totalVolume: stats.totalVolume,
                totalPoints: stats.totalPoints,
                uniqueUsers: stats.uniqueUsers,
              }
            : null,
        },
      },
    });
  });

  // GET /rewards/epochs — recent epochs
  fastify.get('/rewards/epochs', async (_request, reply) => {
    const epochs = await activityService.getEpochs(30);
    return reply.send({ data: epochs });
  });

  // GET /rewards/epochs/:epochNumber — single epoch detail
  fastify.get('/rewards/epochs/:epochNumber', async (request, reply) => {
    const parsed = epochParamSchema.safeParse(request.params);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid epoch number', 400);
    }

    const epoch = await activityService.getEpochByNumber(parsed.data.epochNumber);
    if (!epoch) {
      throw new AppError('NOT_FOUND', `Epoch ${parsed.data.epochNumber} not found`, 404);
    }

    return reply.send({ data: epoch });
  });

  // GET /rewards/activities — paginated activity log (auth required)
  fastify.get('/rewards/activities', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = activitiesQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid query parameters', 400, parsed.error.flatten());
    }

    const user = (request as FastifyRequest & { user?: { userId?: string; partyId: string } }).user;
    const resolvedUserId = parsed.data.userId ?? user?.userId;
    const result = await activityService.getActivities({
      activityType: parsed.data.activityType,
      limit: parsed.data.limit,
      offset: parsed.data.offset,
      userId: resolvedUserId,
    });

    return reply.send({
      data: result.data,
      pagination: {
        total: result.total,
        limit: parsed.data.limit ?? 50,
        offset: parsed.data.offset ?? 0,
        hasMore: (parsed.data.offset ?? 0) + (parsed.data.limit ?? 50) < result.total,
      },
    });
  });

  // GET /rewards/activities/stats — aggregate stats (public)
  fastify.get('/rewards/activities/stats', async (_request, reply) => {
    const stats = await activityService.getActivityStats();
    return reply.send({ data: stats });
  });

  // GET /rewards/leaderboard — top users by points (public)
  fastify.get('/rewards/leaderboard', async (request, reply) => {
    const parsed = leaderboardQuerySchema.safeParse(request.query);
    const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;

    const leaderboard = await activityService.getLeaderboard(limit);
    return reply.send({ data: leaderboard });
  });

  // GET /rewards/canton-balance — Canton Coin balance + marker status
  fastify.get('/rewards/canton-balance', { preHandler: authMiddleware }, async (_request, reply) => {
    const [stats, featuredAppRight] = await Promise.all([
      activityService.getActivityStats(),
      findFeaturedAppRight(),
    ]);

    const totalMarkers = stats?.totalActivities ?? 0;

    return reply.send({
      data: {
        canton: {
          balance: 'unavailable',
          pendingRewards: 'unavailable',
          currency: 'CC',
          source: 'ledger-query',
          note: 'Canton Coin balance available via Splice Wallet UI. Activity markers are minted per transaction.',
        },
        featuredApp: {
          active: !!featuredAppRight,
          contractId: featuredAppRight ?? null,
          totalMarkersCreated: totalMarkers,
        },
        protocol: {
          totalPoints: stats?.totalPoints ?? 0,
          totalVolume: stats?.totalVolume ?? '0',
          uniqueUsers: stats?.uniqueUsers ?? 0,
        },
      },
    });
  });

  // GET /rewards/user/:userId — user reward detail (auth required)
  fastify.get('/rewards/user/:userId', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = userParamSchema.safeParse(request.params);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid user ID', 400);
    }

    const userStats = await activityService.getUserRewardStats(parsed.data.userId);
    if (!userStats) {
      return reply.send({
        data: {
          userId: parsed.data.userId,
          totalPoints: 0,
          tier: 'bronze',
          tierMultiplier: 1.0,
          totalActivities: 0,
          totalVolume: '0',
          lastActivityAt: null,
        },
      });
    }

    return reply.send({
      data: {
        userId: userStats.userId,
        totalPoints: userStats.totalPoints,
        tier: userStats.tier,
        tierMultiplier: parseFloat(userStats.tierMultiplier),
        totalActivities: userStats.totalActivities,
        totalVolume: userStats.totalVolume,
        lastActivityAt: userStats.lastActivityAt,
      },
    });
  });
}
