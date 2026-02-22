// ============================================================================
// Wallet Preferences Service — Per-User Signing & Routing Configuration
// ============================================================================

import { eq } from 'drizzle-orm';
import { createChildLogger } from '../config/logger.js';
import { getDb, schema } from '../db/client.js';
import { AppError } from '../middleware/errorHandler.js';
import type { WalletPreferences } from '@dualis/shared';

const log = createChildLogger('wallet-preferences-service');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function requireDb() {
  const db = getDb();
  if (!db) throw new AppError('INTERNAL_ERROR', 'Database not available', 500);
  return db;
}

function toWalletPreferences(
  row: typeof schema.walletPreferences.$inferSelect,
): WalletPreferences {
  return {
    userId: row.userId,
    defaultWalletConnectionId: row.defaultWalletConnectionId,
    signingThreshold: row.signingThreshold,
    routingMode: row.routingMode as WalletPreferences['routingMode'],
    autoDisconnectMinutes: row.autoDisconnectMinutes,
    showTransactionConfirm: row.showTransactionConfirm,
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Service Functions
// ---------------------------------------------------------------------------

/**
 * Get wallet preferences for a user. Lazy-creates defaults on first access.
 */
export async function getPreferences(userId: string): Promise<WalletPreferences> {
  const db = requireDb();

  const rows = await db
    .select()
    .from(schema.walletPreferences)
    .where(eq(schema.walletPreferences.userId, userId))
    .limit(1);

  const existing = rows[0];
  if (existing) {
    return toWalletPreferences(existing);
  }

  // Lazy-create defaults
  return ensureDefaultPreferences(userId);
}

/**
 * Update wallet preferences. Only updates provided fields.
 */
export async function updatePreferences(
  userId: string,
  updates: {
    defaultWalletConnectionId?: string;
    signingThreshold?: string;
    routingMode?: string;
    autoDisconnectMinutes?: number;
    showTransactionConfirm?: boolean;
  },
): Promise<WalletPreferences> {
  const db = requireDb();

  // Ensure preferences exist
  await getPreferences(userId);

  const setClause: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (updates.defaultWalletConnectionId !== undefined) {
    setClause.defaultWalletConnectionId = updates.defaultWalletConnectionId;
  }
  if (updates.signingThreshold !== undefined) {
    setClause.signingThreshold = updates.signingThreshold;
  }
  if (updates.routingMode !== undefined) {
    setClause.routingMode = updates.routingMode;
  }
  if (updates.autoDisconnectMinutes !== undefined) {
    setClause.autoDisconnectMinutes = updates.autoDisconnectMinutes;
  }
  if (updates.showTransactionConfirm !== undefined) {
    setClause.showTransactionConfirm = updates.showTransactionConfirm;
  }

  const updated = await db
    .update(schema.walletPreferences)
    .set(setClause)
    .where(eq(schema.walletPreferences.userId, userId))
    .returning();

  const row = updated[0];
  if (!row) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update preferences', 500);
  }

  log.info({ userId }, 'Wallet preferences updated');
  return toWalletPreferences(row);
}

/**
 * Create default preferences for a user if they don't exist.
 */
export async function ensureDefaultPreferences(
  userId: string,
): Promise<WalletPreferences> {
  const db = requireDb();

  // Check if already exists
  const existing = await db
    .select()
    .from(schema.walletPreferences)
    .where(eq(schema.walletPreferences.userId, userId))
    .limit(1);

  const row = existing[0];
  if (row) {
    return toWalletPreferences(row);
  }

  // Create defaults
  const inserted = await db
    .insert(schema.walletPreferences)
    .values({
      userId,
      signingThreshold: '1000',
      routingMode: 'auto',
      autoDisconnectMinutes: 30,
      showTransactionConfirm: true,
    })
    .returning();

  const newRow = inserted[0];
  if (!newRow) {
    throw new AppError('INTERNAL_ERROR', 'Failed to create default preferences', 500);
  }

  log.debug({ userId }, 'Default wallet preferences created');
  return toWalletPreferences(newRow);
}
