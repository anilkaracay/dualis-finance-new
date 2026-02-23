/**
 * Session Security — JWT blacklist for revoked sessions.
 *
 * When a session is revoked, the associated access token's JTI is added
 * to a Redis blacklist. The blacklist entry TTL matches the access token lifetime,
 * after which the token would have expired naturally anyway.
 */

import { getRedis } from '../cache/redis.js';
import { createChildLogger } from '../config/logger.js';
import { logSecurityEvent } from './audit-log.js';
import { securityMetrics } from './metrics.js';

const log = createChildLogger('session-security');

const JWT_BLACKLIST_PREFIX = 'jwt:bl:';

/** Default access token TTL in seconds (15 minutes). */
const DEFAULT_ACCESS_TOKEN_TTL = 900;

/**
 * Add a JWT's JTI to the blacklist, preventing further use.
 * @param jti — the JWT's unique identifier (jti claim)
 * @param ttlSeconds — how long to keep the blacklist entry (default: 15 min)
 */
export async function blacklistAccessToken(
  jti: string,
  ttlSeconds: number = DEFAULT_ACCESS_TOKEN_TTL,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(`${JWT_BLACKLIST_PREFIX}${jti}`, '1', 'EX', ttlSeconds);
    log.debug({ jti }, 'Access token blacklisted');
    securityMetrics.sessionsRevoked.inc({ trigger: 'manual' });
    logSecurityEvent({ type: 'session_revoked', details: { jti } });
  } catch (err) {
    log.warn({ err, jti }, 'Failed to blacklist access token');
  }
}

/**
 * Check if a JWT's JTI has been blacklisted.
 */
export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    const result = await redis.exists(`${JWT_BLACKLIST_PREFIX}${jti}`);
    return result === 1;
  } catch (err) {
    log.warn({ err, jti }, 'JWT blacklist check failed — allowing token');
    return false;
  }
}
