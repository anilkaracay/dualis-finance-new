import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ApiResponse, OffChainAttestation, AttestationBundle } from '@dualis/shared';
import { AppError } from '../middleware/errorHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import * as attestationService from '../services/attestation.service.js';
import * as compositeCreditService from '../services/compositeCredit.service.js';

const addAttestationSchema = z.object({
  type: z.enum(['credit_bureau', 'income_verification', 'business_verification', 'kyc_completion', 'tifa_performance', 'cross_protocol']),
  provider: z.string().min(1),
  claimedRange: z.string().min(1),
  proof: z.object({
    proofData: z.string().min(1),
    verifierKey: z.string().min(1),
    publicInputs: z.array(z.string()),
    circuit: z.string().min(1),
    generatedAt: z.string(),
  }),
  expiresAt: z.string(),
});

const verifyAttestationSchema = z.object({
  proof: z.object({
    proofData: z.string().min(1),
    verifierKey: z.string().min(1),
    publicInputs: z.array(z.string()),
    circuit: z.string().min(1),
    generatedAt: z.string(),
  }),
});

export async function attestationRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /attestation/bundle (auth) — get all attestations for user
  fastify.get(
    '/attestation/bundle',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = request.user!.partyId;
      const bundle = attestationService.getAttestations(partyId);

      const response: ApiResponse<AttestationBundle> = { data: bundle };
      return reply.status(200).send(response);
    },
  );

  // GET /attestation/:attestationId (auth) — get single attestation
  fastify.get(
    '/attestation/:attestationId',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = request.user!.partyId;
      const { attestationId } = request.params as { attestationId: string };

      const attestation = attestationService.getAttestationById(partyId, attestationId);
      if (!attestation) {
        throw new AppError('NOT_FOUND', `Attestation ${attestationId} not found`, 404);
      }

      const response: ApiResponse<OffChainAttestation> = { data: attestation };
      return reply.status(200).send(response);
    },
  );

  // POST /attestation (auth) — add new attestation
  fastify.post(
    '/attestation',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = addAttestationSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid attestation data', 400, parsed.error.flatten());
      }

      const partyId = request.user!.partyId;
      const result = attestationService.addAttestation(partyId, parsed.data);

      // Trigger composite score recalculation
      compositeCreditService.calculateCompositeScore(partyId);

      const response: ApiResponse<OffChainAttestation> = {
        data: result.data,
        transaction: result.transaction,
      };
      return reply.status(201).send(response);
    },
  );

  // POST /attestation/:attestationId/revoke (auth) — revoke attestation
  fastify.post(
    '/attestation/:attestationId/revoke',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = request.user!.partyId;
      const { attestationId } = request.params as { attestationId: string };

      const result = attestationService.revokeAttestation(partyId, attestationId);

      // Trigger composite score recalculation
      compositeCreditService.calculateCompositeScore(partyId);

      const response: ApiResponse<{ revoked: boolean }> = {
        data: result.data,
        transaction: result.transaction,
      };
      return reply.status(200).send(response);
    },
  );

  // POST /attestation/verify (public) — verify a ZK proof
  fastify.post(
    '/attestation/verify',
    async (request, reply) => {
      const parsed = verifyAttestationSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid proof data', 400, parsed.error.flatten());
      }

      const verified = attestationService.verifyAttestation(parsed.data.proof);
      const response: ApiResponse<{ verified: boolean }> = { data: { verified } };
      return reply.status(200).send(response);
    },
  );

  // GET /attestation/composite-score (auth) — get composite score
  fastify.get(
    '/attestation/composite-score',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = request.user!.partyId;
      const score = compositeCreditService.getCompositeScore(partyId);

      const response: ApiResponse<typeof score> = { data: score };
      return reply.status(200).send(response);
    },
  );

  // POST /attestation/composite-score/simulate (auth) — simulate score
  fastify.post(
    '/attestation/composite-score/simulate',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = request.user!.partyId;

      const body = request.body as { attestations?: unknown[] };
      const attestations = (body.attestations ?? []) as Parameters<typeof compositeCreditService.simulateScore>[1];
      const score = compositeCreditService.simulateScore(partyId, attestations);

      const response: ApiResponse<typeof score> = { data: score };
      return reply.status(200).send(response);
    },
  );
}
