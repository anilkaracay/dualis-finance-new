import type { FastifyInstance } from 'fastify';
import type { ApiResponse } from '@dualis/shared';
import { calculatePoolAPY } from '@dualis/shared';
import { authMiddleware } from '../middleware/auth.js';
import * as userBalanceService from '../services/userBalance.service.js';
import * as registry from '../services/poolRegistry.js';

interface SupplyPositionResponse {
  positionId: string;
  poolId: string;
  symbol: string;
  asset: { symbol: string; type: string };
  depositedAmount: number;
  shares: number;
  currentBalance: number;
  currentValueUSD: number;
  interestEarned: number;
  apy: number;
  depositTimestamp: string | null;
}

export async function supplyRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /supply/positions (auth) — user's supply positions from Canton
  fastify.get(
    '/supply/positions',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = request.user!.partyId;

      // Query real Canton supply positions via userBalance service
      const cantonPositions = await userBalanceService.getUserSupplyPositions(partyId);

      // Aggregate positions by (symbol, poolId) — one row per asset+pool
      const aggregated = new Map<string, SupplyPositionResponse>();
      for (const pos of cantonPositions) {
        const key = `${pos.asset.symbol}::${pos.poolId}`;
        const pool = registry.getPool(pos.poolId);
        let supplyAPY = 0;
        if (pool) {
          const utilization = pool.totalSupply > 0 ? pool.totalBorrow / pool.totalSupply : 0;
          const model = registry.getPoolRateModel(pos.poolId);
          supplyAPY = calculatePoolAPY(model, utilization, 'supply');
        }

        const existing = aggregated.get(key);
        if (existing) {
          existing.depositedAmount += pos.principal;
          existing.shares += pos.principal;
          existing.currentBalance += pos.currentBalance;
          existing.currentValueUSD += pos.currentBalance * pos.asset.priceUSD;
          existing.interestEarned += pos.interestEarned;
        } else {
          aggregated.set(key, {
            positionId: key, // composite key for aggregated row
            poolId: pos.poolId,
            symbol: pos.asset.symbol,
            asset: { symbol: pos.asset.symbol, type: pool?.asset?.type ?? 'CryptoCurrency' },
            depositedAmount: pos.principal,
            shares: pos.principal,
            currentBalance: pos.currentBalance,
            currentValueUSD: pos.currentBalance * pos.asset.priceUSD,
            interestEarned: pos.interestEarned,
            apy: supplyAPY,
            depositTimestamp: pos.depositTimestamp,
          });
        }
      }

      const positions = Array.from(aggregated.values());

      const response: ApiResponse<SupplyPositionResponse[]> = {
        data: positions,
      };

      return reply.status(200).send(response);
    }
  );

  // GET /supply/positions/:poolId (auth) — positions for a specific pool
  fastify.get(
    '/supply/positions/:poolId',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { poolId } = request.params as { poolId: string };
      const pool = registry.getPool(poolId);

      if (!pool) {
        return reply.status(404).send({
          error: { code: 'POOL_NOT_FOUND', message: `Pool ${poolId} not found` },
        });
      }

      const partyId = request.user!.partyId;
      const allPositions = await userBalanceService.getUserSupplyPositions(partyId);
      const poolPositions = allPositions.filter((p) => p.poolId === poolId);

      const utilization = pool.totalSupply > 0 ? pool.totalBorrow / pool.totalSupply : 0;
      const model = registry.getPoolRateModel(poolId);
      const supplyAPY = calculatePoolAPY(model, utilization, 'supply');

      // Aggregate positions by symbol — one row per asset within this pool
      const aggregated = new Map<string, SupplyPositionResponse>();
      for (const pos of poolPositions) {
        const key = pos.asset.symbol;
        const existing = aggregated.get(key);
        if (existing) {
          existing.depositedAmount += pos.principal;
          existing.shares += pos.principal;
          existing.currentBalance += pos.currentBalance;
          existing.currentValueUSD += pos.currentBalance * pos.asset.priceUSD;
          existing.interestEarned += pos.interestEarned;
        } else {
          aggregated.set(key, {
            positionId: `${pos.asset.symbol}::${pos.poolId}`,
            poolId: pos.poolId,
            symbol: pos.asset.symbol,
            asset: { symbol: pos.asset.symbol, type: pool.asset.type },
            depositedAmount: pos.principal,
            shares: pos.principal,
            currentBalance: pos.currentBalance,
            currentValueUSD: pos.currentBalance * pos.asset.priceUSD,
            interestEarned: pos.interestEarned,
            apy: supplyAPY,
            depositTimestamp: pos.depositTimestamp,
          });
        }
      }

      const positions = Array.from(aggregated.values());

      const response: ApiResponse<SupplyPositionResponse[]> = {
        data: positions,
      };

      return reply.status(200).send(response);
    }
  );
}
