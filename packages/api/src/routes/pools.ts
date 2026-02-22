import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { ApiResponse, ListPoolsParams, PoolListItem, PoolDetail, PoolHistoryPoint, DepositResponse, WithdrawResponse } from '@dualis/shared';
import { AppError } from '../middleware/errorHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import * as poolService from '../services/pool.service.js';

const listPoolsSchema = z.object({
  assetType: z.enum(['stablecoin', 'crypto', 'treasury', 'rwa', 'all']).optional(),
  sortBy: z.enum(['tvl', 'supplyApy', 'borrowApy', 'utilization']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const poolHistorySchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y', 'all']).optional(),
});

const depositSchema = z.object({
  amount: z.string().min(1),
});

const withdrawSchema = z.object({
  shares: z.string().min(1),
});

export async function poolRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /pools
  fastify.get('/pools', async (request, reply) => {
    const parsed = listPoolsSchema.safeParse(request.query);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid query parameters', 400, parsed.error.flatten());
    }

    const params = parsed.data as ListPoolsParams;
    const result = poolService.listPools(params);
    const response: ApiResponse<PoolListItem[]> = {
      data: result.data,
      pagination: result.pagination,
    };

    return reply.status(200).send(response);
  });

  // GET /pools/:poolId
  fastify.get(
    '/pools/:poolId',
    async (
      request: FastifyRequest<{ Params: { poolId: string } }>,
      reply
    ) => {
      const { poolId } = request.params;

      try {
        const detail = poolService.getPoolDetail(poolId);
        const response: ApiResponse<PoolDetail> = { data: detail };
        return reply.status(200).send(response);
      } catch {
        throw new AppError('POOL_NOT_FOUND', `Pool ${poolId} not found`, 404);
      }
    }
  );

  // GET /pools/:poolId/history
  fastify.get(
    '/pools/:poolId/history',
    async (
      request: FastifyRequest<{ Params: { poolId: string } }>,
      reply
    ) => {
      const { poolId } = request.params;
      const parsed = poolHistorySchema.safeParse(request.query);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid query parameters', 400, parsed.error.flatten());
      }

      try {
        const history = poolService.getPoolHistory(poolId, parsed.data.period ?? '30d');
        const response: ApiResponse<PoolHistoryPoint[]> = { data: history };
        return reply.status(200).send(response);
      } catch {
        throw new AppError('POOL_NOT_FOUND', `Pool ${poolId} not found`, 404);
      }
    }
  );

  // POST /pools/:poolId/deposit (auth)
  fastify.post(
    '/pools/:poolId/deposit',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { poolId } = request.params as { poolId: string };
      const parsed = depositSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid deposit request', 400, parsed.error.flatten());
      }

      const partyId = (request as FastifyRequest & { partyId: string }).partyId;

      try {
        const result = poolService.deposit(poolId, partyId, parsed.data.amount);
        const response: ApiResponse<DepositResponse> = {
          data: result.data,
          transaction: result.transaction,
        };
        return reply.status(201).send(response);
      } catch {
        throw new AppError('POOL_NOT_FOUND', `Pool ${poolId} not found`, 404);
      }
    }
  );

  // POST /pools/:poolId/withdraw (auth)
  fastify.post(
    '/pools/:poolId/withdraw',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { poolId } = request.params as { poolId: string };
      const parsed = withdrawSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid withdraw request', 400, parsed.error.flatten());
      }

      const partyId = (request as FastifyRequest & { partyId: string }).partyId;

      try {
        const result = poolService.withdraw(poolId, partyId, parsed.data.shares);
        const response: ApiResponse<WithdrawResponse> = {
          data: result.data,
          transaction: result.transaction,
        };
        return reply.status(200).send(response);
      } catch {
        throw new AppError('POOL_NOT_FOUND', `Pool ${poolId} not found`, 404);
      }
    }
  );
}
