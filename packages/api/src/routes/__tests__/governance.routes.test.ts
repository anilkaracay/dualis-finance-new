import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

vi.mock('../../config/logger.js', () => ({
  createChildLogger: () => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  }),
}));

vi.mock('../../config/env.js', () => ({
  env: { JWT_SECRET: 'test-secret-32chars-for-jwt!!!!!' },
}));

vi.mock('../../db/client.js', () => ({
  getDb: vi.fn(() => null),
  schema: { apiKeys: {}, audit_logs: {}, adminAuditLogs: {} },
}));

vi.mock('../../cache/redis.js', () => ({
  getRedis: vi.fn(() => null),
}));

vi.mock('../../security/session.js', () => ({
  isTokenBlacklisted: vi.fn(async () => false),
}));

vi.mock('../../services/institutional.service.js', () => ({
  getInstitutionStatus: vi.fn(() => null),
}));

vi.mock('../../services/privacy.service.js', () => ({
  getPrivacyConfig: vi.fn(() => ({ privacyLevel: 'Selective' })),
}));

// Mock governance services
vi.mock('../../services/governance/proposalService.js', () => ({
  getGovernanceConfig: vi.fn(async () => ({
    votingPeriod: 259200,
    quorumThreshold: '1000000',
    proposalThreshold: '10000',
    executionDelay: 86400,
  })),
  listProposals: vi.fn(async () => ({
    items: [
      { id: 'prop-001', title: 'Test Proposal', status: 'Active', type: 'PARAMETER_CHANGE' },
    ],
    total: 1,
    page: 1,
    limit: 20,
  })),
  getProposal: vi.fn(async (id: string) => {
    if (id === 'prop-nonexistent') throw Object.assign(new Error('Not found'), { statusCode: 404 });
    return { id, title: 'Test Proposal', status: 'Active', type: 'PARAMETER_CHANGE' };
  }),
  createProposal: vi.fn(async (data: any) => ({
    id: 'prop-new-001',
    ...data,
    status: 'Pending',
    createdAt: new Date().toISOString(),
  })),
  cancelProposal: vi.fn(async () => ({ cancelled: true })),
}));

vi.mock('../../services/governance/voteService.js', () => ({
  castVote: vi.fn(async () => ({
    id: 'vote-001',
    proposalId: 'prop-001',
    direction: 'FOR',
    weight: '1000000',
    createdAt: new Date().toISOString(),
  })),
  getVoteResults: vi.fn(async () => ({
    forVotes: '5000000',
    againstVotes: '1000000',
    abstainVotes: '500000',
    totalVoters: 15,
  })),
  getUserVote: vi.fn(async () => ({
    id: 'vote-001',
    direction: 'FOR',
    weight: '1000000',
  })),
}));

vi.mock('../../services/governance/delegationService.js', () => ({
  delegate: vi.fn(async () => ({
    id: 'del-001',
    delegatorId: 'usr-001',
    delegateeId: 'usr-002',
    createdAt: new Date().toISOString(),
  })),
  undelegate: vi.fn(async () => ({ undelegated: true })),
  getDelegations: vi.fn(async () => [
    { id: 'del-001', delegatorId: 'usr-001', delegateeId: 'usr-002' },
  ]),
  getVotingPower: vi.fn(async () => ({
    ownPower: '1000000',
    delegatedPower: '500000',
    totalPower: '1500000',
  })),
}));

vi.mock('../../services/governance/executionService.js', () => ({
  vetoProposal: vi.fn(async () => ({ vetoed: true })),
  executeProposal: vi.fn(async () => ({ executed: true })),
}));

import Fastify from 'fastify';
import jwt from 'jsonwebtoken';
import { governanceRoutes } from '../../routes/governance';

const TEST_SECRET = 'test-secret-32chars-for-jwt!!!!!';
let app: ReturnType<typeof Fastify>;

function retailToken() {
  return jwt.sign(
    { sub: 'usr-001', partyId: 'party::test', role: 'retail', jti: 'jti-1' },
    TEST_SECRET,
    { expiresIn: '15m' },
  );
}

function adminToken() {
  return jwt.sign(
    { sub: 'usr-admin', partyId: 'party::admin', role: 'admin', jti: 'jti-admin' },
    TEST_SECRET,
    { expiresIn: '15m' },
  );
}

function authHeader(token?: string) {
  return { authorization: `Bearer ${token ?? retailToken()}` };
}

