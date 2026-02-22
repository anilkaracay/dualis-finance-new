// ============================================================================
// Party Mapping Service — User ↔ Canton Party Associations
// ============================================================================

import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { createChildLogger } from '../config/logger.js';
import { getDb, schema } from '../db/client.js';
import { AppError } from '../middleware/errorHandler.js';
import { getPartyLayerProvider } from '../canton/partylayer.js';
import type { PartyMapping, CustodyMode } from '@dualis/shared';

const log = createChildLogger('party-mapping-service');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function requireDb() {
  const db = getDb();
  if (!db) throw new AppError('INTERNAL_ERROR', 'Database not available', 500);
  return db;
}

function toPartyMapping(
  row: typeof schema.partyMappings.$inferSelect,
): PartyMapping {
  return {
    mappingId: row.mappingId,
    userId: row.userId,
    partyId: row.partyId,
    walletConnectionId: row.walletConnectionId,
    custodyMode: row.custodyMode as CustodyMode,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Service Functions
// ---------------------------------------------------------------------------

/**
 * Create a party mapping for a user.
 * For custodial mode: allocates a new Canton party.
 * For self-custody: allocates a party linked to the wallet connection.
 */
export async function createPartyMapping(
  userId: string,
  custodyMode: CustodyMode,
  walletConnectionId?: string,
): Promise<PartyMapping> {
  const db = requireDb();
  const provider = getPartyLayerProvider();

  // Allocate a Canton party
  const { partyId } = await provider.allocateParty(userId, `${custodyMode}_${userId}`);
  const mappingId = `pm_${nanoid(16)}`;

  const inserted = await db
    .insert(schema.partyMappings)
    .values({
      mappingId,
      userId,
      partyId,
      walletConnectionId: walletConnectionId ?? null,
      custodyMode,
      isActive: true,
    })
    .returning();

  const row = inserted[0];
  if (!row) {
    throw new AppError('INTERNAL_ERROR', 'Failed to create party mapping', 500);
  }

  log.info({ userId, mappingId, partyId, custodyMode }, 'Party mapping created');
  return toPartyMapping(row);
}

/**
 * Get all party mappings for a user.
 */
export async function getPartyMappings(
  userId: string,
): Promise<PartyMapping[]> {
  const db = requireDb();

  const rows = await db
    .select()
    .from(schema.partyMappings)
    .where(eq(schema.partyMappings.userId, userId));

  return rows.map(toPartyMapping);
}

/**
 * Get the active party mapping for a user.
 */
export async function getActivePartyMapping(
  userId: string,
): Promise<PartyMapping | null> {
  const db = requireDb();

  const rows = await db
    .select()
    .from(schema.partyMappings)
    .where(
      and(
        eq(schema.partyMappings.userId, userId),
        eq(schema.partyMappings.isActive, true),
      ),
    )
    .limit(1);

  const row = rows[0];
  return row ? toPartyMapping(row) : null;
}

/**
 * Resolve the Canton party ID for a user.
 * Falls back to the user's default partyId from the users table.
 */
export async function resolvePartyId(userId: string): Promise<string> {
  const db = requireDb();

  // Try active party mapping first
  const mappingRows = await db
    .select()
    .from(schema.partyMappings)
    .where(
      and(
        eq(schema.partyMappings.userId, userId),
        eq(schema.partyMappings.isActive, true),
      ),
    )
    .limit(1);

  const mapping = mappingRows[0];
  if (mapping) return mapping.partyId;

  // Fall back to user's default partyId
  const userRows = await db
    .select({ partyId: schema.users.partyId })
    .from(schema.users)
    .where(eq(schema.users.userId, userId))
    .limit(1);

  const user = userRows[0];
  if (user) return user.partyId;

  throw new AppError('NOT_FOUND', 'Unable to resolve party for user', 404);
}
