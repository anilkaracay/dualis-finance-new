import { getRedis } from './redis.js';
import { createChildLogger } from '../config/logger.js';

const log = createChildLogger('cache');

// ---------------------------------------------------------------------------
// TTL constants (seconds)
// ---------------------------------------------------------------------------

const TTL = {
  price: 5,
  poolList: 5,
  poolDetail: 10,
  creditScore: 30,
  protocolConfig: 300,
} as const;

// ---------------------------------------------------------------------------
// Key prefixes
// ---------------------------------------------------------------------------

const PREFIX = {
  price: 'price:',
  poolList: 'pools:list',
  poolDetail: 'pools:detail:',
  creditScore: 'credit:',
  protocolConfig: 'config:protocol',
} as const;

// ---------------------------------------------------------------------------
// CacheService
// ---------------------------------------------------------------------------

export class CacheService {
  // -------------------------------------------------------------------------
  // Generic operations
  // -------------------------------------------------------------------------

  /** Retrieve a cached value by key, returning null on miss or error. */
  async get<T>(key: string): Promise<T | null> {
    const redis = getRedis();
    if (!redis) return null;

    try {
      const raw = await redis.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      log.warn({ err, key }, 'Cache get error');
      return null;
    }
  }

  /** Store a value in the cache with a TTL in seconds. */
  async set<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    const redis = getRedis();
    if (!redis) return;

    try {
      await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
    } catch (err) {
      log.warn({ err, key }, 'Cache set error');
    }
  }

  /** Delete a specific cache key. */
  async del(key: string): Promise<void> {
    const redis = getRedis();
    if (!redis) return;

    try {
      await redis.del(key);
    } catch (err) {
      log.warn({ err, key }, 'Cache del error');
    }
  }

  /** Delete all keys matching a glob-style pattern. */
  async invalidatePattern(pattern: string): Promise<void> {
    const redis = getRedis();
    if (!redis) return;

    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } while (cursor !== '0');
    } catch (err) {
      log.warn({ err, pattern }, 'Cache invalidatePattern error');
    }
  }

  // -------------------------------------------------------------------------
  // Price cache
  // -------------------------------------------------------------------------

  async getPrice<T>(asset: string): Promise<T | null> {
    return this.get<T>(`${PREFIX.price}${asset}`);
  }

  async setPrice<T>(asset: string, data: T): Promise<void> {
    return this.set(`${PREFIX.price}${asset}`, data, TTL.price);
  }

  // -------------------------------------------------------------------------
  // Pool list cache
  // -------------------------------------------------------------------------

  async getPoolList<T>(): Promise<T | null> {
    return this.get<T>(PREFIX.poolList);
  }

  async setPoolList<T>(data: T): Promise<void> {
    return this.set(PREFIX.poolList, data, TTL.poolList);
  }

  // -------------------------------------------------------------------------
  // Pool detail cache
  // -------------------------------------------------------------------------

  async getPoolDetail<T>(poolId: string): Promise<T | null> {
    return this.get<T>(`${PREFIX.poolDetail}${poolId}`);
  }

  async setPoolDetail<T>(poolId: string, data: T): Promise<void> {
    return this.set(`${PREFIX.poolDetail}${poolId}`, data, TTL.poolDetail);
  }

  // -------------------------------------------------------------------------
  // Credit score cache
  // -------------------------------------------------------------------------

  async getCreditScore<T>(partyId: string): Promise<T | null> {
    return this.get<T>(`${PREFIX.creditScore}${partyId}`);
  }

  async setCreditScore<T>(partyId: string, data: T): Promise<void> {
    return this.set(`${PREFIX.creditScore}${partyId}`, data, TTL.creditScore);
  }

  // -------------------------------------------------------------------------
  // Protocol config cache
  // -------------------------------------------------------------------------

  async getProtocolConfig<T>(): Promise<T | null> {
    return this.get<T>(PREFIX.protocolConfig);
  }

  async setProtocolConfig<T>(data: T): Promise<void> {
    return this.set(PREFIX.protocolConfig, data, TTL.protocolConfig);
  }

  // -------------------------------------------------------------------------
  // Targeted invalidation
  // -------------------------------------------------------------------------

  /** Invalidate all cached data for a specific pool. */
  async invalidatePool(poolId: string): Promise<void> {
    await this.del(`${PREFIX.poolDetail}${poolId}`);
    await this.del(PREFIX.poolList);
  }

  /** Invalidate cached credit score for a specific party. */
  async invalidateCredit(partyId: string): Promise<void> {
    await this.del(`${PREFIX.creditScore}${partyId}`);
  }

  /** Flush all application cache keys. */
  async invalidateAll(): Promise<void> {
    await this.invalidatePattern('price:*');
    await this.invalidatePattern('pools:*');
    await this.invalidatePattern('credit:*');
    await this.del(PREFIX.protocolConfig);
  }
}

/** Singleton cache service instance. */
export const cacheService = new CacheService();
