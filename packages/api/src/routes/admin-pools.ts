import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ApiResponse } from '@dualis/shared';
import { requireAdmin, requireAdminViewer, logAdminAction } from '../middleware/admin-auth.js';
import { AppError } from '../middleware/errorHandler.js';
import * as poolService from '../services/admin-pool.service.js';

const paginationSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

const poolParamsSchema = z.object({
  baseRatePerYear: z.number().min(0).max(1),
  multiplierPerYear: z.number().min(0).max(1),
  jumpMultiplierPerYear: z.number().min(0).max(5),
  kink: z.number().min(0).max(1),
  maxLTV: z.number().min(0).max(1),
  liquidationThreshold: z.number().min(0).max(1),
  liquidationPenalty: z.number().min(0).max(1),
  liquidationBonus: z.number().min(0).max(1),
  supplyCap: z.number().min(0),
  borrowCap: z.number().min(0),
});

const createPoolSchema = z.object({
  poolId: z.string().min(1).max(64),
  name: z.string().min(1).max(128),
  asset: z.string().min(1).max(32),
  params: poolParamsSchema,
});

export async function adminPoolRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /admin/pools — list pools
  fastify.get(
    '/admin/pools',
    { preHandler: [requireAdminViewer] },
    async (request, reply) => {
      const query = request.query as Record<string, string>;
      const { page, limit } = paginationSchema.parse(query);
      const filters: { status?: string; asset?: string; search?: string } = {};
      if (query.status) filters.status = query.status;
      if (query.asset) filters.asset = query.asset;
      if (query.search) filters.search = query.search;

      const result = poolService.listPools(filters, { page, limit });

      const response: ApiResponse<typeof result> = { data: result };
      return reply.status(200).send(response);
    },
  );

  // GET /admin/pools/:poolId — pool detail
  fastify.get(
    '/admin/pools/:poolId',
    { preHandler: [requireAdminViewer] },
    async (request, reply) => {
      const { poolId } = request.params as { poolId: string };
      const pool = poolService.getPoolById(poolId);
      if (!pool) throw new AppError('NOT_FOUND', 'Pool not found', 404);

      const response: ApiResponse<typeof pool> = { data: pool };
      return reply.status(200).send(response);
    },
  );

  // POST /admin/pools — create pool
  fastify.post(
    '/admin/pools',
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      const parsed = createPoolSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid pool data', 400, parsed.error.flatten());
      }

      const existing = poolService.getPoolById(parsed.data.poolId);
      if (existing) {
        throw new AppError('VALIDATION_ERROR', 'Pool ID already exists', 400);
      }

      const pool = poolService.createPool(parsed.data);

      await logAdminAction(request, 'pool.create', 'pool', pool.poolId, null, { poolId: pool.poolId, asset: pool.asset });

      const response: ApiResponse<typeof pool> = { data: pool };
      return reply.status(201).send(response);
    },
  );

  // PUT /admin/pools/:poolId/params — update pool parameters
  fastify.put(
    '/admin/pools/:poolId/params',
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      const { poolId } = request.params as { poolId: string };
      const parsed = poolParamsSchema.partial().safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid parameters', 400, parsed.error.flatten());
      }

      const result = poolService.updatePoolParams(poolId, parsed.data as Partial<import('@dualis/shared').AdminPoolParams>);
      if (!result) throw new AppError('NOT_FOUND', 'Pool not found', 404);

      await logAdminAction(request, 'pool.update_params', 'pool', poolId, result.oldParams, result.newParams);

      const response: ApiResponse<typeof result> = { data: result };
      return reply.status(200).send(response);
    },
  );

  // POST /admin/pools/:poolId/pause
  fastify.post(
    '/admin/pools/:poolId/pause',
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      const { poolId } = request.params as { poolId: string };
      const pool = poolService.pausePool(poolId);
      if (!pool) throw new AppError('NOT_FOUND', 'Pool not found', 404);

      await logAdminAction(request, 'pool.pause', 'pool', poolId, { status: 'active' }, { status: 'paused' });

      const response: ApiResponse<typeof pool> = { data: pool };
      return reply.status(200).send(response);
    },
  );

  // POST /admin/pools/:poolId/resume
  fastify.post(
    '/admin/pools/:poolId/resume',
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      const { poolId } = request.params as { poolId: string };
      const pool = poolService.resumePool(poolId);
      if (!pool) throw new AppError('NOT_FOUND', 'Pool not found', 404);

      await logAdminAction(request, 'pool.resume', 'pool', poolId, { status: 'paused' }, { status: 'active' });

      const response: ApiResponse<typeof pool> = { data: pool };
      return reply.status(200).send(response);
    },
  );

  // POST /admin/pools/:poolId/archive
  fastify.post(
    '/admin/pools/:poolId/archive',
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      const { poolId } = request.params as { poolId: string };
      const pool = poolService.archivePool(poolId);
      if (!pool) throw new AppError('NOT_FOUND', 'Pool not found', 404);

      await logAdminAction(request, 'pool.archive', 'pool', poolId, { status: 'active' }, { status: 'archived' });

      const response: ApiResponse<typeof pool> = { data: pool };
      return reply.status(200).send(response);
    },
  );

  // GET /admin/pools/:poolId/positions
  fastify.get(
    '/admin/pools/:poolId/positions',
    { preHandler: [requireAdminViewer] },
    async (request, reply) => {
      const { poolId } = request.params as { poolId: string };
      const pool = poolService.getPoolById(poolId);
      if (!pool) throw new AppError('NOT_FOUND', 'Pool not found', 404);

      const query = request.query as Record<string, string>;
      const { page, limit } = paginationSchema.parse(query);
      const result = poolService.getPoolPositions(poolId, { page, limit });

      const response: ApiResponse<typeof result> = { data: result };
      return reply.status(200).send(response);
    },
  );

  // GET /admin/pools/:poolId/history
  fastify.get(
    '/admin/pools/:poolId/history',
    { preHandler: [requireAdminViewer] },
    async (request, reply) => {
      const { poolId } = request.params as { poolId: string };
      const pool = poolService.getPoolById(poolId);
      if (!pool) throw new AppError('NOT_FOUND', 'Pool not found', 404);

      const query = request.query as Record<string, string>;
      const { page, limit } = paginationSchema.parse(query);
      const result = poolService.getPoolHistory(poolId, { page, limit });

      const response: ApiResponse<typeof result> = { data: result };
      return reply.status(200).send(response);
    },
  );
}
