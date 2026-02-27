import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import * as userBalanceService from '../services/userBalance.service.js';
import * as tokenBalanceService from '../services/tokenBalance.service.js';

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

  // ── Token Balances (wallet-level holdings, separate from protocol positions) ──

  // GET /user/token-balances — all wallet token balances (auth required)
  fastify.get(
    '/user/token-balances',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = request.user!.partyId;
      const balances = await tokenBalanceService.getWalletTokenBalances(partyId);
      return reply.status(200).send({ data: balances });
    },
  );

  // GET /user/token-balances/:symbol — single asset balance (auth required)
  fastify.get(
    '/user/token-balances/:symbol',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = request.user!.partyId;
      const { symbol } = request.params as { symbol: string };
      const amount = await tokenBalanceService.getWalletTokenBalance(partyId, symbol);
      return reply.status(200).send({ data: { symbol, amount } });
    },
  );

  // POST /user/faucet — seed demo token balances (devnet only, auth required)
  fastify.post(
    '/user/faucet',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = request.user!.partyId;
      await tokenBalanceService.ensureInitialBalances(partyId);
      const balances = await tokenBalanceService.getWalletTokenBalances(partyId);
      return reply.status(200).send({ data: balances });
    },
  );
}
