import { nanoid } from 'nanoid';
import { eq, desc } from 'drizzle-orm';
import { getDb } from '../../db/client.js';
import {
  dataDeletionRequests,
  users,
  retailProfiles,
  kycVerifications,
  amlScreenings,
  riskAssessments,
  notifications,
} from '../../db/schema.js';
import { createChildLogger } from '../../config/logger.js';
import { logComplianceEvent } from '../audit.js';

const log = createChildLogger('gdpr-service');

export async function requestDataExport(userId: string): Promise<{ requestId: string; data: Record<string, unknown> }> {
  const db = getDb();
  if (!db) throw new Error('Database unavailable');

  const [user] = await db.select({
    userId: users.userId,
    email: users.email,
    displayName: users.displayName,
    role: users.role,
    kycStatus: users.kycStatus,
    amlStatus: users.amlStatus,
    createdAt: users.createdAt,
  }).from(users).where(eq(users.userId, userId)).limit(1);

  const [profile] = await db.select().from(retailProfiles).where(eq(retailProfiles.userId, userId)).limit(1);
  const kyc = await db.select().from(kycVerifications).where(eq(kycVerifications.userId, userId)).orderBy(desc(kycVerifications.createdAt)).limit(10);
  const aml = await db.select().from(amlScreenings).where(eq(amlScreenings.userId, userId)).orderBy(desc(amlScreenings.screenedAt)).limit(50);
  const risks = await db.select().from(riskAssessments).where(eq(riskAssessments.userId, userId)).orderBy(desc(riskAssessments.createdAt)).limit(10);

  const requestId = `gdpr_${nanoid()}`;

  await logComplianceEvent({
    userId,
    actorType: 'user',
    action: 'gdpr_data_exported',
    category: 'gdpr',
    description: `Data export requested by user ${userId}`,
    metadata: { requestId },
  });

  return {
    requestId,
    data: {
      user: user ?? null,
      profile: profile ?? null,
      kycVerifications: kyc,
      amlScreenings: aml,
      riskAssessments: risks,
      exportedAt: new Date().toISOString(),
    },
  };
}

export async function requestDataDeletion(userId: string, reason?: string): Promise<{ requestId: string }> {
  const db = getDb();
  if (!db) throw new Error('Database unavailable');

  const requestId = `del_${nanoid()}`;

  // Regulatory retention: default 8 years
  const retentionEnd = new Date();
  retentionEnd.setFullYear(retentionEnd.getFullYear() + 8);

  await db.insert(dataDeletionRequests).values({
    requestId,
    userId,
    requestType: 'data_deletion',
    status: 'pending',
    reason: reason ?? null,
    retentionEndDate: retentionEnd,
  });

  await logComplianceEvent({
    userId,
    actorType: 'user',
    action: 'gdpr_deletion_requested',
    category: 'gdpr',
    description: `Data deletion requested by user ${userId}`,
    metadata: { requestId, reason },
  });

  return { requestId };
}

export async function processDataDeletion(
  requestId: string,
  adminId: string,
  decision: 'approve' | 'reject',
  note?: string,
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Database unavailable');

  const [request] = await db
    .select()
    .from(dataDeletionRequests)
    .where(eq(dataDeletionRequests.requestId, requestId))
    .limit(1);

  if (!request) throw new Error('Deletion request not found');

  if (decision === 'reject') {
    await db.update(dataDeletionRequests).set({
      status: 'denied',
      processedAt: new Date(),
    }).where(eq(dataDeletionRequests.requestId, requestId));

    await logComplianceEvent({
      userId: request.userId,
      actorType: 'admin',
      actorId: adminId,
      action: 'gdpr_deletion_rejected',
      category: 'gdpr',
      description: `Data deletion rejected by admin. Note: ${note ?? 'N/A'}`,
      metadata: { requestId, adminId, note },
    });
    return;
  }

  // Check retention period
  if (request.retentionEndDate && new Date() < new Date(request.retentionEndDate)) {
    log.warn({ requestId, retentionEndDate: request.retentionEndDate }, 'Cannot delete — within retention period');
    await db.update(dataDeletionRequests).set({
      status: 'denied',
      processedAt: new Date(),
    }).where(eq(dataDeletionRequests.requestId, requestId));
    return;
  }

  // Anonymize user data
  const userId = request.userId;
  const anonEmail = `deleted_${nanoid(8)}@anonymized.local`;

  await db.update(users).set({
    email: anonEmail,
    displayName: null,
    passwordHash: null,
    walletAddress: null,
    accountStatus: 'deleted',
    updatedAt: new Date(),
  }).where(eq(users.userId, userId));

  await db.update(retailProfiles).set({
    firstName: null,
    lastName: null,
    updatedAt: new Date(),
  }).where(eq(retailProfiles.userId, userId));

  // Delete non-compliance data
  await db.delete(notifications).where(eq(notifications.partyId, userId));

  await db.update(dataDeletionRequests).set({
    status: 'completed',
    processedAt: new Date(),
    completedAt: new Date(),
  }).where(eq(dataDeletionRequests.requestId, requestId));

  await logComplianceEvent({
    userId,
    actorType: 'admin',
    actorId: adminId,
    action: 'gdpr_deletion_completed',
    category: 'gdpr',
    description: `Data deletion completed for user ${userId}`,
    metadata: { requestId, adminId },
  });
}

export async function getPendingDeletionRequests() {
  const db = getDb();
  if (!db) return [];

  return db
    .select()
    .from(dataDeletionRequests)
    .where(eq(dataDeletionRequests.status, 'pending'))
    .orderBy(desc(dataDeletionRequests.createdAt))
    .limit(100);
}

export async function getDataRequests(userId: string) {
  const db = getDb();
  if (!db) return [];

  return db
    .select()
    .from(dataDeletionRequests)
    .where(eq(dataDeletionRequests.userId, userId))
    .orderBy(desc(dataDeletionRequests.createdAt))
    .limit(20);
}
