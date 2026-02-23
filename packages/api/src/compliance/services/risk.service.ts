import { nanoid } from 'nanoid';
import { eq, desc } from 'drizzle-orm';
import { getDb } from '../../db/client.js';
import { riskAssessments, kycVerifications, amlScreenings, users } from '../../db/schema.js';
import { logComplianceEvent } from '../audit.js';
import { RISK_WEIGHTS } from '@dualis/shared';
import type { RiskLevel, ComplianceDecision } from '@dualis/shared';

export async function calculateRiskAssessment(userId: string, triggeredBy: string) {
  const db = getDb();
  if (!db) throw new Error('Database unavailable');

  // 1. KYC score
  const [latestKyc] = await db
    .select()
    .from(kycVerifications)
    .where(eq(kycVerifications.userId, userId))
    .orderBy(desc(kycVerifications.createdAt))
    .limit(1);

  let kycScore = 50; // default: not completed
  if (latestKyc) {
    if (latestKyc.reviewAnswer === 'GREEN') kycScore = 0;
    else if (latestKyc.reviewAnswer === 'YELLOW') kycScore = 40;
    else if (latestKyc.reviewAnswer === 'RED') kycScore = 90;
  }

  // 2. AML score: max across wallets
  const amlRecords = await db
    .select()
    .from(amlScreenings)
    .where(eq(amlScreenings.userId, userId))
    .orderBy(desc(amlScreenings.screenedAt))
    .limit(50);

  let amlScore = 0;
  for (const r of amlRecords) {
    if (r.riskScore > amlScore) amlScore = r.riskScore;
  }

  // 3. PEP score: placeholder (0 — will be set by PEP check integration)
  const pepScore = 0;

  // 4. Geo score: 0 (no nationality column)
  const geoScore = 0;

  // 5. Behavioral: placeholder
  const behavioralScore = 0;

  // 6. Composite
  const compositeScore =
    kycScore * RISK_WEIGHTS.kyc +
    amlScore * RISK_WEIGHTS.aml +
    pepScore * RISK_WEIGHTS.pep +
    geoScore * RISK_WEIGHTS.geographic +
    behavioralScore * RISK_WEIGHTS.behavioral;

  // 7. Risk level
  let riskLevel: RiskLevel;
  if (compositeScore >= 76) riskLevel = 'critical';
  else if (compositeScore >= 51) riskLevel = 'high';
  else if (compositeScore >= 26) riskLevel = 'medium';
  else riskLevel = 'low';

  // Check for sanctions match override
  if (amlRecords.some((r) => r.status === 'blocked')) riskLevel = 'blocked';

  // Decision
  let decision: ComplianceDecision;
  if (riskLevel === 'blocked') decision = 'blocked';
  else if (riskLevel === 'critical') decision = 'rejected';
  else if (riskLevel === 'high') decision = 'manual_review';
  else decision = 'auto_approved';

  const factors: Array<Record<string, unknown>> = [
    { category: 'kyc', score: kycScore, weight: RISK_WEIGHTS.kyc, weighted: kycScore * RISK_WEIGHTS.kyc },
    { category: 'aml', score: amlScore, weight: RISK_WEIGHTS.aml, weighted: amlScore * RISK_WEIGHTS.aml },
    { category: 'pep', score: pepScore, weight: RISK_WEIGHTS.pep, weighted: pepScore * RISK_WEIGHTS.pep },
    { category: 'geographic', score: geoScore, weight: RISK_WEIGHTS.geographic, weighted: geoScore * RISK_WEIGHTS.geographic },
    { category: 'behavioral', score: behavioralScore, weight: RISK_WEIGHTS.behavioral, weighted: behavioralScore * RISK_WEIGHTS.behavioral },
  ];

  // Get previous risk level
  const [prev] = await db
    .select({ riskLevel: riskAssessments.riskLevel })
    .from(riskAssessments)
    .where(eq(riskAssessments.userId, userId))
    .orderBy(desc(riskAssessments.createdAt))
    .limit(1);

  // Calculate valid until
  const validMonths = riskLevel === 'low' ? 12 : riskLevel === 'medium' ? 3 : 1;
  const validUntil = new Date();
  validUntil.setMonth(validUntil.getMonth() + validMonths);

  const [assessment] = await db.insert(riskAssessments).values({
    assessmentId: `risk_${nanoid()}`,
    userId,
    kycScore,
    amlScore,
    pepScore,
    geoScore,
    behavioralScore,
    compositeScore,
    riskLevel,
    factors,
    decision,
    decisionReason: `Composite score: ${compositeScore.toFixed(1)} → ${riskLevel}`,
    triggeredBy,
    previousRiskLevel: prev?.riskLevel ?? null,
    validUntil,
  }).returning();

  if (!assessment) throw new Error('Failed to create risk assessment');

  // Update user
  await db.update(users).set({
    complianceRiskLevel: riskLevel,
    lastRiskAssessmentAt: new Date(),
    nextScreeningAt: validUntil,
    updatedAt: new Date(),
  }).where(eq(users.userId, userId));

  await logComplianceEvent({
    userId,
    actorType: 'system',
    action: 'risk_assessment_calculated',
    category: 'risk',
    description: `Risk assessment: composite=${compositeScore.toFixed(1)}, level=${riskLevel}, decision=${decision}`,
    metadata: { compositeScore, riskLevel, decision, kycScore, amlScore },
  });

  // Notify on risk level change
  if (prev && prev.riskLevel !== riskLevel) {
    const { notificationBus } = await import('../../notification/notification.bus.js');
    const [userRow] = await db.select({ partyId: users.partyId }).from(users).where(eq(users.userId, userId)).limit(1);
    if (userRow) {
      await notificationBus.emit({
        type: 'RISK_LEVEL_CHANGED',
        category: 'compliance',
        severity: riskLevel === 'high' || riskLevel === 'critical' ? 'warning' : 'info',
        partyId: userRow.partyId,
        title: 'Risk Level Updated',
        message: `Your compliance risk level has changed from ${prev.riskLevel} to ${riskLevel}.`,
        data: { previousLevel: prev.riskLevel, newLevel: riskLevel },
        channels: ['in_app'],
      });
    }
  }

  return assessment;
}

export async function getLatestRiskAssessment(userId: string) {
  const db = getDb();
  if (!db) return null;

  const [assessment] = await db
    .select()
    .from(riskAssessments)
    .where(eq(riskAssessments.userId, userId))
    .orderBy(desc(riskAssessments.createdAt))
    .limit(1);

  return assessment ?? null;
}
