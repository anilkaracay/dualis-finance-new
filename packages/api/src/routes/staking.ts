import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { ApiResponse, StakingInfo, StakingPositionResponse } from '@dualis/shared';
import { AppError } from '../middleware/errorHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import * as stakingService from '../services/staking.service.js';

const stakeSchema = z.object({
  amount: z.string().min(1),
  safetyModule: z.boolean(),
});

const unstakeSchema = z.object({
  amount: z.string().min(1),
});

export async function stakingRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /staking/info
  fastify.get('/staking/info', async (_request, reply) => {
    const info = stakingService.getInfo();

    const response: ApiResponse<StakingInfo> = {
      data: info,
    };

    return reply.status(200).send(response);
  });

  // GET /staking/position (auth)
  fastify.get(
    '/staking/position',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = (request as FastifyRequest & { partyId: string }).partyId;
      const position = stakingService.getPosition(partyId);

      const response: ApiResponse<StakingPositionResponse> = {
        data: position,
      };

      return reply.status(200).send(response);
    }
  );

  // POST /staking/stake (auth)
  fastify.post(
    '/staking/stake',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = stakeSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid stake request', 400, parsed.error.flatten());
      }

      const partyId = (request as FastifyRequest & { partyId: string }).partyId;
      const result = stakingService.stake(partyId, parsed.data);

      const response: ApiResponse<StakingPositionResponse> = {
        data: result.data,
        transaction: result.transaction,
      };

      return reply.status(200).send(response);
    }
  );

  // POST /staking/unstake (auth)
  fastify.post(
    '/staking/unstake',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = unstakeSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid unstake request', 400, parsed.error.flatten());
      }

      const partyId = (request as FastifyRequest & { partyId: string }).partyId;
      const result = stakingService.unstake(partyId, parsed.data);

      const response: ApiResponse<StakingPositionResponse> = {
        data: result.data,
        transaction: result.transaction,
      };

      return reply.status(200).send(response);
    }
  );

  // POST /staking/claim (auth)
  fastify.post(
    '/staking/claim',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = (request as FastifyRequest & { partyId: string }).partyId;
      const result = stakingService.claim(partyId);

      const response: ApiResponse<{ claimedAmount: number }> = {
        data: result.data,
        transaction: result.transaction,
      };

      return reply.status(200).send(response);
    }
  );
}