beforeAll(async () => {
  app = Fastify();
  await app.register(governanceRoutes);
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('Governance Routes', () => {
  describe('GET /governance/config', () => {
    it('returns 200 with config', async () => {
      const res = await app.inject({ method: 'GET', url: '/governance/config' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toHaveProperty('votingPeriod');
      expect(body.data).toHaveProperty('quorumThreshold');
    });
  });

  describe('GET /governance/proposals', () => {
    it('returns 200 with proposal list', async () => {
      const res = await app.inject({ method: 'GET', url: '/governance/proposals' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('pagination');
      expect(body.data.length).toBeGreaterThan(0);
    });
    it('accepts status filter', async () => {
      const res = await app.inject({ method: 'GET', url: '/governance/proposals?status=Active' });
      expect(res.statusCode).toBe(200);
    });
    it('accepts pagination', async () => {
      const res = await app.inject({ method: 'GET', url: '/governance/proposals?page=1&limit=10' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.pagination).toHaveProperty('total');
    });
  });

  describe('GET /governance/proposals/:id', () => {
    it('returns 200 for valid proposal', async () => {
      const res = await app.inject({ method: 'GET', url: '/governance/proposals/prop-001' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toHaveProperty('title');
    });
  });

  describe('GET /governance/proposals/:id/votes', () => {
    it('returns 200 with vote results', async () => {
      const res = await app.inject({ method: 'GET', url: '/governance/proposals/prop-001/votes' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toHaveProperty('forVotes');
      expect(body.data).toHaveProperty('againstVotes');
    });
  });

  describe('POST /governance/proposals', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/governance/proposals',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Adjust reserve factor',
          description: 'Proposal to adjust the reserve factor from 10% to 15%',
          type: 'PARAMETER_CHANGE',
          payload: { type: 'PARAMETER_CHANGE', data: { reserveFactor: 0.15 } },
        }),
      });
      expect(res.statusCode).toBe(401);
    });
    it('returns 201 with auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/governance/proposals',
        headers: { 'content-type': 'application/json', ...authHeader() },
        body: JSON.stringify({
          title: 'Adjust reserve factor',
          description: 'Proposal to adjust the reserve factor from 10% to 15%',
          type: 'PARAMETER_CHANGE',
          payload: { type: 'PARAMETER_CHANGE', data: { reserveFactor: 0.15 } },
        }),
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.data).toHaveProperty('id');
    });
  });

  describe('POST /governance/proposals/:id/cancel', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({ method: 'POST', url: '/governance/proposals/prop-001/cancel' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /governance/proposals/:id/vote', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/governance/proposals/prop-001/vote',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ direction: 'FOR' }),
      });
      expect(res.statusCode).toBe(401);
    });
    it('returns 200 with valid vote', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/governance/proposals/prop-001/vote',
        headers: { 'content-type': 'application/json', ...authHeader() },
        body: JSON.stringify({ direction: 'FOR' }),
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toHaveProperty('direction');
    });
  });

  describe('GET /governance/proposals/:id/my-vote', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({ method: 'GET', url: '/governance/proposals/prop-001/my-vote' });
      expect(res.statusCode).toBe(401);
    });
    it('returns 200 with auth', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/governance/proposals/prop-001/my-vote',
        headers: authHeader(),
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /governance/proposals/:id/veto (admin)', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/governance/proposals/prop-001/veto',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reason: 'This proposal violates protocol safety rules' }),
      });
      expect(res.statusCode).toBe(401);
    });
    it('returns 403 for non-admin', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/governance/proposals/prop-001/veto',
        headers: { 'content-type': 'application/json', ...authHeader(retailToken()) },
        body: JSON.stringify({ reason: 'This proposal violates protocol safety rules' }),
      });
      expect(res.statusCode).toBe(403);
    });
    it('returns 200 for admin', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/governance/proposals/prop-001/veto',
        headers: { 'content-type': 'application/json', ...authHeader(adminToken()) },
        body: JSON.stringify({ reason: 'This proposal violates protocol safety rules' }),
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /governance/proposals/:id/execute (admin)', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({ method: 'POST', url: '/governance/proposals/prop-001/execute' });
      expect(res.statusCode).toBe(401);
    });
    it('returns 403 for non-admin', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/governance/proposals/prop-001/execute',
        headers: authHeader(retailToken()),
      });
      expect(res.statusCode).toBe(403);
    });
    it('returns 200 for admin', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/governance/proposals/prop-001/execute',
        headers: authHeader(adminToken()),
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /governance/delegate', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/governance/delegate',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ delegateeId: 'usr-002', delegateeAddress: 'party::delegatee' }),
      });
      expect(res.statusCode).toBe(401);
    });
    it('returns 200 with auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/governance/delegate',
        headers: { 'content-type': 'application/json', ...authHeader() },
        body: JSON.stringify({ delegateeId: 'usr-002', delegateeAddress: 'party::delegatee' }),
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /governance/undelegate', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({ method: 'POST', url: '/governance/undelegate' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /governance/delegations', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({ method: 'GET', url: '/governance/delegations' });
      expect(res.statusCode).toBe(401);
    });
    it('returns 200 with auth', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/governance/delegations',
        headers: authHeader(),
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /governance/voting-power', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({ method: 'GET', url: '/governance/voting-power' });
      expect(res.statusCode).toBe(401);
    });
    it('returns 200 with auth', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/governance/voting-power',
        headers: authHeader(),
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toHaveProperty('totalPower');
    });
  });
});
