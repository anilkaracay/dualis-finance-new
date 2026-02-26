import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import * as userBalanceService from '../services/userBalance.service.js';

export async function userBalanceRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /user/balances — full balance summary (auth required)
  fastify.get(
    '/user/balances',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = request.user!.partyId;
      const balances = await userBalanceService.getUserBalances(partyId);
      return reply.status(200).send({ data: balances });
    },
  );

  // GET /user/supply-positions — supply positions only (auth required)
  fastify.get(
    '/user/supply-positions',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = request.user!.partyId;
      const positions = await userBalanceService.getUserSupplyPositions(partyId);
      return reply.status(200).send({ data: positions });
    },
  );

  // GET /user/borrow-positions — borrow positions only (auth required)
  fastify.get(
    '/user/borrow-positions',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = request.user!.partyId;
      const positions = await userBalanceService.getUserBorrowPositions(partyId);
      return reply.status(200).send({ data: positions });
    },
  );
}
