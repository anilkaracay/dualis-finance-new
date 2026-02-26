import type { FastifyInstance } from 'fastify';
import type { ApiResponse } from '@dualis/shared';
import { authMiddleware } from '../middleware/auth.js';
import * as registry from '../services/poolRegistry.js';

interface SupplyPositionResponse {
  positionId: string;
  poolId: string;
  asset: { symbol: string; type: string };
  depositedAmount: number;
  shares: number;
  currentValueUSD: number;
  apy: number;
  depositTimestamp: string | null;
}

export async function supplyRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /supply/positions (auth) — user's supply positions
  fastify.get(
    '/supply/positions',
    { preHandler: [authMiddleware] },
    async (_request, reply) => {
      // Query pool registry for active pools and return positions.
      // Real Canton SupplyPosition query will be wired when Canton is live.
      const pools = registry.getAllPools();

      const positions: SupplyPositionResponse[] = pools
        .filter((p) => p.isActive)
        .map((pool) => ({
          positionId: `supply-${pool.poolId}`,
          poolId: pool.poolId,
          asset: { symbol: pool.asset.symbol, type: pool.asset.type },
          depositedAmount: 0,
          shares: 0,
          currentValueUSD: 0,
          apy: 0,
          depositTimestamp: null,
        }));

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

      const response: ApiResponse<SupplyPositionResponse[]> = {
        data: [],
      };

      return reply.status(200).send(response);
    }
  );
}
