// ============================================================================
// Wallet Routes — Connection Management, Preferences & Transaction Routing
// ============================================================================

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import * as walletService from '../services/wallet.service.js';
import * as walletPreferencesService from '../services/walletPreferences.service.js';
import * as transactionRouterService from '../services/transactionRouter.service.js';
import * as partyMappingService from '../services/partyMapping.service.js';
import type { ApiResponse } from '@dualis/shared';

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const connectWalletSchema = z.object({
  walletAddress: z.string().min(10).max(256),
  walletType: z.enum(['metamask', 'walletconnect', 'ledger', 'custodial', 'canton-native']),
  signature: z.string().min(1),
  nonce: z.string().min(1),
  label: z.string().max(128).optional(),
});

const disconnectWalletSchema = z.object({
  walletConnectionId: z.string().min(1),
});

const updatePreferencesSchema = z.object({
  defaultWalletConnectionId: z.string().optional(),
  signingThreshold: z.string().optional(),
  routingMode: z.enum(['proxy', 'wallet-sign', 'auto']).optional(),
  autoDisconnectMinutes: z.number().min(5).max(1440).optional(),
  showTransactionConfirm: z.boolean().optional(),
});

const submitTransactionSchema = z.object({
  templateId: z.string().min(1),
  choiceName: z.string().min(1),
  argument: z.record(z.string(), z.unknown()),
  contractId: z.string().optional(),
  walletConnectionId: z.string().optional(),
  forceRoutingMode: z.enum(['proxy', 'wallet-sign', 'auto']).optional(),
  amountUsd: z.string().optional(),
});

const signTransactionSchema = z.object({
  signature: z.string().min(1),
});

const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

// ---------------------------------------------------------------------------
// Route Plugin
// ---------------------------------------------------------------------------

export async function walletRoutes(fastify: FastifyInstance): Promise<void> {
  // ── POST /wallet/connect ────────────────────────────────────────────────
  fastify.post(
    '/wallet/connect',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = connectWalletSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid request data', 400, parsed.error.flatten());
      }

      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'User ID required', 401);

      const result = await walletService.connectWallet(
        userId,
        parsed.data.walletAddress,
        parsed.data.walletType,
        parsed.data.signature,
        parsed.data.nonce,
        ...(parsed.data.label != null ? [parsed.data.label] as const : []),
      );

      const response: ApiResponse<typeof result> = { data: result };
      return reply.status(201).send(response);
    },
  );

  // ── POST /wallet/disconnect ─────────────────────────────────────────────
  fastify.post(
    '/wallet/disconnect',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = disconnectWalletSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid request data', 400, parsed.error.flatten());
      }

      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'User ID required', 401);

      const result = await walletService.disconnectWallet(userId, parsed.data.walletConnectionId);

      const response: ApiResponse<typeof result> = { data: result };
      return reply.status(200).send(response);
    },
  );

  // ── GET /wallet/connections ─────────────────────────────────────────────
  fastify.get(
    '/wallet/connections',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'User ID required', 401);

      const result = await walletService.getWalletConnections(userId);

      const response: ApiResponse<typeof result> = { data: result };
      return reply.status(200).send(response);
    },
  );

  // ── POST /wallet/connections/:id/primary ────────────────────────────────
  fastify.post(
    '/wallet/connections/:id/primary',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'User ID required', 401);

      const result = await walletService.setPrimaryWallet(userId, id);

      const response: ApiResponse<typeof result> = { data: result };
      return reply.status(200).send(response);
    },
  );

  // ── GET /wallet/preferences ─────────────────────────────────────────────
  fastify.get(
    '/wallet/preferences',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'User ID required', 401);

      const result = await walletPreferencesService.getPreferences(userId);

      const response: ApiResponse<typeof result> = { data: result };
      return reply.status(200).send(response);
    },
  );

  // ── PUT /wallet/preferences ─────────────────────────────────────────────
  fastify.put(
    '/wallet/preferences',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = updatePreferencesSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid request data', 400, parsed.error.flatten());
      }

      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'User ID required', 401);

      // Strip undefined values to satisfy exactOptionalPropertyTypes
      const updates: Parameters<typeof walletPreferencesService.updatePreferences>[1] = {};
      if (parsed.data.defaultWalletConnectionId != null) updates.defaultWalletConnectionId = parsed.data.defaultWalletConnectionId;
      if (parsed.data.signingThreshold != null) updates.signingThreshold = parsed.data.signingThreshold;
      if (parsed.data.routingMode != null) updates.routingMode = parsed.data.routingMode;
      if (parsed.data.autoDisconnectMinutes != null) updates.autoDisconnectMinutes = parsed.data.autoDisconnectMinutes;
      if (parsed.data.showTransactionConfirm != null) updates.showTransactionConfirm = parsed.data.showTransactionConfirm;

      const result = await walletPreferencesService.updatePreferences(userId, updates);

      const response: ApiResponse<typeof result> = { data: result };
      return reply.status(200).send(response);
    },
  );

  // ── POST /wallet/transaction/submit ─────────────────────────────────────
  fastify.post(
    '/wallet/transaction/submit',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = submitTransactionSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid request data', 400, parsed.error.flatten());
      }

      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'User ID required', 401);

      // Strip undefined values to satisfy exactOptionalPropertyTypes
      const txParams: Parameters<typeof transactionRouterService.routeTransaction>[1] = {
        templateId: parsed.data.templateId,
        choiceName: parsed.data.choiceName,
        argument: parsed.data.argument,
      };
      if (parsed.data.contractId != null) txParams.contractId = parsed.data.contractId;
      if (parsed.data.walletConnectionId != null) txParams.walletConnectionId = parsed.data.walletConnectionId;
      if (parsed.data.forceRoutingMode != null) txParams.forceRoutingMode = parsed.data.forceRoutingMode;
      if (parsed.data.amountUsd != null) txParams.amountUsd = parsed.data.amountUsd;

      const result = await transactionRouterService.routeTransaction(userId, txParams);

      const response: ApiResponse<typeof result> = { data: result };
      return reply.status(200).send(response);
    },
  );

  // ── POST /wallet/transaction/:id/sign ───────────────────────────────────
  fastify.post(
    '/wallet/transaction/:id/sign',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = signTransactionSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid request data', 400, parsed.error.flatten());
      }

      const result = await transactionRouterService.submitSignedTransaction(id, parsed.data.signature);

      const response: ApiResponse<typeof result> = { data: result };
      return reply.status(200).send(response);
    },
  );

  // ── GET /wallet/transaction/:id ─────────────────────────────────────────
  fastify.get(
    '/wallet/transaction/:id',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const result = await transactionRouterService.getTransactionStatus(id);

      const response: ApiResponse<typeof result> = { data: result };
      return reply.status(200).send(response);
    },
  );

  // ── GET /wallet/transactions ────────────────────────────────────────────
  fastify.get(
    '/wallet/transactions',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = paginationSchema.safeParse(request.query);
      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'User ID required', 401);

      const result = await transactionRouterService.getUserTransactions(
        userId,
        parsed.success && parsed.data.limit != null ? parsed.data.limit : 50,
        parsed.success && parsed.data.offset != null ? parsed.data.offset : 0,
      );

      const response: ApiResponse<typeof result> = { data: result };
      return reply.status(200).send(response);
    },
  );

  // ── GET /wallet/party-mappings ──────────────────────────────────────────
  fastify.get(
    '/wallet/party-mappings',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'User ID required', 401);

      const result = await partyMappingService.getPartyMappings(userId);

      const response: ApiResponse<typeof result> = { data: result };
      return reply.status(200).send(response);
    },
  );
}
