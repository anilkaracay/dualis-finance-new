/**
 * IP Ban Mechanism — Temporarily bans IPs that repeatedly hit rate limits.
 *
 * After BAN_THRESHOLD (default 3) rate-limit violations within 1 hour,
 * the IP is temporarily banned for BAN_DURATION_SECONDS (default 15 min).
 */

import { getRedis } from '../cache/redis.js';
import { createChildLogger } from '../config/logger.js';
import { env } from '../config/env.js';
import { logSecurityEvent } from './audit-log.js';
import { securityMetrics } from './metrics.js';

const log = createChildLogger('ip-ban');

const BAN_PREFIX = 'ban:';
const VIOLATION_PREFIX = 'rl_violation:';

/**
 * Check if an IP is currently banned.
 */
export async function isBanned(ip: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    const result = await redis.get(`${BAN_PREFIX}${ip}`);
    return result !== null;
  } catch (err) {
    log.warn({ err, ip }, 'Ban check failed — allowing request');
    return false;
  }
}

/**
 * Record a rate-limit violation for an IP.
 * Returns true if the IP was just banned.
 */
export async function recordRateLimitViolation(ip: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  const key = `${VIOLATION_PREFIX}${ip}`;

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      // Set 1-hour window for violation tracking
      await redis.expire(key, 3600);
    }

    if (count >= env.BAN_THRESHOLD) {
      // Ban the IP
      await redis.set(`${BAN_PREFIX}${ip}`, '1', 'EX', env.BAN_DURATION_SECONDS);
      // Reset violation counter
      await redis.del(key);

      log.warn(
        { ip, violations: count, banDurationSeconds: env.BAN_DURATION_SECONDS },
        'IP banned due to repeated rate limit violations',
      );
      securityMetrics.ipBans.inc();
      logSecurityEvent({ type: 'ip_banned', ip, details: { violations: count, banDurationSeconds: env.BAN_DURATION_SECONDS } });

      return true;
    }

    return false;
  } catch (err) {
    log.warn({ err, ip }, 'Failed to record rate limit violation');
    return false;
  }
}
