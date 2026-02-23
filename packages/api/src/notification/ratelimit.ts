import type { NotificationChannel, NotificationSeverity, NotificationType } from '@dualis/shared';
import { DEDUP_WINDOWS, DEFAULT_DEDUP_WINDOW_MS } from '@dualis/shared';
import { getRedis } from '../cache/redis.js';
import { createChildLogger } from '../config/logger.js';
import { env } from '../config/env.js';

const log = createChildLogger('notification-ratelimit');

// ---------------------------------------------------------------------------
// Rate limits per channel (per user, per window)
// ---------------------------------------------------------------------------

const RATE_LIMITS: Record<NotificationChannel, { max: number; windowMs: number }> = {
  email:     { max: env.NOTIFICATION_EMAIL_RATE_LIMIT, windowMs: 3600_000 },   // 10/hour
  websocket: { max: 60,  windowMs: 60_000 },      // 60/minute
  webhook:   { max: 100, windowMs: 3600_000 },     // 100/hour
  in_app:    { max: 200, windowMs: 3600_000 },     // 200/hour
};

// ---------------------------------------------------------------------------
// Rate limit check
// ---------------------------------------------------------------------------

/**
 * Check if a notification to this channel is within rate limits.
 * Critical notifications always bypass rate limits.
 *
 * @returns `true` if allowed, `false` if rate-limited
 */
export async function checkRateLimit(
  channel: NotificationChannel,
  partyId: string,
  severity: NotificationSeverity,
): Promise<boolean> {
  // Critical events always pass
  if (severity === 'critical') return true;

  const redis = getRedis();
  if (!redis) return true; // No Redis → allow (graceful degradation)

  const limit = RATE_LIMITS[channel];
  if (!limit) return true;

  const windowSeconds = Math.ceil(limit.windowMs / 1000);
  const key = `ratelimit:notif:${channel}:${partyId}:${Math.floor(Date.now() / limit.windowMs)}`;

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }

    if (count > limit.max) {
      log.debug({ channel, partyId, count, max: limit.max }, 'Rate limit exceeded');
      return false;
    }

    return true;
  } catch (err) {
    log.warn({ err, channel, partyId }, 'Rate limit check failed — allowing');
    return true;
  }
}

// ---------------------------------------------------------------------------
// Deduplication check
// ---------------------------------------------------------------------------

/**
 * Check if a notification with this dedup key was already sent within the window.
 * Uses SETNX (SET if Not eXists) + EXPIRE.
 *
 * @returns `true` if this is a NEW notification (not a duplicate), `false` if duplicate
 */
export async function checkDedup(
  dedupKey: string,
  type: NotificationType,
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return true; // No Redis → allow

  const windowMs = DEDUP_WINDOWS[type] ?? DEFAULT_DEDUP_WINDOW_MS;
  const windowSeconds = Math.ceil(windowMs / 1000);
  const key = `dedup:notif:${dedupKey}`;

  try {
    // SET key value NX EX seconds → returns 'OK' if set, null if exists
    const result = await redis.set(key, '1', 'EX', windowSeconds, 'NX');

    if (result === null) {
      log.debug({ dedupKey, type, windowMs }, 'Duplicate notification suppressed');
      return false;
    }

    return true;
  } catch (err) {
    log.warn({ err, dedupKey }, 'Dedup check failed — allowing');
    return true;
  }
}

// ---------------------------------------------------------------------------
// HF severity escalation — reset dedup when severity escalates
// ---------------------------------------------------------------------------

const HF_SEVERITY_ORDER: NotificationType[] = [
  'HEALTH_FACTOR_CAUTION',
  'HEALTH_FACTOR_DANGER',
  'HEALTH_FACTOR_CRITICAL',
];

/**
 * When HF severity escalates (e.g. caution → danger), clear lower-severity
 * dedup keys so the user gets the new, more urgent notification immediately.
 */
export async function clearHfDedupOnEscalation(
  partyId: string,
  positionId: string,
  currentType: NotificationType,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const currentIdx = HF_SEVERITY_ORDER.indexOf(currentType);
  if (currentIdx <= 0) return; // Not an HF type or already the lowest

  // Clear dedup keys for lower severity levels
  const lowerTypes = HF_SEVERITY_ORDER.slice(0, currentIdx);
  const keys = lowerTypes.map((t) => `dedup:notif:${partyId}:${t}:${positionId}`);

  try {
    if (keys.length > 0) {
      await redis.del(...keys);
      log.debug({ partyId, positionId, currentType, cleared: lowerTypes }, 'HF dedup escalation cleared');
    }
  } catch (err) {
    log.warn({ err }, 'Failed to clear HF dedup keys');
  }
}

// ---------------------------------------------------------------------------
// Unread count helpers (Redis cache for fast reads)
// ---------------------------------------------------------------------------

export async function incrementUnreadCount(partyId: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;

  try {
    return await redis.incr(`notification:unread:${partyId}`);
  } catch {
    return 0;
  }
}

export async function decrementUnreadCount(partyId: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;

  try {
    const val = await redis.decr(`notification:unread:${partyId}`);
    // Don't go below 0
    if (val < 0) {
      await redis.set(`notification:unread:${partyId}`, '0');
      return 0;
    }
    return val;
  } catch {
    return 0;
  }
}

export async function getUnreadCount(partyId: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;

  try {
    const val = await redis.get(`notification:unread:${partyId}`);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

export async function resetUnreadCount(partyId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(`notification:unread:${partyId}`, '0');
  } catch {
    // ignore
  }
}
