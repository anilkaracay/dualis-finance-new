import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ApiResponse, VerifiedInstitution, BulkOperation, FeeSchedule } from '@dualis/shared';
import { AppError } from '../middleware/errorHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import * as institutionalService from '../services/institutional.service.js';

const onboardingSchema = z.object({
  legalName: z.string().min(1),
  registrationNo: z.string().min(1),
  jurisdiction: z.string().min(2).max(4),
});

const submitKYBSchema = z.object({
  documents: z.record(z.string(), z.unknown()),
});

const verifyKYBSchema = z.object({
  approved: z.boolean(),
  level: z.enum(['Basic', 'Enhanced', 'Full']),
});

const createAPIKeySchema = z.object({
  name: z.string().min(1),
  permissions: z.array(z.string()).min(1),
});

const bulkOpsSchema = z.object({
  operations: z.array(
    z.object({
      opType: z.enum(['deposit', 'withdraw', 'borrow']),
      poolId: z.string().min(1),
      amount: z.string().min(1),
    }),
  ).min(1).max(50),
});

const subAccountSchema = z.object({
  name: z.string().min(1),
});

const exportSchema = z.object({
  format: z.enum(['csv', 'xml']).optional().default('csv'),
});

export async function institutionalRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /institutional/onboard — start onboarding
  fastify.post('/institutional/onboard', async (request, reply) => {
    const parsed = onboardingSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid onboarding data', 400, parsed.error.flatten());
    }

    const result = institutionalService.startOnboarding(parsed.data);
    const response: ApiResponse<VerifiedInstitution> = {
      data: result.data,
      transaction: result.transaction,
    };
    return reply.status(201).send(response);
  });

  // POST /institutional/:partyId/kyb (auth) — submit KYB documents
  fastify.post(
    '/institutional/:partyId/kyb',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { partyId } = request.params as { partyId: string };
      const parsed = submitKYBSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid KYB data', 400, parsed.error.flatten());
      }

      const result = institutionalService.submitKYB(partyId, parsed.data.documents);
      const response: ApiResponse<typeof result.data> = {
        data: result.data,
        transaction: result.transaction,
      };
      return reply.status(200).send(response);
    },
  );

  // POST /institutional/:partyId/verify (auth, operator) — verify KYB
  fastify.post(
    '/institutional/:partyId/verify',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { partyId } = request.params as { partyId: string };
      const parsed = verifyKYBSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid verification data', 400, parsed.error.flatten());
      }

      const result = institutionalService.verifyKYB(partyId, parsed.data);
      const response: ApiResponse<typeof result.data> = {
        data: result.data,
        transaction: result.transaction,
      };
      return reply.status(200).send(response);
    },
  );

  // GET /institutional/:partyId — get institution status
  fastify.get(
    '/institutional/:partyId',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { partyId } = request.params as { partyId: string };
      const institution = institutionalService.getInstitutionStatus(partyId);

      if (!institution) {
        throw new AppError('NOT_FOUND', `Institution ${partyId} not found`, 404);
      }

      const response: ApiResponse<VerifiedInstitution> = { data: institution };
      return reply.status(200).send(response);
    },
  );

  // GET /institutional — list all institutions
  fastify.get(
    '/institutional',
    { preHandler: [authMiddleware] },
    async (_request, reply) => {
      const institutions = institutionalService.listInstitutions();
      const response: ApiResponse<VerifiedInstitution[]> = { data: institutions };
      return reply.status(200).send(response);
    },
  );

  // POST /institutional/api-keys (auth) — create API key
  fastify.post(
    '/institutional/api-keys',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = createAPIKeySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid API key request', 400, parsed.error.flatten());
      }

      const partyId = request.user!.partyId;
      const result = institutionalService.createAPIKey(partyId, parsed.data.name, parsed.data.permissions);

      const response: ApiResponse<typeof result.data> = {
        data: result.data,
        transaction: result.transaction,
      };
      return reply.status(201).send(response);
    },
  );

  // DELETE /institutional/api-keys/:keyId (auth) — revoke API key
  fastify.delete(
    '/institutional/api-keys/:keyId',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = request.user!.partyId;
      const { keyId } = request.params as { keyId: string };

      const result = institutionalService.revokeAPIKey(partyId, keyId);
      const response: ApiResponse<typeof result.data> = {
        data: result.data,
        transaction: result.transaction,
      };
      return reply.status(200).send(response);
    },
  );

  // POST /institutional/bulk/deposit (auth) — bulk deposit
  fastify.post(
    '/institutional/bulk/deposit',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = bulkOpsSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid bulk operation', 400, parsed.error.flatten());
      }

      const partyId = request.user!.partyId;
      const result = institutionalService.executeBulkDeposit(partyId, parsed.data.operations);

      const response: ApiResponse<BulkOperation> = { data: result };
      return reply.status(200).send(response);
    },
  );

  // POST /institutional/bulk/withdraw (auth) — bulk withdraw
  fastify.post(
    '/institutional/bulk/withdraw',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = bulkOpsSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid bulk operation', 400, parsed.error.flatten());
      }

      const partyId = request.user!.partyId;
      const result = institutionalService.executeBulkWithdraw(partyId, parsed.data.operations);

      const response: ApiResponse<BulkOperation> = { data: result };
      return reply.status(200).send(response);
    },
  );

  // GET /institutional/risk-report (auth) — risk report
  fastify.get(
    '/institutional/risk-report',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = request.user!.partyId;
      const report = institutionalService.getRiskReport(partyId);

      const response: ApiResponse<typeof report> = { data: report };
      return reply.status(200).send(response);
    },
  );

  // GET /institutional/compliance/export (auth) — export compliance data
  fastify.get(
    '/institutional/compliance/export',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = exportSchema.safeParse(request.query);
      const format = parsed.success ? parsed.data.format : 'csv';
      const partyId = request.user!.partyId;

      const result = institutionalService.exportCompliance(partyId, format);
      return reply
        .status(200)
        .header('Content-Type', result.contentType)
        .send(result.data);
    },
  );

  // POST /institutional/sub-accounts (auth) — create sub-account
  fastify.post(
    '/institutional/sub-accounts',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = subAccountSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid sub-account data', 400, parsed.error.flatten());
      }

      const partyId = request.user!.partyId;
      const result = institutionalService.createSubAccount(partyId, parsed.data);

      const response: ApiResponse<typeof result.data> = {
        data: result.data,
        transaction: result.transaction,
      };
      return reply.status(201).send(response);
    },
  );

  // GET /institutional/fees (auth) — get fee schedule
  fastify.get(
    '/institutional/fees',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = request.user!.partyId;
      const fees = institutionalService.getFeeSchedule(partyId);

      const response: ApiResponse<FeeSchedule> = { data: fees };
      return reply.status(200).send(response);
    },
  );

  // GET /institutional/api-keys (auth) — list API keys
  fastify.get(
    '/institutional/api-keys',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = request.user!.partyId;

      // Return empty list — in production, this would query stored API keys via service
      const response: ApiResponse<{
        institutionParty: string;
        keys: Array<{ id: string; name: string; keyPrefix: string; isActive: boolean; createdAt: string; expiresAt: string }>;
      }> = {
        data: {
          institutionParty: partyId,
          keys: [],
        },
      };

      return reply.status(200).send(response);
    },
  );

  // GET /institutional/risk-profile (auth) — alias for /institutional/risk-report
  fastify.get(
    '/institutional/risk-profile',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = request.user!.partyId;
      const report = institutionalService.getRiskReport(partyId);

      const response: ApiResponse<typeof report> = { data: report };
      return reply.status(200).send(response);
    },
  );
}
