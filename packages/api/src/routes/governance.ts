import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type {
  ApiResponse,
  ListProposalsParams,
  ProposalListItem,
  CreateProposalResponse,
  CastVoteResponse,
} from '@dualis/shared';
import { AppError } from '../middleware/errorHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import * as governanceService from '../services/governance.service.js';

const listProposalsSchema = z.object({
  status: z.enum(['active', 'passed', 'rejected', 'executed', 'all']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const createProposalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z.string().min(1),
  actions: z.array(
    z.object({
      type: z.string().min(1),
      params: z.record(z.string(), z.unknown()),
    })
  ).min(1),
});

const castVoteSchema = z.object({
  vote: z.enum(['for', 'against', 'abstain']),
  weight: z.string().min(1),
});

export async function governanceRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /governance/proposals
  fastify.get('/governance/proposals', async (request, reply) => {
    const parsed = listProposalsSchema.safeParse(request.query);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid query parameters', 400, parsed.error.flatten());
    }

    const params = parsed.data as ListProposalsParams;
    const result = governanceService.listProposals(params);
    const response: ApiResponse<ProposalListItem[]> = {
      data: result.data,
      pagination: result.pagination,
    };

    return reply.status(200).send(response);
  });

  // POST /governance/proposals (auth)
  fastify.post(
    '/governance/proposals',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = createProposalSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid proposal request', 400, parsed.error.flatten());
      }

      const partyId = (request as FastifyRequest & { partyId: string }).partyId;
      const result = governanceService.createProposal(partyId, parsed.data);

      const response: ApiResponse<CreateProposalResponse> = {
        data: result.data,
        transaction: result.transaction,
      };

      return reply.status(201).send(response);
    }
  );

  // POST /governance/proposals/:proposalId/vote (auth)
  fastify.post(
    '/governance/proposals/:proposalId/vote',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { proposalId } = request.params as { proposalId: string };
      const parsed = castVoteSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid vote request', 400, parsed.error.flatten());
      }

      const partyId = (request as FastifyRequest & { partyId: string }).partyId;

      try {
        const result = governanceService.castVote(partyId, proposalId, parsed.data);
        const response: ApiResponse<CastVoteResponse> = {
          data: result.data,
          transaction: result.transaction,
        };
        return reply.status(200).send(response);
      } catch {
        throw new AppError('NOT_FOUND', `Proposal ${proposalId} not found`, 404);
      }
    }
  );
}
