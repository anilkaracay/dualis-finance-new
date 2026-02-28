// ============================================================================
// Transaction Router Service — Proxy vs Wallet-Sign Decision Engine
// ============================================================================

import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { createChildLogger } from '../config/logger.js';
import { getDb, schema } from '../db/client.js';
import { AppError } from '../middleware/errorHandler.js';
import { getPartyLayerProvider } from '../canton/partylayer.js';
import * as partyMappingService from './partyMapping.service.js';
import * as walletPreferencesService from './walletPreferences.service.js';
import type {
  TransactionResult,
  TransactionLog,
  TransactionRoutingMode,
} from '@dualis/shared';

const log = createChildLogger('transaction-router-service');

// ---------------------------------------------------------------------------
// Post-Sign Callback Registry (for compound operations like repay)
// ---------------------------------------------------------------------------

type PostSignCallback = (txLogId: string, metadata: Record<string, unknown>) => Promise<void>;
const postSignCallbacks = new Map<string, PostSignCallback>();

/** Register a callback to run after a signed transaction is submitted (e.g. RecordRepay on pool). */
export function registerPostSignCallback(op: string, cb: PostSignCallback): void {
  postSignCallbacks.set(op, cb);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function requireDb() {
  const db = getDb();
  if (!db) throw new AppError('INTERNAL_ERROR', 'Database not available', 500);
  return db;
}

function toTransactionLog(
  row: typeof schema.transactionLogs.$inferSelect,
): TransactionLog {
  return {
    transactionLogId: row.transactionLogId,
    userId: row.userId,
    partyId: row.partyId,
    walletConnectionId: row.walletConnectionId,
    txHash: row.txHash,
    templateId: row.templateId,
    choiceName: row.choiceName,
    routingMode: row.routingMode as TransactionRoutingMode,
    status: row.status as TransactionLog['status'],
    amountUsd: row.amountUsd,
    errorMessage: row.errorMessage,
    createdAt: row.createdAt.toISOString(),
    confirmedAt: row.confirmedAt?.toISOString() ?? null,
  };
}

// ---------------------------------------------------------------------------
// Routing Logic
// ---------------------------------------------------------------------------

/**
 * Determine the routing mode based on user preferences and transaction amount.
 *
 * NOTE: Currently always returns 'proxy' because Canton wallets (Console, Loop, etc.)
 * only support CC token transfers via submitCommands(), NOT arbitrary DAML choice
 * exercise. All DeFi operations (deposit, withdraw, supply, borrow, repay) execute
 * DAML contract choices and must go through the backend operator party.
 *
 * wallet-sign mode will be re-enabled once Canton wallets support CIP-0103
 * prepareExecute for arbitrary DAML commands.
 */
function determineRoutingMode(
  forceMode: TransactionRoutingMode | undefined,
  _userMode: TransactionRoutingMode,
  _amountUsd: string | undefined,
  _signingThreshold: string,
): TransactionRoutingMode {
  // Explicit override — only honor 'proxy'; wallet-sign is not supported
  // for DAML choice execution yet
  if (forceMode === 'proxy') return 'proxy';

  // Always use proxy for DAML operations until wallets support prepareExecute
  return 'proxy';
}

// ---------------------------------------------------------------------------
// Service Functions
// ---------------------------------------------------------------------------

/**
 * Route a transaction: either submit via proxy or prepare for wallet signing.
 */
export async function routeTransaction(
  userId: string,
  params: {
    templateId: string;
    choiceName: string;
    argument: Record<string, unknown>;
    contractId?: string;
    walletConnectionId?: string;
    forceRoutingMode?: TransactionRoutingMode;
    amountUsd?: string;
    /** Command type: 'exercise' (default) or 'create' for contract creation */
    commandType?: 'exercise' | 'create';
    /** Compound operation identifier for post-sign callbacks (e.g. 'repay') */
    compoundOp?: string;
    /** Metadata passed to the post-sign callback */
    compoundMeta?: Record<string, unknown>;
    /** Override actAs party — use the connected wallet's party instead of the user's DB party */
    walletParty?: string;
  },
): Promise<TransactionResult> {
  const db = requireDb();
  const provider = getPartyLayerProvider();

  // Load user preferences
  const prefs = await walletPreferencesService.getPreferences(userId);

  // Resolve party — prefer connected wallet's party when provided (wallet-sign mode)
  const partyId = params.walletParty || await partyMappingService.resolvePartyId(userId);

  // Determine routing
  const routingMode = determineRoutingMode(
    params.forceRoutingMode,
    prefs.routingMode as TransactionRoutingMode,
    params.amountUsd,
    prefs.signingThreshold,
  );

  const txLogId = `txl_${nanoid(16)}`;

  if (routingMode === 'proxy') {
    // Server-side submission
    try {
      const cmdParams: import('../canton/partylayer-provider.js').CommandParams = {
        actAs: partyId,
        templateId: params.templateId,
        choice: params.choiceName,
        argument: params.argument,
      };
      if (params.contractId != null) cmdParams.contractId = params.contractId;
      if (params.commandType) cmdParams.commandType = params.commandType;

      const result = await provider.submitCommand(cmdParams);

      // Create transaction log with submitted status
      await db.insert(schema.transactionLogs).values({
        transactionLogId: txLogId,
        userId,
        partyId,
        walletConnectionId: params.walletConnectionId ?? null,
        txHash: result.transactionId,
        templateId: params.templateId,
        choiceName: params.choiceName,
        routingMode: 'proxy',
        status: 'submitted',
        amountUsd: params.amountUsd ?? null,
      });

      log.info({ txLogId, routingMode: 'proxy', partyId }, 'Transaction submitted via proxy');

      return {
        transactionLogId: txLogId,
        txHash: result.transactionId,
        status: 'submitted',
        routingMode: 'proxy',
        requiresWalletSign: false,
      };
    } catch (err) {
      // Log failure
      await db.insert(schema.transactionLogs).values({
        transactionLogId: txLogId,
        userId,
        partyId,
        walletConnectionId: params.walletConnectionId ?? null,
        templateId: params.templateId,
        choiceName: params.choiceName,
        routingMode: 'proxy',
        status: 'failed',
        amountUsd: params.amountUsd ?? null,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      });

      throw new AppError(
        'CANTON_ERROR',
        'Transaction submission failed',
        500,
        { originalError: err instanceof Error ? err.message : 'Unknown' },
      );
    }
  }

  // Wallet-sign mode: prepare payload for client signing
  const signCmdParams: import('../canton/partylayer-provider.js').CommandParams = {
    actAs: partyId,
    templateId: params.templateId,
    choice: params.choiceName,
    argument: params.argument,
  };
  if (params.contractId != null) signCmdParams.contractId = params.contractId;
  if (params.commandType) signCmdParams.commandType = params.commandType;

  const { payload, expiresAt } = await provider.prepareSigningPayload(signCmdParams);

  // Build metadata — include compound operation info for post-sign callbacks
  const txMetadata: Record<string, unknown> = { signingPayload: payload, expiresAt };
  if (params.compoundOp) {
    txMetadata.compoundOp = params.compoundOp;
    if (params.compoundMeta) txMetadata.compoundMeta = params.compoundMeta;
  }

  // Create transaction log with pending status
  await db.insert(schema.transactionLogs).values({
    transactionLogId: txLogId,
    userId,
    partyId,
    walletConnectionId: params.walletConnectionId ?? null,
    templateId: params.templateId,
    choiceName: params.choiceName,
    routingMode: 'wallet-sign',
    status: 'pending',
    amountUsd: params.amountUsd ?? null,
    metadata: txMetadata,
  });

  log.info({ txLogId, routingMode: 'wallet-sign', partyId }, 'Transaction pending wallet signature');

  return {
    transactionLogId: txLogId,
    txHash: null,
    status: 'pending',
    routingMode: 'wallet-sign',
    requiresWalletSign: true,
    signingPayload: payload,
  };
}

/**
 * Submit a wallet-signed transaction.
 */
export async function submitSignedTransaction(
  transactionLogId: string,
  signature: string,
): Promise<TransactionResult> {
  const db = requireDb();
  const provider = getPartyLayerProvider();

  // Load the pending transaction
  const txRows = await db
    .select()
    .from(schema.transactionLogs)
    .where(eq(schema.transactionLogs.transactionLogId, transactionLogId))
    .limit(1);

  const tx = txRows[0];
  if (!tx) {
    throw new AppError('NOT_FOUND', 'Transaction not found', 404);
  }

  if (tx.status !== 'pending') {
    throw new AppError('VALIDATION_ERROR', `Transaction is not pending (status: ${tx.status})`, 400);
  }

  const metadata = tx.metadata as Record<string, unknown> | null;
  const payload = metadata?.signingPayload as string | undefined;
  if (!payload) {
    throw new AppError('INTERNAL_ERROR', 'Signing payload not found', 500);
  }

  try {
    const result = await provider.submitSignedPayload(payload, signature);

    await db
      .update(schema.transactionLogs)
      .set({
        txHash: result.transactionId,
        status: 'submitted',
        confirmedAt: new Date(),
      })
      .where(eq(schema.transactionLogs.transactionLogId, transactionLogId));

    log.info({ transactionLogId }, 'Signed transaction submitted');

    // Execute post-sign callbacks for compound operations (e.g. RecordRepay on pool)
    const compoundOp = metadata?.compoundOp as string | undefined;
    if (compoundOp) {
      const callback = postSignCallbacks.get(compoundOp);
      if (callback) {
        try {
          await callback(transactionLogId, metadata as Record<string, unknown>);
          log.info({ transactionLogId, compoundOp }, 'Post-sign callback executed');
        } catch (cbErr) {
          log.warn({ transactionLogId, compoundOp, err: cbErr instanceof Error ? cbErr.message : 'unknown' }, 'Post-sign callback failed (non-fatal)');
        }
      }
    }

    return {
      transactionLogId,
      txHash: result.transactionId,
      status: 'submitted',
      routingMode: tx.routingMode as TransactionRoutingMode,
      requiresWalletSign: false,
    };
  } catch (err) {
    await db
      .update(schema.transactionLogs)
      .set({
        status: 'failed',
        errorMessage: err instanceof Error ? err.message : 'Signing submission failed',
      })
      .where(eq(schema.transactionLogs.transactionLogId, transactionLogId));

    throw new AppError('CANTON_ERROR', 'Signed transaction submission failed', 500);
  }
}

/**
 * Get the status of a specific transaction.
 */
export async function getTransactionStatus(
  transactionLogId: string,
): Promise<TransactionLog> {
  const db = requireDb();

  const rows = await db
    .select()
    .from(schema.transactionLogs)
    .where(eq(schema.transactionLogs.transactionLogId, transactionLogId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    throw new AppError('NOT_FOUND', 'Transaction not found', 404);
  }

  return toTransactionLog(row);
}

/**
 * Get transaction history for a user.
 */
export async function getUserTransactions(
  userId: string,
  limit = 50,
  offset = 0,
): Promise<TransactionLog[]> {
  const db = requireDb();

  const rows = await db
    .select()
    .from(schema.transactionLogs)
    .where(eq(schema.transactionLogs.userId, userId))
    .orderBy(desc(schema.transactionLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map(toTransactionLog);
}
