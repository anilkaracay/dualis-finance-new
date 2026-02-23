import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ApiResponse } from '@dualis/shared';
import { ProposalType, VoteDirection, GOVERNANCE } from '@dualis/shared';
import { AppError } from '../middleware/errorHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin-auth.js';
import * as proposalService from '../services/governance/proposalService.js';
import * as voteService from '../services/governance/voteService.js';
import * as delegationService from '../services/governance/delegationService.js';
import * as executionService from '../services/governance/executionService.js';

// ─── Validation Schemas ──────────────────────────────────────────────────────

const listProposalsSchema = z.object({
  status: z.string().optional(),
  type: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const createProposalSchema = z.object({
  title: z.string().min(GOVERNANCE.TITLE_MIN_LENGTH).max(GOVERNANCE.TITLE_MAX_LENGTH),
  description: z.string().min(GOVERNANCE.DESCRIPTION_MIN_LENGTH).max(GOVERNANCE.DESCRIPTION_MAX_LENGTH),
  discussionUrl: z.string().url().optional(),
  type: z.nativeEnum(ProposalType),
  payload: z.object({
    type: z.nativeEnum(ProposalType),
    data: z.record(z.string(), z.unknown()),
  }),
}).strict();

const castVoteSchema = z.object({
  direction: z.nativeEnum(VoteDirection),
}).strict();

const vetoSchema = z.object({
  reason: z.string().min(10),
}).strict();

const delegateSchema = z.object({
  delegateeId: z.string().min(1),
  delegateeAddress: z.string().min(1),
}).strict();

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function governanceRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /governance/config
  fastify.get('/governance/config', async (_request, reply) => {
    const config = await proposalService.getGovernanceConfig();
    return reply.send({ data: config } satisfies ApiResponse<typeof config>);
  });

  // GET /governance/proposals
  fastify.get('/governance/proposals', async (request, reply) => {
    const parsed = listProposalsSchema.safeParse(request.query);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid query parameters', 400, parsed.error.flatten());
    }
    const result = await proposalService.listProposals(parsed.data);
    return reply.send({
      data: result.items,
      pagination: { total: result.total, limit: result.limit, offset: (result.page - 1) * result.limit, hasMore: result.page * result.limit < result.total },
    });
  });

  // GET /governance/proposals/:id
  fastify.get('/governance/proposals/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const proposal = await proposalService.getProposal(id);
    return reply.send({ data: proposal } satisfies ApiResponse<typeof proposal>);
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
      const user = (request as any).user;
      const proposal = await proposalService.createProposal({
        proposerId: user.userId ?? user.partyId,
        proposerAddress: user.walletAddress ?? user.partyId,
        title: parsed.data.title,
        description: parsed.data.description,
        discussionUrl: parsed.data.discussionUrl ?? null,
        type: parsed.data.type,
        payload: parsed.data.payload as any,
      });
      return reply.status(201).send({ data: proposal });
    }
  );

  // POST /governance/proposals/:id/cancel (auth)
  fastify.post(
    '/governance/proposals/:id/cancel',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = (request as any).user;
      const result = await proposalService.cancelProposal(id, user.userId ?? user.partyId);
      return reply.send({ data: result });
    }
  );

  // POST /governance/proposals/:id/vote (auth)
  fastify.post(
    '/governance/proposals/:id/vote',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = castVoteSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid vote request', 400, parsed.error.flatten());
      }
      const user = (request as any).user;
      const vote = await voteService.castVote({
        proposalId: id,
        voterId: user.userId ?? user.partyId,
        voterAddress: user.walletAddress ?? user.partyId,
        direction: parsed.data.direction,
      });
      return reply.send({ data: vote });
    }
  );

  // GET /governance/proposals/:id/votes
  fastify.get('/governance/proposals/:id/votes', async (request, reply) => {
    const { id } = request.params as { id: string };
    const results = await voteService.getVoteResults(id);
    return reply.send({ data: results });
  });

  // GET /governance/proposals/:id/my-vote (auth)
  fastify.get(
    '/governance/proposals/:id/my-vote',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = (request as any).user;
      const vote = await voteService.getUserVote(id, user.userId ?? user.partyId);
      return reply.send({ data: vote });
    }
  );

  // POST /governance/proposals/:id/veto (admin)
  fastify.post(
    '/governance/proposals/:id/veto',
    { preHandler: [authMiddleware, requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = vetoSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid veto request', 400, parsed.error.flatten());
      }
      const user = (request as any).user;
      const result = await executionService.vetoProposal(id, user.userId ?? user.partyId, parsed.data.reason);
      return reply.send({ data: result });
    }
  );

  // POST /governance/proposals/:id/execute (admin)
  fastify.post(
    '/governance/proposals/:id/execute',
    { preHandler: [authMiddleware, requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = (request as any).user;
      const result = await executionService.executeProposal(id, user.userId ?? user.partyId);
      return reply.send({ data: result });
    }
  );

  // POST /governance/delegate (auth)
  fastify.post(
    '/governance/delegate',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = delegateSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid delegation request', 400, parsed.error.flatten());
      }
      const user = (request as any).user;
      const delegation = await delegationService.delegate({
        delegatorId: user.userId ?? user.partyId,
        delegatorAddress: user.walletAddress ?? user.partyId,
        delegateeId: parsed.data.delegateeId,
        delegateeAddress: parsed.data.delegateeAddress,
      });
      return reply.send({ data: delegation });
    }
  );

  // POST /governance/undelegate (auth)
  fastify.post(
    '/governance/undelegate',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const user = (request as any).user;
      const result = await delegationService.undelegate(user.userId ?? user.partyId);
      return reply.send({ data: result });
    }
  );

  // GET /governance/delegations (auth)
  fastify.get(
    '/governance/delegations',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const user = (request as any).user;
      const delegations = await delegationService.getDelegations(user.userId ?? user.partyId);
      return reply.send({ data: delegations });
    }
  );

  // GET /governance/voting-power (auth)
  fastify.get(
    '/governance/voting-power',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const user = (request as any).user;
      const power = await delegationService.getVotingPower(user.userId ?? user.partyId);
      return reply.send({ data: power });
    }
  );
}
