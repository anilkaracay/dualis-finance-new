// ============================================================================
// Oracle Routes — Price Feed API Endpoints
// ============================================================================

import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { ApiResponse, OraclePriceItem, OraclePriceWithHistory } from '@dualis/shared';
import { AppError } from '../middleware/errorHandler.js';
import * as oracleService from '../services/oracle.service.js';
import {
  getOracleStatus,
  getAssetTWAP,
  getOracleAlerts,
  getSourceStatuses,
} from '../oracle/oracle.service.js';
import { resetCircuitBreaker } from '../oracle/circuit-breaker.js';
import { updateManualPrice } from '../oracle/sources/manual.js';

const oraclePriceParamsSchema = z.object({
  history: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  period: z.enum(['1h', '24h', '7d', '30d']).optional(),
});

export async function oracleRoutes(fastify: FastifyInstance): Promise<void> {
  // ─── GET /oracle/prices ──────────────────────────────────────────────
  fastify.get('/oracle/prices', async (_request, reply) => {
    const prices = oracleService.getAllPrices();

    const response: ApiResponse<OraclePriceItem[]> = {
      data: prices,
    };

    return reply.status(200).send(response);
  });

  // ─── GET /oracle/prices/:asset ───────────────────────────────────────
  fastify.get(
    '/oracle/prices/:asset',
    async (
      request: FastifyRequest<{ Params: { asset: string } }>,
      reply,
    ) => {
      const { asset } = request.params;
      const parsed = oraclePriceParamsSchema.safeParse(request.query);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid query parameters', 400, parsed.error.flatten());
      }

      try {
        const result = oracleService.getAssetPrice(asset, {
          ...(parsed.data.history != null ? { history: parsed.data.history } : {}),
          ...(parsed.data.period != null ? { period: parsed.data.period } : {}),
        });

        const response: ApiResponse<OraclePriceItem | OraclePriceWithHistory> = {
          data: result,
        };

        return reply.status(200).send(response);
      } catch {
        throw new AppError('NOT_FOUND', `Asset ${asset} not found`, 404);
      }
    },
  );

  // ─── GET /oracle/status ──────────────────────────────────────────────
  fastify.get('/oracle/status', async (_request, reply) => {
    const status = getOracleStatus();

    return reply.status(200).send({
      data: {
        isHealthy: status.isHealthy,
        lastCycleTs: status.lastCycleTs,
        lastCycleDurationMs: status.lastCycleDurationMs,
        sourceStatuses: status.sourceStatuses,
        assetCount: status.aggregatedPrices.length,
        circuitBreakers: status.circuitBreakers.filter((cb) => cb.isTripped),
      },
    });
  });

  // ─── GET /oracle/twap/:asset ─────────────────────────────────────────
  fastify.get(
    '/oracle/twap/:asset',
    async (
      request: FastifyRequest<{ Params: { asset: string } }>,
      reply,
    ) => {
      const { asset } = request.params;
      const twap = getAssetTWAP(asset);

      if (!twap) {
        throw new AppError('NOT_FOUND', `TWAP data not available for ${asset}`, 404);
      }

      return reply.status(200).send({
        data: { asset, ...twap },
      });
    },
  );

  // ─── GET /oracle/alerts ──────────────────────────────────────────────
  fastify.get('/oracle/alerts', async (_request, reply) => {
    const alerts = getOracleAlerts();

    return reply.status(200).send({
      data: alerts,
    });
  });

  // ─── GET /oracle/sources ─────────────────────────────────────────────
  fastify.get('/oracle/sources', async (_request, reply) => {
    const sources = getSourceStatuses();

    return reply.status(200).send({
      data: sources,
    });
  });

  // ─── POST /oracle/manual/:asset ──────────────────────────────────────
  // Admin-only: update a manual NAV price for RWA assets
  fastify.post(
    '/oracle/manual/:asset',
    async (
      request: FastifyRequest<{ Params: { asset: string } }>,
      reply,
    ) => {
      const { asset } = request.params;
      const bodySchema = z.object({ price: z.number().positive() });
      const parsed = bodySchema.safeParse(request.body);

      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid body: price must be a positive number', 400);
      }

      updateManualPrice(asset, parsed.data.price);

      return reply.status(200).send({
        data: { asset, price: parsed.data.price, updatedAt: new Date().toISOString() },
      });
    },
  );

  // ─── POST /oracle/circuit-breaker/:asset/reset ───────────────────────
  // Admin-only: manually reset a tripped circuit breaker
  fastify.post(
    '/oracle/circuit-breaker/:asset/reset',
    async (
      request: FastifyRequest<{ Params: { asset: string } }>,
      reply,
    ) => {
      const { asset } = request.params;

      resetCircuitBreaker(asset);

      return reply.status(200).send({
        data: { asset, message: `Circuit breaker reset for ${asset}` },
      });
    },
  );
}
