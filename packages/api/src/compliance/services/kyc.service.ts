import { nanoid } from 'nanoid';
import { eq, desc } from 'drizzle-orm';
import { getDb } from '../../db/client.js';
import { kycVerifications, users } from '../../db/schema.js';
import { createChildLogger } from '../../config/logger.js';
import { getRedis } from '../../cache/redis.js';
import { logComplianceEvent } from '../audit.js';
import * as sumsub from '../clients/sumsub.client.js';
import type { ComplianceKYCStatus as KYCVerificationStatus, SumsubWebhookEvent } from '@dualis/shared';

const log = createChildLogger('kyc-service');

export async function initiateKYC(userId: string): Promise<{ token: string; applicantId: string }> {
  const db = getDb();
  if (!db) throw new Error('Database unavailable');

  // Check if user already has an active verification
  const [existing] = await db
    .select()
    .from(kycVerifications)
    .where(eq(kycVerifications.userId, userId))
    .orderBy(desc(kycVerifications.createdAt))
    .limit(1);

  let applicantId: string;

  // Check user's existing sumsub ID
  const [user] = await db.select({ sumsubApplicantId: users.sumsubApplicantId }).from(users).where(eq(users.userId, userId)).limit(1);

  if (user?.sumsubApplicantId) {
    applicantId = user.sumsubApplicantId;
  } else {
    applicantId = await sumsub.createApplicant(userId);
    await db.update(users).set({ sumsubApplicantId: applicantId, updatedAt: new Date() }).where(eq(users.userId, userId));
  }

  const { token } = await sumsub.generateAccessToken(applicantId);

  if (!existing || existing.status === 'expired' || existing.status === 'rejected') {
    await db.insert(kycVerifications).values({
      verificationId: `kyc_${nanoid()}`,
      userId,
      provider: 'sumsub',
      externalApplicantId: applicantId,
      status: 'token_generated',
      attemptCount: (existing?.attemptCount ?? 0) + 1,
    });
  } else {
    await db.update(kycVerifications).set({ status: 'token_generated', updatedAt: new Date() }).where(eq(kycVerifications.id, existing.id));
  }

  await db.update(users).set({ kycStatus: 'token_generated', updatedAt: new Date() }).where(eq(users.userId, userId));

  await logComplianceEvent({
    userId,
    actorType: 'user',
    action: 'kyc_initiated',
    category: 'kyc',
    description: `KYC verification initiated for user ${userId}`,
    metadata: { applicantId },
  });

  return { token, applicantId };
}

export async function getKYCStatus(userId: string) {
  const redis = getRedis();
  const cacheKey = `kyc:status:${userId}`;

  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch { /* cache miss */ }
  }

  const db = getDb();
  if (!db) return null;

  const [verification] = await db
    .select()
    .from(kycVerifications)
    .where(eq(kycVerifications.userId, userId))
    .orderBy(desc(kycVerifications.createdAt))
    .limit(1);

  if (!verification) return null;

  const result = {
    verificationId: verification.verificationId,
    status: verification.status,
    reviewAnswer: verification.reviewAnswer,
    rejectionReason: verification.rejectionReason,
    attemptCount: verification.attemptCount,
    verifiedAt: verification.verifiedAt?.toISOString() ?? null,
    expiresAt: verification.expiresAt?.toISOString() ?? null,
    createdAt: verification.createdAt.toISOString(),
  };

  if (redis) {
    try { await redis.set(cacheKey, JSON.stringify(result), 'EX', 300); } catch { /* ignore */ }
  }

  return result;
}

