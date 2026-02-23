import { nanoid } from 'nanoid';
import { eq, desc } from 'drizzle-orm';
import { getDb } from '../../db/client.js';
import { riskAssessments } from '../../db/schema.js';
import { createChildLogger } from '../../config/logger.js';
import { logComplianceEvent } from '../audit.js';

const log = createChildLogger('masak-service');

interface SIBReport {
  id: string;
  userId: string;
  reason: string;
  riskScore: number | undefined;
  details: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
}

// In-memory store (would be a DB table in production)
const sibReports: SIBReport[] = [];

export async function createSIB(
  userId: string,
  reason: string,
  details: Record<string, unknown>,
  createdBy: string,
): Promise<SIBReport> {
  const db = getDb();

  let riskScore: number | undefined;
  if (db) {
    const [latest] = await db
      .select({ compositeScore: riskAssessments.compositeScore })
      .from(riskAssessments)
      .where(eq(riskAssessments.userId, userId))
      .orderBy(desc(riskAssessments.createdAt))
      .limit(1);
    riskScore = latest?.compositeScore;
  }

  const report: SIBReport = {
    id: `sib_${nanoid()}`,
    userId,
    reason,
    riskScore,
    details,
    createdBy,
    createdAt: new Date(),
  };

  sibReports.push(report);

  await logComplianceEvent({
    userId,
    actorType: 'admin',
    actorId: createdBy,
    action: 'masak_sib_created',
    category: 'masak',
    description: `ŞİB report created for user ${userId}: ${reason}`,
    metadata: { sibId: report.id, reason, riskScore },
  });

  log.info({ sibId: report.id, userId }, 'MASAK ŞİB report created');

  return report;
}

export async function getSIBList(filters: { userId?: string } = {}): Promise<SIBReport[]> {
  if (filters.userId) {
    return sibReports.filter((r) => r.userId === filters.userId);
  }
  return [...sibReports];
}
