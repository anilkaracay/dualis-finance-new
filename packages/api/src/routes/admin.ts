import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { ApiResponse, UpdateConfigRequest } from '@dualis/shared';
import { AppError } from '../middleware/errorHandler.js';
import { operatorMiddleware } from '../middleware/auth.js';
import { createChildLogger } from '../config/logger.js';
import { notificationBus } from '../notification/notification.bus.js';

const log = createChildLogger('admin-routes');

const updateConfigSchema = z.object({
  collateralConfigs: z
    .array(z.record(z.string(), z.unknown()))
    .optional(),
  protocolFeeRate: z.number().min(0).max(1).optional(),
  flashLoanFeeRate: z.number().min(0).max(1).optional(),
  minCollateralRatio: z.number().min(1).optional(),
});

interface ProtocolStatus {
  paused: boolean;
  pausedAt: string | null;
  pausedBy: string | null;
  resumedAt: string | null;
}

interface ProtocolConfigState {
  protocolFeeRate: number;
  flashLoanFeeRate: number;
  minCollateralRatio: number;
  collateralConfigs: Array<Record<string, unknown>>;
  updatedAt: string;
  updatedBy: string;
}

const protocolStatus: ProtocolStatus = {
  paused: false,
  pausedAt: null,
  pausedBy: null,
  resumedAt: null,
};

const protocolConfig: ProtocolConfigState = {
  protocolFeeRate: 0.001,
  flashLoanFeeRate: 0.0009,
  minCollateralRatio: 1.1,
  collateralConfigs: [],
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
};

export async function adminRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /admin/pause (operator auth)
  fastify.post(
    '/admin/pause',
    { preHandler: [operatorMiddleware] },
    async (request, reply) => {
      const partyId = (request as FastifyRequest & { partyId: string }).partyId;

      if (protocolStatus.paused) {
        throw new AppError('VALIDATION_ERROR', 'Protocol is already paused', 400);
      }

      log.warn({ operator: partyId }, 'Protocol paused by operator');

      protocolStatus.paused = true;
      protocolStatus.pausedAt = new Date().toISOString();
      protocolStatus.pausedBy = partyId;

      // MP20: Broadcast protocol pause to all users
      notificationBus.emitBroadcast({
        type: 'PROTOCOL_PAUSED',
        category: 'system',
        severity: 'critical',
        title: 'Protocol Paused',
        message: 'The Dualis protocol has been paused by an operator. No new transactions will be processed until the protocol is resumed.',
        data: { pausedBy: partyId, pausedAt: protocolStatus.pausedAt },
        deduplicationKey: `protocol-paused:${protocolStatus.pausedAt}`,
      }).catch((err) => log.warn({ err }, 'Protocol pause broadcast failed'));

      const response: ApiResponse<ProtocolStatus> = {
        data: { ...protocolStatus },
      };

      return reply.status(200).send(response);
    }
  );

  // POST /admin/resume (operator auth)
  fastify.post(
    '/admin/resume',
    { preHandler: [operatorMiddleware] },
    async (request, reply) => {
      const partyId = (request as FastifyRequest & { partyId: string }).partyId;

      if (!protocolStatus.paused) {
        throw new AppError('VALIDATION_ERROR', 'Protocol is not paused', 400);
      }

      log.warn({ operator: partyId }, 'Protocol resumed by operator');

      protocolStatus.paused = false;
      protocolStatus.resumedAt = new Date().toISOString();

      // MP20: Broadcast protocol resume to all users
      notificationBus.emitBroadcast({
        type: 'PROTOCOL_RESUMED',
        category: 'system',
        severity: 'info',
        title: 'Protocol Resumed',
        message: 'The Dualis protocol has been resumed. Normal operations have been restored.',
        data: { resumedBy: partyId, resumedAt: protocolStatus.resumedAt },
        deduplicationKey: `protocol-resumed:${protocolStatus.resumedAt}`,
      }).catch((err) => log.warn({ err }, 'Protocol resume broadcast failed'));

      const response: ApiResponse<ProtocolStatus> = {
        data: { ...protocolStatus },
      };

      return reply.status(200).send(response);
    }
  );

  // PUT /admin/config (operator auth)
  fastify.put(
    '/admin/config',
    { preHandler: [operatorMiddleware] },
    async (request, reply) => {
      const parsed = updateConfigSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid config update', 400, parsed.error.flatten());
      }

      const partyId = (request as FastifyRequest & { partyId: string }).partyId;
      const updates = parsed.data as UpdateConfigRequest;

      log.info({ operator: partyId, updates }, 'Protocol config updated');

      if (updates.protocolFeeRate !== undefined) {
        protocolConfig.protocolFeeRate = updates.protocolFeeRate;
      }
      if (updates.flashLoanFeeRate !== undefined) {
        protocolConfig.flashLoanFeeRate = updates.flashLoanFeeRate;
      }
      if (updates.minCollateralRatio !== undefined) {
        protocolConfig.minCollateralRatio = updates.minCollateralRatio;
      }
      if (updates.collateralConfigs !== undefined) {
        protocolConfig.collateralConfigs = updates.collateralConfigs;
      }
      protocolConfig.updatedAt = new Date().toISOString();
      protocolConfig.updatedBy = partyId;

      const response: ApiResponse<ProtocolConfigState> = {
        data: { ...protocolConfig },
      };

      return reply.status(200).send(response);
    }
  );
}