export async function processWebhookEvent(event: SumsubWebhookEvent): Promise<void> {
  const redis = getRedis();
  const dedupKey = `sumsub:webhook:${event.applicantId}:${event.createdAtMs}`;

  if (redis) {
    const isNew = await redis.set(dedupKey, '1', 'EX', 86400, 'NX');
    if (!isNew) {
      log.debug({ applicantId: event.applicantId }, 'Duplicate webhook — skipping');
      return;
    }
  }

  const db = getDb();
  if (!db) return;

  const [verification] = await db
    .select()
    .from(kycVerifications)
    .where(eq(kycVerifications.externalApplicantId, event.applicantId))
    .orderBy(desc(kycVerifications.createdAt))
    .limit(1);

  if (!verification) {
    log.warn({ applicantId: event.applicantId }, 'Webhook for unknown applicant');
    return;
  }

  const userId = verification.userId;

  if (event.type === 'applicantReviewed' && event.reviewResult) {
    const { reviewAnswer } = event.reviewResult;
    let newStatus: KYCVerificationStatus;
    let kycUserStatus: string;

    if (reviewAnswer === 'GREEN') {
      newStatus = 'approved';
      kycUserStatus = 'approved';
    } else if (reviewAnswer === 'RED') {
      newStatus = 'rejected';
      kycUserStatus = 'rejected';
    } else {
      newStatus = 'pending_review';
      kycUserStatus = 'pending_review';
    }

    await db.update(kycVerifications).set({
      status: newStatus,
      reviewAnswer,
      rejectionReason: event.reviewResult.moderationComment ?? null,
      rejectionLabels: event.reviewResult.rejectLabels ?? [],
      verifiedAt: reviewAnswer === 'GREEN' ? new Date() : null,
      updatedAt: new Date(),
    }).where(eq(kycVerifications.id, verification.id));

    await db.update(users).set({ kycStatus: kycUserStatus, updatedAt: new Date() }).where(eq(users.userId, userId));

    const actionMap: Record<string, 'kyc_approved' | 'kyc_rejected' | 'kyc_initiated'> = {
      GREEN: 'kyc_approved', RED: 'kyc_rejected',
    };

    await logComplianceEvent({
      userId,
      actorType: 'webhook',
      action: actionMap[reviewAnswer] ?? 'kyc_initiated',
      category: 'kyc',
      description: `KYC review: ${reviewAnswer} for user ${userId}`,
      metadata: { reviewAnswer, rejectLabels: event.reviewResult.rejectLabels },
    });

    // Emit notification
    const { notificationBus } = await import('../../notification/notification.bus.js');
    const notifType = reviewAnswer === 'GREEN' ? 'KYC_APPROVED' : reviewAnswer === 'RED' ? 'KYC_REJECTED' : 'KYC_RESUBMISSION_REQUIRED';
    const [userRow] = await db.select({ partyId: users.partyId }).from(users).where(eq(users.userId, userId)).limit(1);
    if (userRow) {
      await notificationBus.emit({
        type: notifType,
        category: 'compliance',
        severity: reviewAnswer === 'GREEN' ? 'info' : 'warning',
        partyId: userRow.partyId,
        title: `KYC Verification ${reviewAnswer === 'GREEN' ? 'Approved' : reviewAnswer === 'RED' ? 'Rejected' : 'Needs Review'}`,
        message: `Your KYC verification has been ${reviewAnswer === 'GREEN' ? 'approved' : reviewAnswer === 'RED' ? 'rejected' : 'flagged for review'}.`,
        data: { reviewAnswer },
        channels: ['in_app'],
      });
    }

    // Invalidate cache
    if (redis) {
      try { await redis.del(`kyc:status:${userId}`); } catch { /* ignore */ }
    }
  } else if (event.type === 'applicantPending') {
    await db.update(kycVerifications).set({ status: 'in_progress', updatedAt: new Date() }).where(eq(kycVerifications.id, verification.id));
    await db.update(users).set({ kycStatus: 'in_progress', updatedAt: new Date() }).where(eq(users.userId, userId));
  }
}

export async function retryKYC(userId: string): Promise<{ token: string; applicantId: string }> {
  const db = getDb();
  if (!db) throw new Error('Database unavailable');

  const [existing] = await db
    .select()
    .from(kycVerifications)
    .where(eq(kycVerifications.userId, userId))
    .orderBy(desc(kycVerifications.createdAt))
    .limit(1);

  if (existing && existing.attemptCount >= 3) {
    throw new Error('Maximum KYC attempts reached');
  }

  if (existing?.externalApplicantId) {
    await sumsub.resetApplicant(existing.externalApplicantId);
  }

  return initiateKYC(userId);
}
