import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ApiResponse, PrivacyConfig, DisclosureRule, PrivacyAuditEntry } from '@dualis/shared';
import { AppError } from '../middleware/errorHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import * as privacyService from '../services/privacy.service.js';

const setPrivacyLevelSchema = z.object({
  level: z.enum(['Public', 'Selective', 'Maximum']),
});

const addDisclosureRuleSchema = z.object({
  discloseTo: z.string().min(1),
  displayName: z.string().min(1),
  dataScope: z.enum(['Positions', 'Transactions', 'CreditScore', 'SecLendingDeals', 'All']),
  purpose: z.string().min(1),
  expiresAt: z.string().nullable(),
});

const checkAccessSchema = z.object({
  requesterParty: z.string().min(1),
  scope: z.enum(['Positions', 'Transactions', 'CreditScore', 'SecLendingDeals', 'All']),
});

export async function privacyRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /privacy/config (auth) — get privacy configuration
  fastify.get(
    '/privacy/config',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = request.user!.partyId;
      const config = await privacyService.getPrivacyConfig(partyId);

      const response: ApiResponse<PrivacyConfig> = { data: config };
      return reply.status(200).send(response);
    },
  );

  // PUT /privacy/level (auth) — set privacy level
  fastify.put(
    '/privacy/level',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = setPrivacyLevelSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid privacy level', 400, parsed.error.flatten());
      }

      const partyId = request.user!.partyId;
      const result = await privacyService.setPrivacyLevel(partyId, parsed.data.level);

      const response: ApiResponse<PrivacyConfig> = {
        data: result.data,
        transaction: result.transaction,
      };
      return reply.status(200).send(response);
    },
  );

  // POST /privacy/disclosures (auth) — add disclosure rule
  // Also accepts /privacy/disclosure-rules for backward compat
  fastify.post(
    '/privacy/disclosures',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = addDisclosureRuleSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid disclosure rule', 400, parsed.error.flatten());
      }

      const partyId = request.user!.partyId;
      const result = await privacyService.addDisclosureRule(partyId, parsed.data);

      const response: ApiResponse<DisclosureRule> = {
        data: result.data,
        transaction: result.transaction,
      };
      return reply.status(201).send(response);
    },
  );

  // Legacy path alias for backward compatibility
  fastify.post(
    '/privacy/disclosure-rules',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = addDisclosureRuleSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid disclosure rule', 400, parsed.error.flatten());
      }

      const partyId = request.user!.partyId;
      const result = await privacyService.addDisclosureRule(partyId, parsed.data);

      const response: ApiResponse<DisclosureRule> = {
        data: result.data,
        transaction: result.transaction,
      };
      return reply.status(201).send(response);
    },
  );

  // DELETE /privacy/disclosures/:ruleId (auth) — remove disclosure rule
  fastify.delete(
    '/privacy/disclosures/:ruleId',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = request.user!.partyId;
      const { ruleId } = request.params as { ruleId: string };

      const result = await privacyService.removeDisclosureRule(partyId, ruleId);
      const response: ApiResponse<typeof result.data> = {
        data: result.data,
        transaction: result.transaction,
      };
      return reply.status(200).send(response);
    },
  );

  // Legacy path alias
  fastify.delete(
    '/privacy/disclosure-rules/:ruleId',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = request.user!.partyId;
      const { ruleId } = request.params as { ruleId: string };

      const result = await privacyService.removeDisclosureRule(partyId, ruleId);
      const response: ApiResponse<typeof result.data> = {
        data: result.data,
        transaction: result.transaction,
      };
      return reply.status(200).send(response);
    },
  );

  // POST /privacy/check-access (auth) — check if requester can access data
  fastify.post(
    '/privacy/check-access',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = checkAccessSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid access check', 400, parsed.error.flatten());
      }

      const partyId = request.user!.partyId;
      const result = await privacyService.checkAccess(partyId, parsed.data.requesterParty, parsed.data.scope);

      const response: ApiResponse<typeof result> = { data: result };
      return reply.status(200).send(response);
    },
  );

  // GET /privacy/audit-log (auth) — get audit log
  fastify.get(
    '/privacy/audit-log',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = request.user!.partyId;
      const { scope, granted } = request.query as { scope?: string; granted?: string };

      const filters: { scope?: string; granted?: boolean } = {};
      if (scope) filters.scope = scope;
      if (granted !== undefined) filters.granted = granted === 'true';

      const entries = await privacyService.getAuditLog(partyId, filters as Parameters<typeof privacyService.getAuditLog>[1]);

      const response: ApiResponse<PrivacyAuditEntry[]> = { data: entries };
      return reply.status(200).send(response);
    },
  );
}
