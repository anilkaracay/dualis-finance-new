import { eq } from 'drizzle-orm';
import { getDb } from '../../db/client.js';
import { riskAssessments, kycVerifications, users } from '../../db/schema.js';
import { logComplianceEvent } from '../audit.js';
import type { ComplianceDecision, RiskLevel } from '@dualis/shared';

export async function makeDecision(assessmentId: string): Promise<{ decision: ComplianceDecision; actions: string[] }> {
  const db = getDb();
  if (!db) throw new Error('Database unavailable');

  const [assessment] = await db
    .select()
    .from(riskAssessments)
    .where(eq(riskAssessments.assessmentId, assessmentId))
    .limit(1);

  if (!assessment) throw new Error('Assessment not found');

  const userId = assessment.userId;
  const decision = assessment.decision as ComplianceDecision;
  const riskLevel = assessment.riskLevel as RiskLevel;
  const actions: string[] = [];

  if (decision === 'blocked' || riskLevel === 'blocked') {
    await db.update(users).set({
      isBlacklisted: true,
      blacklistedAt: new Date(),
      blacklistedReason: 'Sanctions match or critical risk',
      accountStatus: 'suspended',
      updatedAt: new Date(),
    }).where(eq(users.userId, userId));
    actions.push('user_blacklisted', 'account_suspended');

    await logComplianceEvent({
      userId,
      actorType: 'system',
      action: 'user_blocked',
      category: 'decision',
      description: `User blocked: ${assessment.decisionReason}`,
      metadata: { assessmentId, riskLevel },
    });
  } else if (decision === 'rejected') {
    await db.update(users).set({ kycStatus: 'rejected', updatedAt: new Date() }).where(eq(users.userId, userId));
    actions.push('kyc_rejected');

    await logComplianceEvent({
      userId,
      actorType: 'system',
      action: 'kyc_rejected',
      category: 'decision',
      description: `KYC rejected: ${assessment.decisionReason}`,
      metadata: { assessmentId, riskLevel },
    });
  } else if (decision === 'manual_review') {
    actions.push('queued_for_review');

    await logComplianceEvent({
      userId,
      actorType: 'system',
      action: 'manual_review_required',
      category: 'decision',
      description: `Manual review required: ${assessment.decisionReason}`,
      metadata: { assessmentId, riskLevel },
    });

    const { notificationBus } = await import('../../notification/notification.bus.js');
    await notificationBus.emit({
      type: 'COMPLIANCE_REVIEW_REQUIRED',
      category: 'compliance',
      severity: 'warning',
      partyId: 'party::operator',
      title: 'Compliance Review Required',
      message: `User ${userId} requires manual compliance review (risk: ${riskLevel}).`,
      data: { userId, riskLevel, assessmentId },
      channels: ['in_app'],
    });
  } else {
    // auto_approved
    await db.update(users).set({
      accountStatus: 'active',
      updatedAt: new Date(),
    }).where(eq(users.userId, userId));
    actions.push('account_activated');

    await logComplianceEvent({
      userId,
      actorType: 'system',
      action: 'user_auto_approved',
      category: 'decision',
      description: `User auto-approved: ${assessment.decisionReason}`,
      metadata: { assessmentId, riskLevel },
    });
  }

  return { decision, actions };
}

export async function manualReviewDecision(
  userId: string,
  adminId: string,
  decision: 'approve' | 'reject' | 'block',
  reason: string,
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Database unavailable');

  if (decision === 'approve') {
    await db.update(users).set({
      accountStatus: 'active',
      kycStatus: 'approved',
      updatedAt: new Date(),
    }).where(eq(users.userId, userId));

    await db.update(kycVerifications).set({
      status: 'approved',
      verifiedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(kycVerifications.userId, userId));
  } else if (decision === 'reject') {
    await db.update(users).set({
      kycStatus: 'rejected',
      updatedAt: new Date(),
    }).where(eq(users.userId, userId));

    await db.update(kycVerifications).set({
      status: 'rejected',
      rejectionReason: reason,
      updatedAt: new Date(),
    }).where(eq(kycVerifications.userId, userId));
  } else {
    await db.update(users).set({
      isBlacklisted: true,
      blacklistedAt: new Date(),
      blacklistedReason: reason,
      accountStatus: 'suspended',
      updatedAt: new Date(),
    }).where(eq(users.userId, userId));
  }

  await logComplianceEvent({
    userId,
    actorType: 'admin',
    actorId: adminId,
    action: 'manual_review_completed',
    category: 'decision',
    description: `Manual review: ${decision} by admin ${adminId}. Reason: ${reason}`,
    metadata: { decision, adminId, reason },
  });
}
