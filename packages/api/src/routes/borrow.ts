import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { ApiResponse, BorrowResponse, BorrowPositionItem, RepayResponse, AddCollateralResponse } from '@dualis/shared';
import { AppError } from '../middleware/errorHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import * as borrowService from '../services/borrow.service.js';

const borrowRequestSchema = z.object({
  lendingPoolId: z.string().min(1),
  borrowAmount: z.string().min(1),
  collateralAssets: z.array(
    z.object({
      symbol: z.string().min(1),
      amount: z.string().min(1),
    })
  ).min(1),
});

const repaySchema = z.object({
  amount: z.string().min(1),
});

const addCollateralSchema = z.object({
  asset: z.object({
    symbol: z.string().min(1),
    amount: z.string().min(1),
  }),
});

export async function borrowRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /borrow/request (auth)
  fastify.post(
    '/borrow/request',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = borrowRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid borrow request', 400, parsed.error.flatten());
      }

      const partyId = (request as FastifyRequest & { partyId: string }).partyId;
      const result = borrowService.requestBorrow(partyId, parsed.data);

      const response: ApiResponse<BorrowResponse> = {
        data: result.data,
        transaction: result.transaction,
      };

      return reply.status(201).send(response);
    }
  );

  // GET /borrow/positions (auth)
  fastify.get(
    '/borrow/positions',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = (request as FastifyRequest & { partyId: string }).partyId;
      const positions = borrowService.getPositions(partyId);

      const response: ApiResponse<BorrowPositionItem[]> = {
        data: positions,
      };

      return reply.status(200).send(response);
    }
  );

  // POST /borrow/positions/:positionId/repay (auth)
  fastify.post(
    '/borrow/positions/:positionId/repay',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { positionId } = request.params as { positionId: string };
      const parsed = repaySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid repay request', 400, parsed.error.flatten());
      }

      const partyId = (request as FastifyRequest & { partyId: string }).partyId;

      try {
        const result = borrowService.repay(partyId, positionId, parsed.data.amount);
        const response: ApiResponse<RepayResponse> = {
          data: result.data,
          transaction: result.transaction,
        };
        return reply.status(200).send(response);
      } catch {
        throw new AppError('POSITION_NOT_FOUND', `Position ${positionId} not found`, 404);
      }
    }
  );

  // POST /borrow/positions/:positionId/add-collateral (auth)
  fastify.post(
    '/borrow/positions/:positionId/add-collateral',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { positionId } = request.params as { positionId: string };
      const parsed = addCollateralSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid add collateral request', 400, parsed.error.flatten());
      }

      const partyId = (request as FastifyRequest & { partyId: string }).partyId;

      try {
        const result = borrowService.addCollateral(partyId, positionId, parsed.data.asset);
        const response: ApiResponse<AddCollateralResponse> = {
          data: result.data,
          transaction: result.transaction,
        };
        return reply.status(200).send(response);
      } catch {
        throw new AppError('POSITION_NOT_FOUND', `Position ${positionId} not found`, 404);
      }
    }
  );
}
