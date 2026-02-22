import Redis from 'ioredis';
import { env } from '../config/env.js';
import { createChildLogger } from '../config/logger.js';

const log = createChildLogger('redis');

let redisClient: Redis | null = null;

/**
 * Returns the shared Redis client instance.
 * Lazily initializes the connection on first call.
 * Returns `null` if Redis is not available (graceful degradation).
 */
export function getRedis(): Redis | null {
  if (!redisClient) {
    try {
      redisClient = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy(times: number): number | null {
          if (times > 10) return null;
          return Math.min(times * 200, 5000);
        },
        lazyConnect: true,
      });

      redisClient.on('error', (err: Error) => {
        log.warn({ err: err.message }, 'Redis error');
      });

      redisClient.on('connect', () => {
        log.info('Redis connected');
      });

      redisClient.connect().catch(() => {
        log.warn('Redis connection failed — running without cache');
        redisClient = null;
      });
    } catch {
      log.warn('Redis initialization failed — running without cache');
      return null;
    }
  }
  return redisClient;
}

/**
 * Cleanly shuts down the Redis connection.
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    log.info('Redis connection closed');
  }
}
