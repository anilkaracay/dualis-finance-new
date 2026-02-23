// ============================================================================
// Wallet Service — Connection Management & Multi-Wallet Support
// ============================================================================

import { eq, and, isNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { createChildLogger } from '../config/logger.js';
import { getDb, schema } from '../db/client.js';
import { AppError } from '../middleware/errorHandler.js';
import { getPartyLayerProvider } from '../canton/partylayer.js';
import * as partyMappingService from './partyMapping.service.js';
import type { WalletConnection, WalletType, CustodyMode } from '@dualis/shared';
import { notificationBus } from '../notification/notification.bus.js';

const log = createChildLogger('wallet-service');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function requireDb() {
  const db = getDb();
  if (!db) throw new AppError('INTERNAL_ERROR', 'Database not available', 500);
  return db;
}

function toWalletConnection(
  row: typeof schema.walletConnections.$inferSelect,
): WalletConnection {
  return {
    connectionId: row.connectionId,
    userId: row.userId,
    walletAddress: row.walletAddress,
    walletType: row.walletType as WalletType,
    custodyMode: row.custodyMode as CustodyMode,
    isPrimary: row.isPrimary,
    label: row.label,
    connectedAt: row.connectedAt.toISOString(),
    lastActiveAt: row.lastActiveAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Service Functions
// ---------------------------------------------------------------------------

/**
 * Connect a wallet for a user. Verifies signature, creates connection + party mapping.
 */
export async function connectWallet(
  userId: string,
  walletAddress: string,
  walletType: WalletType,
  signature: string,
  nonce: string,
  label?: string,
): Promise<WalletConnection> {
  const db = requireDb();
  const provider = getPartyLayerProvider();
  const normalizedAddress = walletAddress.toLowerCase();

  // Verify wallet signature
  const isValid = await provider.verifyWalletSignature(
    normalizedAddress,
    nonce,
    signature,
  );
  if (!isValid) {
    throw new AppError('VALIDATION_ERROR', 'Invalid wallet signature', 400);
  }

  // Validate nonce against walletNonces table
  const nonceRows = await db
    .select()
    .from(schema.walletNonces)
    .where(
      and(
        eq(schema.walletNonces.walletAddress, normalizedAddress),
        isNull(schema.walletNonces.usedAt),
      ),
    )
    .limit(1);

  const nonceRow = nonceRows[0];
  if (!nonceRow) {
    throw new AppError('VALIDATION_ERROR', 'Invalid or expired nonce', 400);
  }

  if (nonceRow.expiresAt < new Date()) {
    throw new AppError('VALIDATION_ERROR', 'Nonce expired', 400);
  }

  // Mark nonce as used
  await db
    .update(schema.walletNonces)
    .set({ usedAt: new Date() })
    .where(eq(schema.walletNonces.id, nonceRow.id));

  // Check if this is the first connection for the user
  const existingConnections = await db
    .select()
    .from(schema.walletConnections)
    .where(
      and(
        eq(schema.walletConnections.userId, userId),
        isNull(schema.walletConnections.disconnectedAt),
      ),
    );

  const isFirst = existingConnections.length === 0;
  const connectionId = `wc_${nanoid(16)}`;

  // Create wallet connection
  const inserted = await db
    .insert(schema.walletConnections)
    .values({
      connectionId,
      userId,
      walletAddress: normalizedAddress,
      walletType,
      custodyMode: 'self-custody',
      isPrimary: isFirst,
      label: label ?? null,
    })
    .returning();

  const row = inserted[0];
  if (!row) {
    throw new AppError('INTERNAL_ERROR', 'Failed to create wallet connection', 500);
  }

  // Create party mapping for this connection
  try {
    await partyMappingService.createPartyMapping(userId, 'self-custody', connectionId);
  } catch (err) {
    log.warn({ err, userId, connectionId }, 'Party mapping creation failed — wallet still connected');
  }

  log.info({ userId, connectionId, walletType, isPrimary: isFirst }, 'Wallet connected');

  // MP20: Notify user of wallet linked — need partyId from user row
  try {
    const userRows = await db.select({ partyId: schema.users.partyId }).from(schema.users).where(eq(schema.users.userId, userId)).limit(1);
    if (userRows[0]) {
      notificationBus.emit({
        type: 'WALLET_LINKED',
        category: 'auth',
        severity: 'info',
        partyId: userRows[0].partyId,
        title: 'Wallet Connected',
        message: `Wallet ${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)} (${walletType}) has been connected to your account.`,
        data: { walletAddress: normalizedAddress, walletType, connectionId },
        deduplicationKey: `wallet-linked:${userId}:${connectionId}`,
        link: '/settings/wallets',
      }).catch((err) => log.warn({ err }, 'Wallet linked notification failed'));
    }
  } catch (err) {
    log.warn({ err }, 'Failed to send wallet linked notification');
  }

  return toWalletConnection(row);
}

/**
 * Disconnect a wallet. Soft-deletes by setting disconnectedAt.
 */
export async function disconnectWallet(
  userId: string,
  connectionId: string,
): Promise<{ success: boolean }> {
  const db = requireDb();

  const updated = await db
    .update(schema.walletConnections)
    .set({ disconnectedAt: new Date() })
    .where(
      and(
        eq(schema.walletConnections.connectionId, connectionId),
        eq(schema.walletConnections.userId, userId),
        isNull(schema.walletConnections.disconnectedAt),
      ),
    )
    .returning();

  if (updated.length === 0) {
    throw new AppError('NOT_FOUND', 'Wallet connection not found', 404);
  }

  // MP20: Notify user of wallet unlinked
  const disconnectedRow = updated[0];
  try {
    const userRows = await db.select({ partyId: schema.users.partyId }).from(schema.users).where(eq(schema.users.userId, userId)).limit(1);
    if (userRows[0] && disconnectedRow) {
      notificationBus.emit({
        type: 'WALLET_UNLINKED',
        category: 'auth',
        severity: 'info',
        partyId: userRows[0].partyId,
        title: 'Wallet Disconnected',
        message: `Wallet ${disconnectedRow.walletAddress.slice(0, 6)}...${disconnectedRow.walletAddress.slice(-4)} has been disconnected from your account.`,
        data: { walletAddress: disconnectedRow.walletAddress, connectionId },
        deduplicationKey: `wallet-unlinked:${userId}:${connectionId}`,
        link: '/settings/wallets',
      }).catch((err) => log.warn({ err }, 'Wallet unlinked notification failed'));
    }
  } catch (err) {
    log.warn({ err }, 'Failed to send wallet unlinked notification');
  }

  log.info({ userId, connectionId }, 'Wallet disconnected');
  return { success: true };
}

/**
 * Get all active wallet connections for a user.
 */
export async function getWalletConnections(
  userId: string,
): Promise<WalletConnection[]> {
  const db = requireDb();

  const rows = await db
    .select()
    .from(schema.walletConnections)
    .where(
      and(
        eq(schema.walletConnections.userId, userId),
        isNull(schema.walletConnections.disconnectedAt),
      ),
    );

  return rows.map(toWalletConnection);
}

/**
 * Set a wallet connection as primary (unsets all others).
 */
export async function setPrimaryWallet(
  userId: string,
  connectionId: string,
): Promise<{ success: boolean }> {
  const db = requireDb();

  // Verify the connection belongs to the user and is active
  const targetRows = await db
    .select()
    .from(schema.walletConnections)
    .where(
      and(
        eq(schema.walletConnections.connectionId, connectionId),
        eq(schema.walletConnections.userId, userId),
        isNull(schema.walletConnections.disconnectedAt),
      ),
    )
    .limit(1);

  if (targetRows.length === 0) {
    throw new AppError('NOT_FOUND', 'Wallet connection not found', 404);
  }

  // Unset all isPrimary for user
  await db
    .update(schema.walletConnections)
    .set({ isPrimary: false })
    .where(eq(schema.walletConnections.userId, userId));

  // Set target as primary
  await db
    .update(schema.walletConnections)
    .set({ isPrimary: true })
    .where(eq(schema.walletConnections.connectionId, connectionId));

  log.info({ userId, connectionId }, 'Primary wallet set');
  return { success: true };
}

/**
 * Get the active (primary or most recent) connection for a user.
 */
export async function getActiveConnection(
  userId: string,
): Promise<WalletConnection | null> {
  const db = requireDb();

  // Try primary first
  const primaryRows = await db
    .select()
    .from(schema.walletConnections)
    .where(
      and(
        eq(schema.walletConnections.userId, userId),
        eq(schema.walletConnections.isPrimary, true),
        isNull(schema.walletConnections.disconnectedAt),
      ),
    )
    .limit(1);

  const primary = primaryRows[0];
  if (primary) return toWalletConnection(primary);

  // Fall back to most recent
  const recentRows = await db
    .select()
    .from(schema.walletConnections)
    .where(
      and(
        eq(schema.walletConnections.userId, userId),
        isNull(schema.walletConnections.disconnectedAt),
      ),
    )
    .limit(1);

  const recent = recentRows[0];
  return recent ? toWalletConnection(recent) : null;
}

/**
 * Internal helper: ensure a wallet connection exists for a user.
 * Used by auth integration (loginWithWallet, linkWallet).
 */
export async function ensureWalletConnection(
  userId: string,
  walletAddress: string,
  walletType: WalletType,
  custodyMode: CustodyMode,
): Promise<void> {
  const db = requireDb();
  const normalizedAddress = walletAddress.toLowerCase();

  // Check if connection already exists
  const existing = await db
    .select()
    .from(schema.walletConnections)
    .where(
      and(
        eq(schema.walletConnections.userId, userId),
        eq(schema.walletConnections.walletAddress, normalizedAddress),
        isNull(schema.walletConnections.disconnectedAt),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    // Update lastActiveAt
    const row = existing[0];
    if (row) {
      await db
        .update(schema.walletConnections)
        .set({ lastActiveAt: new Date() })
        .where(eq(schema.walletConnections.connectionId, row.connectionId));
    }
    return;
  }

  // Check if this is the first connection
  const allConnections = await db
    .select()
    .from(schema.walletConnections)
    .where(
      and(
        eq(schema.walletConnections.userId, userId),
        isNull(schema.walletConnections.disconnectedAt),
      ),
    );

  const isFirst = allConnections.length === 0;
  const connectionId = `wc_${nanoid(16)}`;

  await db.insert(schema.walletConnections).values({
    connectionId,
    userId,
    walletAddress: normalizedAddress,
    walletType,
    custodyMode,
    isPrimary: isFirst,
  });

  log.debug({ userId, connectionId }, 'Wallet connection ensured');
}
