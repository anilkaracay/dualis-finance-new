import { nanoid } from 'nanoid';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { getDb } from '../../db/client.js';
import { amlScreenings, walletConnections, users } from '../../db/schema.js';
import { createChildLogger } from '../../config/logger.js';
import { logComplianceEvent } from '../audit.js';
import * as chainalysis from '../clients/chainalysis.client.js';

const log = createChildLogger('aml-service');

const CATEGORY_SCORES: Record<string, number> = {
  clean: 0, exchange: 5, defi: 10, p2p: 15, gambling: 30,
  mixer: 70, darknet: 90, sanctions: 100, scam: 100, stolen: 90,
};

function scoreToCategory(score: number): string {
  if (score >= 90) return 'high_risk';
  if (score >= 50) return 'flagged';
  if (score >= 30) return 'flagged';
  return 'clean';
}

function scoreToStatus(score: number): string {
  if (score >= 75) return 'blocked';
  if (score >= 50) return 'high_risk';
  if (score >= 25) return 'flagged';
  return 'clean';
}

export async function screenWallet(userId: string, walletAddress: string): Promise<typeof amlScreenings.$inferSelect> {
  const db = getDb();
  if (!db) throw new Error('Database unavailable');

  const { externalId } = await chainalysis.registerTransfer(walletAddress);
  const exposures = await chainalysis.getTransferExposures(externalId);

  // Calculate risk score from exposures
  let maxScore = 0;
  const flagReasons: string[] = [];
  const allExposures: Array<Record<string, unknown>> = [];

  for (const exp of [...exposures.directExposure, ...exposures.indirectExposure]) {
    const catScore = CATEGORY_SCORES[exp.category.toLowerCase()] ?? 10;
    if (catScore > maxScore) maxScore = catScore;
    if (catScore >= 30) flagReasons.push(`${exp.category}: score ${catScore}`);
    allExposures.push({ category: exp.category, value: exp.value, score: catScore });
  }

  const status = scoreToStatus(maxScore);
  const riskCategory = scoreToCategory(maxScore);

  const [screening] = await db.insert(amlScreenings).values({
    screeningId: `aml_${nanoid()}`,
    userId,
    screeningType: 'wallet',
    provider: 'chainalysis',
    externalId,
    status,
    riskScore: maxScore,
    riskCategory,
    walletAddress,
    exposures: allExposures,
    flagReasons,
  }).returning();

  if (!screening) throw new Error('Failed to insert AML screening record');

  // Update user AML status
  await db.update(users).set({ amlStatus: status, updatedAt: new Date() }).where(eq(users.userId, userId));

  await logComplianceEvent({
    userId,
    actorType: 'system',
    action: 'wallet_screened',
    category: 'aml',
    description: `Wallet ${walletAddress} screened: ${status} (score: ${maxScore})`,
    metadata: { walletAddress, riskScore: maxScore, status, riskCategory },
  });

  if (maxScore >= 50) {
    const { notificationBus } = await import('../../notification/notification.bus.js');
    const [userRow] = await db.select({ partyId: users.partyId }).from(users).where(eq(users.userId, userId)).limit(1);
    if (userRow) {
      await notificationBus.emit({
        type: maxScore >= 75 ? 'AML_WALLET_BLOCKED' : 'AML_WALLET_FLAGGED',
        category: 'compliance',
        severity: maxScore >= 75 ? 'critical' : 'warning',
        partyId: userRow.partyId,
        title: maxScore >= 75 ? 'Wallet Blocked' : 'Wallet Flagged',
        message: `Your wallet ${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)} has been ${maxScore >= 75 ? 'blocked' : 'flagged'} for review.`,
        data: { walletAddress, riskScore: maxScore },
        channels: ['in_app'],
      });
    }
  }

  return screening;
}

export async function screenOnConnect(userId: string, walletAddress: string): Promise<void> {
  try {
    await screenWallet(userId, walletAddress);
  } catch (err) {
    log.warn({ err, userId, walletAddress }, 'Wallet screening on connect failed — non-blocking');
  }
}

export async function getScreeningHistory(userId: string) {
  const db = getDb();
  if (!db) return [];

  return db
    .select()
    .from(amlScreenings)
    .where(eq(amlScreenings.userId, userId))
    .orderBy(desc(amlScreenings.screenedAt))
    .limit(100);
}

export async function rescreenAllUserWallets(userId: string): Promise<void> {
  const db = getDb();
  if (!db) return;

  const activeWallets = await db
    .select({ walletAddress: walletConnections.walletAddress })
    .from(walletConnections)
    .where(and(eq(walletConnections.userId, userId), isNull(walletConnections.disconnectedAt)));

  for (const wallet of activeWallets) {
    try {
      await screenWallet(userId, wallet.walletAddress);
    } catch (err) {
      log.warn({ err, walletAddress: wallet.walletAddress }, 'Rescreen failed');
    }
  }
}
