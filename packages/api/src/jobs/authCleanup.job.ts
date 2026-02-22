import { lt } from 'drizzle-orm';
import { createChildLogger } from '../config/logger.js';
import { getDb, schema } from '../db/client.js';
import { registerJob } from './scheduler.js';

const log = createChildLogger('auth-cleanup');

// ---------------------------------------------------------------------------
// Interval — every 6 hours
// ---------------------------------------------------------------------------

const INTERVAL_MS = 6 * 60 * 60 * 1_000;

// ---------------------------------------------------------------------------
// Retention windows
// ---------------------------------------------------------------------------

/** Expired sessions older than this are removed. */
const SESSION_RETENTION_DAYS = 30;

/** Expired wallet nonces older than this are removed. */
const NONCE_RETENTION_HOURS = 24;

/** Used/expired email verification tokens older than this are removed. */
const EMAIL_TOKEN_RETENTION_DAYS = 7;

/** Used/expired password reset tokens older than this are removed. */
const PASSWORD_TOKEN_RETENTION_DAYS = 7;

/** Login events older than this are removed. */
const LOGIN_EVENT_RETENTION_DAYS = 90;

// ---------------------------------------------------------------------------
// Job handler
// ---------------------------------------------------------------------------

/**
 * Cleans up expired auth artifacts:
 * - Expired sessions
 * - Expired wallet nonces
 * - Expired email verification tokens
 * - Expired password reset tokens
 * - Old login event audit records
 */
async function authCleanupHandler(): Promise<void> {
  const db = getDb();

  if (!db) {
    log.debug('Database unavailable — auth cleanup skipped');
    return;
  }

  const now = new Date();

  try {
    // 1. Expired sessions
    const sessionCutoff = new Date(now.getTime() - SESSION_RETENTION_DAYS * 24 * 60 * 60 * 1_000);
    await db
      .delete(schema.sessions)
      .where(lt(schema.sessions.expiresAt, sessionCutoff));

    // 2. Expired wallet nonces
    const nonceCutoff = new Date(now.getTime() - NONCE_RETENTION_HOURS * 60 * 60 * 1_000);
    await db
      .delete(schema.walletNonces)
      .where(lt(schema.walletNonces.expiresAt, nonceCutoff));

    // 3. Expired email verification tokens
    const emailTokenCutoff = new Date(now.getTime() - EMAIL_TOKEN_RETENTION_DAYS * 24 * 60 * 60 * 1_000);
    await db
      .delete(schema.emailVerificationTokens)
      .where(lt(schema.emailVerificationTokens.expiresAt, emailTokenCutoff));

    // 4. Expired password reset tokens
    const pwTokenCutoff = new Date(now.getTime() - PASSWORD_TOKEN_RETENTION_DAYS * 24 * 60 * 60 * 1_000);
    await db
      .delete(schema.passwordResetTokens)
      .where(lt(schema.passwordResetTokens.expiresAt, pwTokenCutoff));

    // 5. Old login events
    const loginEventCutoff = new Date(now.getTime() - LOGIN_EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1_000);
    await db
      .delete(schema.loginEvents)
      .where(lt(schema.loginEvents.createdAt, loginEventCutoff));

    log.info(
      {
        sessionCutoff: sessionCutoff.toISOString(),
        nonceCutoff: nonceCutoff.toISOString(),
        loginEventCutoff: loginEventCutoff.toISOString(),
      },
      'Auth cleanup complete',
    );
  } catch (err) {
    log.error({ err }, 'Auth cleanup failed');
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

registerJob('auth-cleanup', INTERVAL_MS, authCleanupHandler);
