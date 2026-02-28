import type { FastifyInstance } from 'fastify';
import type { ApiResponse } from '@dualis/shared';
import { cantonConfig } from '../config/canton-env.js';

export async function configRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /config/operator — returns operator party for wallet transfers (no auth)
  fastify.get('/config/operator', async (_request, reply) => {
    const { operator } = cantonConfig().parties;
    const response: ApiResponse<{ operatorParty: string }> = {
      data: { operatorParty: operator },
    };
    return reply.status(200).send(response);
  });
}
