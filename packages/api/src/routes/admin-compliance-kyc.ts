// ---------------------------------------------------------------------------
// Admin Compliance KYC/Risk/Sanctions Routes
// ---------------------------------------------------------------------------

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import { getDb } from '../db/client.js';
import {
  kycVerifications,
  sanctionsListEntries,
  users,
  amlScreenings,
} from '../db/schema.js';
import { requireCompliance, requireAdmin } from '../middleware/admin-auth.js';
import { calculateRiskAssessment, getLatestRiskAssessment } from '../compliance/services/risk.service.js';
import { makeDecision, manualReviewDecision } from '../compliance/services/decision.service.js';
import { updateSanctionsList } from '../compliance/services/sanctions.service.js';
import { logComplianceEvent } from '../compliance/audit.js';

export default async function adminComplianceKYCRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /admin/compliance/kyc/pending
  fastify.get(
    '/admin/compliance/kyc/pending',
    { preHandler: [requireCompliance] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const db = getDb();
      if (!db) return reply.status(503).send({ error: 'Database unavailable' });

      const pending = await db
        .select({
          verificationId: kycVerifications.verificationId,
          userId: kycVerifications.userId,
          status: kycVerifications.status,
          provider: kycVerifications.provider,
          attemptCount: kycVerifications.attemptCount,
          createdAt: kycVerifications.createdAt,
          displayName: users.displayName,
          email: users.email,
        })
        .from(kycVerifications)
        .innerJoin(users, eq(kycVerifications.userId, users.userId))
        .where(eq(kycVerifications.status, 'pending_review'))
        .orderBy(desc(kycVerifications.createdAt))
        .limit(100);

      return reply.send({ pending });
    },
  );

  // PUT /admin/compliance/kyc/:id/approve
  fastify.put(
    '/admin/compliance/kyc/:id/approve',
    { preHandler: [requireCompliance] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const body = (request.body as { reason?: string }) ?? {};
      const adminId = request.user!.userId!;

      const db = getDb();
      if (!db) return reply.status(503).send({ error: 'Database unavailable' });

      const [verification] = await db
        .select()
        .from(kycVerifications)
        .where(eq(kycVerifications.verificationId, id))
        .limit(1);

      if (!verification) return reply.status(404).send({ error: 'Verification not found' });

      await manualReviewDecision(verification.userId, adminId, 'approve', body.reason ?? 'Admin approval');

      return reply.send({ success: true });
    },
  );

  // PUT /admin/compliance/kyc/:id/reject
  fastify.put(
    '/admin/compliance/kyc/:id/reject',
    { preHandler: [requireCompliance] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const body = request.body as { reason?: string };
      const adminId = request.user!.userId!;

      if (!body?.reason) return reply.status(400).send({ error: 'Reason is required' });

      const db = getDb();
      if (!db) return reply.status(503).send({ error: 'Database unavailable' });

      const [verification] = await db
        .select()
        .from(kycVerifications)
        .where(eq(kycVerifications.verificationId, id))
        .limit(1);

      if (!verification) return reply.status(404).send({ error: 'Verification not found' });

      await manualReviewDecision(verification.userId, adminId, 'reject', body.reason);

      return reply.send({ success: true });
    },
  );

  // GET /admin/compliance/risk/:userId
  fastify.get(
    '/admin/compliance/risk/:userId',
    { preHandler: [requireCompliance] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = request.params as { userId: string };

      const assessment = await getLatestRiskAssessment(userId);
      if (!assessment) return reply.status(404).send({ error: 'No risk assessment found' });

      return reply.send({ assessment });
    },
  );

  // POST /admin/compliance/risk/:userId/reassess
  fastify.post(
    '/admin/compliance/risk/:userId/reassess',
    { preHandler: [requireCompliance] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = request.params as { userId: string };
      const adminId = request.user!.userId!;

      const assessment = await calculateRiskAssessment(userId, `admin:${adminId}`);
      const decisionResult = await makeDecision(assessment.assessmentId);

      return reply.send({ assessment, decision: decisionResult });
    },
  );

  // GET /admin/compliance/screenings
  fastify.get(
    '/admin/compliance/screenings',
    { preHandler: [requireCompliance] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const db = getDb();
      if (!db) return reply.status(503).send({ error: 'Database unavailable' });

      const query = request.query as Record<string, string | undefined>;
      const limit = Math.min(parseInt(query.limit ?? '50', 10), 200);
      const statusFilter = query.status;

      let dbQuery = db
        .select({
          screeningId: amlScreenings.screeningId,
          userId: amlScreenings.userId,
          walletAddress: amlScreenings.walletAddress,
          status: amlScreenings.status,
          riskScore: amlScreenings.riskScore,
          riskCategory: amlScreenings.riskCategory,
          screenedAt: amlScreenings.screenedAt,
          displayName: users.displayName,
          email: users.email,
        })
        .from(amlScreenings)
        .innerJoin(users, eq(amlScreenings.userId, users.userId))
        .orderBy(desc(amlScreenings.screenedAt))
        .limit(limit);

      if (statusFilter) {
        dbQuery = dbQuery.where(eq(amlScreenings.status, statusFilter)) as typeof dbQuery;
      }

      const screenings = await dbQuery;
      return reply.send({ screenings });
    },
  );

  // GET /admin/compliance/sanctions/matches
  fastify.get(
    '/admin/compliance/sanctions/matches',
    { preHandler: [requireCompliance] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const db = getDb();
      if (!db) return reply.status(503).send({ error: 'Database unavailable' });

      const entries = await db
        .select()
        .from(sanctionsListEntries)
        .where(eq(sanctionsListEntries.isActive, true))
        .orderBy(desc(sanctionsListEntries.addedAt))
        .limit(200);

      return reply.send({ entries });
    },
  );

  // POST /admin/compliance/sanctions/update
  fastify.post(
    '/admin/compliance/sanctions/update',
    { preHandler: [requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as { source?: string };
      if (!body?.source) return reply.status(400).send({ error: 'Source is required' });

      const result = await updateSanctionsList(body.source);
      const adminId = request.user!.userId!;

      await logComplianceEvent({
        actorType: 'admin',
        actorId: adminId,
        action: 'sanctions_list_updated',
        category: 'sanctions',
        description: `Sanctions list update triggered for source: ${body.source}`,
        metadata: { source: body.source, ...result },
      });

      return reply.send({ success: true, ...result });
    },
  );

  // POST /admin/compliance/user/:id/block
  fastify.post(
    '/admin/compliance/user/:id/block',
    { preHandler: [requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const body = request.body as { reason?: string };
      const adminId = request.user!.userId!;

      if (!body?.reason) return reply.status(400).send({ error: 'Reason is required' });

      await manualReviewDecision(id, adminId, 'block', body.reason);

      return reply.send({ success: true });
    },
  );

  // POST /admin/compliance/user/:id/unblock
  fastify.post(
    '/admin/compliance/user/:id/unblock',
    { preHandler: [requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const body = request.body as { reason?: string };
      const adminId = request.user!.userId!;

      if (!body?.reason) return reply.status(400).send({ error: 'Reason is required' });

      const db = getDb();
      if (!db) return reply.status(503).send({ error: 'Database unavailable' });

      await db
        .update(users)
        .set({
          isBlacklisted: false,
          accountStatus: 'active',
          updatedAt: new Date(),
        })
        .where(eq(users.userId, id));

      await logComplianceEvent({
        userId: id,
        actorType: 'admin',
        actorId: adminId,
        action: 'user_unblocked',
        category: 'decision',
        description: `User unblocked by admin. Reason: ${body.reason}`,
        metadata: { reason: body.reason, adminId },
      });

      return reply.send({ success: true });
    },
  );
}
