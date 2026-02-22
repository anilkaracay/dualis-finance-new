// ============================================================================
// Custodial Party Service — Managed Canton Parties for Institutional Users
// ============================================================================

import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { createChildLogger } from '../config/logger.js';
import { getDb, schema } from '../db/client.js';
import { AppError } from '../middleware/errorHandler.js';
import { getPartyLayerProvider } from '../canton/partylayer.js';
import type { CustodialPartyInfo } from '@dualis/shared';

const log = createChildLogger('custodial-party-service');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function requireDb() {
  const db = getDb();
  if (!db) throw new AppError('INTERNAL_ERROR', 'Database not available', 500);
  return db;
}

function toCustodialPartyInfo(
  row: typeof schema.custodialParties.$inferSelect,
): CustodialPartyInfo {
  return {
    custodialPartyId: row.custodialPartyId,
    userId: row.userId,
    partyId: row.partyId,
    status: row.status as CustodialPartyInfo['status'],
    createdAt: row.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Service Functions
// ---------------------------------------------------------------------------

/**
 * Create a custodial Canton party for a user.
 * Allocates a new party via PartyLayer provider and stores the reference.
 */
export async function createCustodialParty(
  userId: string,
): Promise<{ custodialPartyId: string; partyId: string }> {
  const db = requireDb();
  const provider = getPartyLayerProvider();

  // Allocate party via PartyLayer
  const { partyId } = await provider.allocateParty(userId, `custodial_${userId}`);
  const custodialPartyId = `cp_${nanoid(16)}`;

  await db.insert(schema.custodialParties).values({
    custodialPartyId,
    userId,
    partyId,
    status: 'active',
  });

  log.info({ userId, custodialPartyId, partyId }, 'Custodial party created');
  return { custodialPartyId, partyId };
}

/**
 * Get the active custodial party for a user.
 */
export async function getCustodialParty(
  userId: string,
): Promise<CustodialPartyInfo | null> {
  const db = requireDb();

  const rows = await db
    .select()
    .from(schema.custodialParties)
    .where(eq(schema.custodialParties.userId, userId))
    .limit(1);

  const row = rows[0];
  if (!row || row.status === 'revoked') return null;

  return toCustodialPartyInfo(row);
}

/**
 * Revoke a custodial party (e.g. on account closure).
 */
export async function revokeCustodialParty(
  custodialPartyId: string,
): Promise<void> {
  const db = requireDb();

  await db
    .update(schema.custodialParties)
    .set({ status: 'revoked', revokedAt: new Date() })
    .where(eq(schema.custodialParties.custodialPartyId, custodialPartyId));

  log.info({ custodialPartyId }, 'Custodial party revoked');
}
