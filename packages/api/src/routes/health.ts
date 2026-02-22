import type { FastifyInstance } from 'fastify';
import type { HealthResponse } from '@dualis/shared';
import { env } from '../config/env.js';
import { createChildLogger } from '../config/logger.js';

const log = createChildLogger('health-routes');

const startTime = Date.now();

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/health', async (_request, reply) => {
    log.debug('Health check requested');

    const cantonStatus = env.CANTON_MOCK ? 'connected' : 'disconnected';

    const response: HealthResponse = {
      status: 'healthy',
      version: '1.0.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      canton: cantonStatus,
      database: 'connected',
      redis: 'connected',
    };

    // Determine overall status
    if (cantonStatus === 'disconnected') {
      response.status = 'degraded';
    }

    return reply.status(200).send({ data: response });
  });

  fastify.get('/ready', async (_request, reply) => {
    log.debug('Readiness check requested');

    const isReady = env.CANTON_MOCK || true; // In mock mode, always ready

    if (!isReady) {
      return reply.status(503).send({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Service is not ready',
          requestId: String((_request as { id: string }).id ?? 'unknown'),
          timestamp: new Date().toISOString(),
        },
      });
    }

    return reply.status(200).send({ ready: true });
  });

  fastify.get('/live', async (_request, reply) => {
    return reply.status(200).send({ live: true });
  });
}
