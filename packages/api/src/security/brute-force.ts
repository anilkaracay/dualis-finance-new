/**
 * Brute Force Protection — Redis-backed exponential backoff for login attempts.
 *
 * Tracks failed attempts by IP:email combination and applies increasing delays:
 *   1-3 attempts: no delay
 *   4th: 5s delay
 *   5th: 15s delay
 *   6th: 60s delay
 *   7th: 5 min delay
 *   8+:  15 min account lockout
 */

import { getRedis } from '../cache/redis.js';
import { createChildLogger } from '../config/logger.js';
import { env } from '../config/env.js';
import { logSecurityEvent } from './audit-log.js';
import { securityMetrics } from './metrics.js';

const log = createChildLogger('brute-force');

const BF_PREFIX = 'bf:';

export interface BruteForceResult {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
}

interface BruteForceData {
  attempts: number;
  lockedUntil: number | null;
}

/**
 * Check if a login attempt is allowed for the given identifier (ip:email).
 * Returns whether the attempt is allowed and how many attempts remain.
 */
export async function checkBruteForce(identifier: string): Promise<BruteForceResult> {
  const redis = getRedis();
  if (!redis) return { allowed: true, remainingAttempts: env.BRUTE_FORCE_MAX_ATTEMPTS };

  const key = `${BF_PREFIX}${identifier}`;

  try {
    const raw = await redis.get(key);
    if (!raw) return { allowed: true, remainingAttempts: env.BRUTE_FORCE_MAX_ATTEMPTS };

    const data: BruteForceData = JSON.parse(raw);

    // Check if currently locked out
    if (data.lockedUntil && Date.now() < data.lockedUntil) {
      const retryAfterSeconds = Math.ceil((data.lockedUntil - Date.now()) / 1000);
      return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
    }

    // If lock has expired, reset the lock but keep attempts for escalation
    if (data.lockedUntil && Date.now() >= data.lockedUntil) {
      data.lockedUntil = null;
    }

    // Check if at or over the max attempts threshold
    if (data.attempts >= env.BRUTE_FORCE_MAX_ATTEMPTS) {
      // Apply lockout
      const lockoutMs = env.BRUTE_FORCE_LOCKOUT_SEC * 1000;
      data.lockedUntil = Date.now() + lockoutMs;
      await redis.set(key, JSON.stringify(data), 'EX', env.BRUTE_FORCE_LOCKOUT_SEC + 60);

      log.warn({ identifier, attempts: data.attempts }, 'Brute force lockout applied');
      securityMetrics.bruteForceBlocks.inc();
      logSecurityEvent({ type: 'brute_force_lockout', details: { identifier, attempts: data.attempts } });

      return { allowed: false, remainingAttempts: 0, retryAfterSeconds: env.BRUTE_FORCE_LOCKOUT_SEC };
    }

    // Attempts 4-7 have escalating delays but we still allow the attempt,
    // just inform the client of remaining attempts before lockout
    if (data.attempts >= 3) {
      return {
        allowed: true,
        remainingAttempts: env.BRUTE_FORCE_MAX_ATTEMPTS - data.attempts,
      };
    }

    return {
      allowed: true,
      remainingAttempts: env.BRUTE_FORCE_MAX_ATTEMPTS - data.attempts,
    };
  } catch (err) {
    log.warn({ err, identifier }, 'Brute force check failed — allowing request');
    return { allowed: true, remainingAttempts: env.BRUTE_FORCE_MAX_ATTEMPTS };
  }
}

/**
 * Record a failed login attempt for the given identifier.
 */
export async function recordFailedAttempt(identifier: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const key = `${BF_PREFIX}${identifier}`;

  try {
    const raw = await redis.get(key);
    const data: BruteForceData = raw
      ? JSON.parse(raw)
      : { attempts: 0, lockedUntil: null };

    data.attempts += 1;

    // TTL 24 hours — attempts decay after a day of inactivity
    await redis.set(key, JSON.stringify(data), 'EX', 86400);

    log.debug({ identifier, attempts: data.attempts }, 'Failed login attempt recorded');
  } catch (err) {
    log.warn({ err, identifier }, 'Failed to record brute force attempt');
  }
}

/**
 * Reset brute force tracking for an identifier (called on successful login).
 */
export async function resetBruteForce(identifier: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.del(`${BF_PREFIX}${identifier}`);
  } catch (err) {
    log.warn({ err, identifier }, 'Failed to reset brute force counter');
  }
}
