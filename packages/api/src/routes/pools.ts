import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { ApiResponse, ListPoolsParams, PoolListItem, PoolDetail, PoolHistoryPoint, DepositResponse, WithdrawResponse, InterestRateModelConfig } from '@dualis/shared';
import { calculatePoolAPY } from '@dualis/shared';
import type { ApiErrorCode } from '@dualis/shared';
import { AppError } from '../middleware/errorHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import * as poolService from '../services/pool.service.js';
import { mapCantonError } from '../canton/error-mapper.js';

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

const routingModeSchema = z.enum(['proxy', 'wallet-sign', 'auto']).optional();

const depositSchema = z.object({
  amount: z.string().min(1),
  routingMode: routingModeSchema,
  walletParty: z.string().optional(),
  walletTransferConfirmed: z.boolean().optional(),
  walletTxHash: z.string().optional(),
});

const withdrawSchema = z.object({
  shares: z.string().min(1),
  routingMode: routingModeSchema,
  walletParty: z.string().optional(),
  walletTransferConfirmed: z.boolean().optional(),
  walletTxHash: z.string().optional(),
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

      const partyId = parsed.data.walletParty || request.user!.partyId;
      const userId = request.user?.userId;

      try {
        const result = await poolService.deposit(poolId, partyId, parsed.data.amount, userId, parsed.data.routingMode, parsed.data.walletParty, parsed.data.walletTransferConfirmed, parsed.data.walletTxHash);

        // If the service returns a wallet-sign result, send it directly
        if ('requiresWalletSign' in result) {
          return reply.status(200).send({ data: result });
        }

        const response: ApiResponse<DepositResponse> = {
          data: result.data,
          transaction: result.transaction,
        };
        return reply.status(201).send(response);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('not found') && !msg.includes('ENOTFOUND')) {
          throw new AppError('POOL_NOT_FOUND', `Pool ${poolId} not found`, 404);
        }
        if (msg.includes('Insufficient') && msg.includes('balance')) {
          throw new AppError('INSUFFICIENT_BALANCE' as ApiErrorCode, msg, 400);
        }
        const mapped = mapCantonError(err);
        throw new AppError(mapped.code as ApiErrorCode, mapped.userMessage, mapped.httpStatus);
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

      const partyId = parsed.data.walletParty || request.user!.partyId;
      const userId = request.user?.userId;

      try {
        const result = await poolService.withdraw(poolId, partyId, parsed.data.shares, userId, parsed.data.routingMode, parsed.data.walletParty, parsed.data.walletTransferConfirmed, parsed.data.walletTxHash);

        // If the service returns a wallet-sign result, send it directly
        if ('requiresWalletSign' in result) {
          return reply.status(200).send({ data: result });
        }

        const response: ApiResponse<WithdrawResponse> = {
          data: result.data,
          transaction: result.transaction,
        };
        return reply.status(200).send(response);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('not found') && !msg.includes('ENOTFOUND')) {
          throw new AppError('POOL_NOT_FOUND', `Pool ${poolId} not found`, 404);
        }
        if (msg.includes('Insufficient liquidity')) {
          throw new AppError('INSUFFICIENT_BALANCE', msg, 400);
        }
        const mapped = mapCantonError(err);
        throw new AppError(mapped.code as ApiErrorCode, mapped.userMessage, mapped.httpStatus);
      }
    }
  );

  // GET /pools/:poolId/rate-curve — Interest rate curve data points
  fastify.get(
    '/pools/:poolId/rate-curve',
    async (
      request: FastifyRequest<{ Params: { poolId: string } }>,
      reply
    ) => {
      const { poolId } = request.params;

      try {
        const detail = poolService.getPoolDetail(poolId);
        const model = detail.interestRateModel;
        const rateModelConfig: InterestRateModelConfig = {
          type: 'VariableRate',
          baseRate: model.baseRate,
          multiplier: model.multiplier,
          kink: model.kink,
          jumpMultiplier: model.jumpMultiplier,
          reserveFactor: 0.1, // default 10% protocol reserve
        };

        // Generate rate curve: utilization 0-100% in 1% steps
        const points: Array<{
          utilization: number;
          supplyAPY: number;
          borrowAPY: number;
        }> = [];

        for (let u = 0; u <= 100; u++) {
          const utilization = u / 100;
          const supplyAPY = calculatePoolAPY(rateModelConfig, utilization, 'supply');
          const borrowAPY = calculatePoolAPY(rateModelConfig, utilization, 'borrow');

          points.push({
            utilization: Number(utilization.toFixed(2)),
            supplyAPY: Number(supplyAPY.toFixed(6)),
            borrowAPY: Number(borrowAPY.toFixed(6)),
          });
        }

        const response: ApiResponse<{
          poolId: string;
          model: typeof model;
          currentUtilization: number;
          curve: typeof points;
        }> = {
          data: {
            poolId,
            model,
            currentUtilization: detail.utilization,
            curve: points,
          },
        };

        return reply.status(200).send(response);
      } catch {
        throw new AppError('POOL_NOT_FOUND', `Pool ${poolId} not found`, 404);
      }
    }
  );

  // POST /pools/:poolId/supply (auth) — Supply assets to pool
  fastify.post(
    '/pools/:poolId/supply',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { poolId } = request.params as { poolId: string };
      const parsed = depositSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid supply request', 400, parsed.error.flatten());
      }

      const partyId = parsed.data.walletParty || request.user!.partyId;
      const userId = request.user?.userId;

      try {
        const result = await poolService.deposit(poolId, partyId, parsed.data.amount, userId, parsed.data.routingMode, parsed.data.walletParty, parsed.data.walletTransferConfirmed, parsed.data.walletTxHash);

        if ('requiresWalletSign' in result) {
          return reply.status(200).send({ data: result });
        }

        const response: ApiResponse<DepositResponse> = {
          data: result.data,
          transaction: result.transaction,
        };
        return reply.status(201).send(response);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('not found')) {
          throw new AppError('POOL_NOT_FOUND', `Pool ${poolId} not found`, 404);
        }
        throw new AppError('CANTON_ERROR', msg, 502);
      }
    }
  );
}
