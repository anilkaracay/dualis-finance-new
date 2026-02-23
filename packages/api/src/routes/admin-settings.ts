import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ApiResponse } from '@dualis/shared';
import { requireAdmin, requireAdminViewer, logAdminAction } from '../middleware/admin-auth.js';
import { AppError } from '../middleware/errorHandler.js';

// ---------------------------------------------------------------------------
// Mock config state
// ---------------------------------------------------------------------------

const MOCK_CONFIG = {
  protocolFeeRate: 0.001,
  liquidationIncentiveRate: 0.05,
  flashLoanFeeRate: 0.0009,
  minBorrowAmount: 100,
  maxBorrowAmount: 10_000_000,
  isPaused: false,
  pausedAt: null as string | null,
  pausedBy: null as string | null,
  pauseReason: null as string | null,
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
};

const MOCK_FEATURE_FLAGS = {
  flashLoans: true,
  secLending: true,
  governance: true,
  productiveLending: false,
};

const configUpdateSchema = z.object({
  protocolFeeRate: z.number().min(0).max(0.1).optional(),
  liquidationIncentiveRate: z.number().min(0).max(0.5).optional(),
  flashLoanFeeRate: z.number().min(0).max(0.1).optional(),
  minBorrowAmount: z.number().min(0).optional(),
  maxBorrowAmount: z.number().min(0).optional(),
});

const featureFlagSchema = z.object({
  flashLoans: z.boolean().optional(),
  secLending: z.boolean().optional(),
  governance: z.boolean().optional(),
  productiveLending: z.boolean().optional(),
});

export async function adminSettingsRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /admin/settings/config — current protocol config
  fastify.get(
    '/admin/settings/config',
    { preHandler: [requireAdminViewer] },
    async (_request, reply) => {
      const response: ApiResponse<typeof MOCK_CONFIG> = { data: { ...MOCK_CONFIG } };
      return reply.status(200).send(response);
    },
  );

  // PUT /admin/settings/config — update protocol config
  fastify.put(
    '/admin/settings/config',
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      const parsed = configUpdateSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid config', 400, parsed.error.flatten());
      }

      const oldConfig = { ...MOCK_CONFIG };

      if (parsed.data.protocolFeeRate !== undefined) MOCK_CONFIG.protocolFeeRate = parsed.data.protocolFeeRate;
      if (parsed.data.liquidationIncentiveRate !== undefined) MOCK_CONFIG.liquidationIncentiveRate = parsed.data.liquidationIncentiveRate;
      if (parsed.data.flashLoanFeeRate !== undefined) MOCK_CONFIG.flashLoanFeeRate = parsed.data.flashLoanFeeRate;
      if (parsed.data.minBorrowAmount !== undefined) MOCK_CONFIG.minBorrowAmount = parsed.data.minBorrowAmount;
      if (parsed.data.maxBorrowAmount !== undefined) MOCK_CONFIG.maxBorrowAmount = parsed.data.maxBorrowAmount;
      MOCK_CONFIG.updatedAt = new Date().toISOString();
      MOCK_CONFIG.updatedBy = request.user?.userId ?? 'unknown';

      await logAdminAction(request, 'config.update', 'config', '1', oldConfig, MOCK_CONFIG);

      const response: ApiResponse<typeof MOCK_CONFIG> = { data: { ...MOCK_CONFIG } };
      return reply.status(200).send(response);
    },
  );

  // GET /admin/settings/feature-flags
  fastify.get(
    '/admin/settings/feature-flags',
    { preHandler: [requireAdminViewer] },
    async (_request, reply) => {
      const response: ApiResponse<typeof MOCK_FEATURE_FLAGS> = { data: { ...MOCK_FEATURE_FLAGS } };
      return reply.status(200).send(response);
    },
  );

  // PUT /admin/settings/feature-flags
  fastify.put(
    '/admin/settings/feature-flags',
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      const parsed = featureFlagSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid flags', 400, parsed.error.flatten());
      }

      const oldFlags = { ...MOCK_FEATURE_FLAGS };

      if (parsed.data.flashLoans !== undefined) MOCK_FEATURE_FLAGS.flashLoans = parsed.data.flashLoans;
      if (parsed.data.secLending !== undefined) MOCK_FEATURE_FLAGS.secLending = parsed.data.secLending;
      if (parsed.data.governance !== undefined) MOCK_FEATURE_FLAGS.governance = parsed.data.governance;
      if (parsed.data.productiveLending !== undefined) MOCK_FEATURE_FLAGS.productiveLending = parsed.data.productiveLending;

      await logAdminAction(request, 'config.update_flags', 'config', 'feature-flags', oldFlags, MOCK_FEATURE_FLAGS);

      const response: ApiResponse<typeof MOCK_FEATURE_FLAGS> = { data: { ...MOCK_FEATURE_FLAGS } };
      return reply.status(200).send(response);
    },
  );

  // GET /admin/settings/health — system health
  fastify.get(
    '/admin/settings/health',
    { preHandler: [requireAdminViewer] },
    async (_request, reply) => {
      const data = {
        api: { status: 'healthy', latency: 12, uptime: 99.99 },
        database: { status: 'healthy', latency: 5, connections: 12, maxConnections: 100 },
        redis: { status: 'healthy', latency: 2, memoryUsed: '45MB', maxMemory: '256MB' },
        canton: { status: 'degraded', latency: 150, ledgerHeight: 1_234_567, syncStatus: 'syncing' },
        oracle: { status: 'healthy', feedsActive: 7, feedsTotal: 7, avgStaleness: 65 },
        jobs: { status: 'healthy', activeWorkers: 3, queuedJobs: 2, failedJobs24h: 0 },
      };

      const response: ApiResponse<typeof data> = { data };
      return reply.status(200).send(response);
    },
  );

  // POST /admin/settings/protocol/pause — emergency protocol pause
  fastify.post(
    '/admin/settings/protocol/pause',
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      if (MOCK_CONFIG.isPaused) {
        throw new AppError('VALIDATION_ERROR', 'Protocol is already paused', 400);
      }

      MOCK_CONFIG.isPaused = true;
      MOCK_CONFIG.pausedAt = new Date().toISOString();
      MOCK_CONFIG.pausedBy = request.user?.userId ?? 'unknown';

      const schema = z.object({ reason: z.string().min(1).max(500).optional() });
      const parsed = schema.safeParse(request.body);
      MOCK_CONFIG.pauseReason = parsed.success ? (parsed.data.reason ?? null) : null;

      await logAdminAction(request, 'protocol.pause', 'protocol', 'global', { isPaused: false }, { isPaused: true, reason: MOCK_CONFIG.pauseReason });

      const response: ApiResponse<typeof MOCK_CONFIG> = { data: { ...MOCK_CONFIG } };
      return reply.status(200).send(response);
    },
  );

  // POST /admin/settings/protocol/resume — emergency protocol resume
  fastify.post(
    '/admin/settings/protocol/resume',
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      if (!MOCK_CONFIG.isPaused) {
        throw new AppError('VALIDATION_ERROR', 'Protocol is not paused', 400);
      }

      MOCK_CONFIG.isPaused = false;
      MOCK_CONFIG.pausedAt = null;
      MOCK_CONFIG.pausedBy = null;
      MOCK_CONFIG.pauseReason = null;

      await logAdminAction(request, 'protocol.resume', 'protocol', 'global', { isPaused: true }, { isPaused: false });

      const response: ApiResponse<typeof MOCK_CONFIG> = { data: { ...MOCK_CONFIG } };
      return reply.status(200).send(response);
    },
  );
}
