import { lte, gte, and } from 'drizzle-orm';
import { createChildLogger } from '../../config/logger.js';
import { registerJob } from '../../jobs/scheduler.js';
import { getDb } from '../../db/client.js';
import * as schema from '../../db/schema.js';
import { notificationBus } from '../notification.bus.js';

const log = createChildLogger('document-expiry-checker');

type NotificationType = 'DOCUMENT_EXPIRY_30D' | 'DOCUMENT_EXPIRY_7D' | 'DOCUMENT_EXPIRY_1D';

// ---------------------------------------------------------------------------
// Job handler — runs daily
// ---------------------------------------------------------------------------

async function documentExpiryHandler(): Promise<void> {
  const db = getDb();
  if (!db) {
    log.warn('No DB — skipping document expiry check');
    return;
  }

  try {
    // Check institutions with upcoming document expirations
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Query institutions with expiresAt in the next 30 days
    const expiringInstitutions = await db
      .select()
      .from(schema.verifiedInstitutions)
      .where(
        and(
          lte(schema.verifiedInstitutions.expiresAt, thirtyDays),
          gte(schema.verifiedInstitutions.expiresAt, now),
        ),
      );

    for (const inst of expiringInstitutions) {
      if (!inst.expiresAt) continue;

      const daysUntilExpiry = Math.ceil(
        (inst.expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
      );

      let eventType: NotificationType;
      if (daysUntilExpiry <= 1) {
        eventType = 'DOCUMENT_EXPIRY_1D';
      } else if (daysUntilExpiry <= 7) {
        eventType = 'DOCUMENT_EXPIRY_7D';
      } else if (daysUntilExpiry <= 30) {
        eventType = 'DOCUMENT_EXPIRY_30D';
      } else {
        continue;
      }

      notificationBus.emit({
        type: eventType,
        category: 'compliance',
        severity: 'warning',
        partyId: inst.institutionParty,
        title: `Document Expiring in ${daysUntilExpiry} Day${daysUntilExpiry === 1 ? '' : 's'}`,
        message: `Your KYB verification for ${inst.legalName} expires in ${daysUntilExpiry} day(s). Please renew to maintain full access.`,
        data: {
          institutionParty: inst.institutionParty,
          legalName: inst.legalName,
          expiryDate: inst.expiresAt.toISOString(),
          daysUntil: daysUntilExpiry,
          documentName: 'KYB Verification',
        },
        deduplicationKey: `doc-expiry:${inst.institutionParty}:${eventType}:${now.toISOString().split('T')[0]}`,
        link: '/institutional/onboard',
      }).catch((err) => log.warn({ err }, 'Document expiry notification failed'));
    }

    log.info({ checked: expiringInstitutions.length }, 'Document expiry check complete');
  } catch (err) {
    log.error({ err }, 'Document expiry check failed');
  }
}

// Register job: daily (86400000 ms)
registerJob('document-expiry-checker', 24 * 60 * 60 * 1000, documentExpiryHandler);
