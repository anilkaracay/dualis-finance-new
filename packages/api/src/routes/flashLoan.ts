import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { ApiResponse, FlashLoanResponse } from '@dualis/shared';
import { AppError } from '../middleware/errorHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import * as flashLoanService from '../services/flashLoan.service.js';

const flashLoanSchema = z.object({
  poolId: z.string().min(1),
  amount: z.string().min(1),
  callbackData: z.object({
    operations: z.array(
      z.object({
        type: z.string().min(1),
      }).passthrough()
    ).min(1),
  }),
});

export async function flashLoanRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /flash-loan/execute (auth)
  fastify.post(
    '/flash-loan/execute',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = flashLoanSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid flash loan request', 400, parsed.error.flatten());
      }

      const partyId = (request as FastifyRequest & { partyId: string }).partyId;
      const result = flashLoanService.execute(partyId, parsed.data);

      const response: ApiResponse<FlashLoanResponse> = {
        data: result.data,
        transaction: result.transaction,
      };

      return reply.status(200).send(response);
    }
  );
}
