// ============================================================================
// Oracle Redis Cache Layer
// ============================================================================

import { getRedis } from '../cache/redis.js';
import { createChildLogger } from '../config/logger.js';
import type { AggregatedPrice, TWAPData, OracleStatus } from './types.js';

const log = createChildLogger('oracle-cache');

/** TTL for price entries: 60 seconds */
const PRICE_TTL = 60;
/** TTL for TWAP entries: 300 seconds */
const TWAP_TTL = 300;
/** TTL for oracle status: 60 seconds */
const STATUS_TTL = 60;

// ---------------------------------------------------------------------------
// Price cache
// ---------------------------------------------------------------------------

export async function cachePrice(asset: string, price: AggregatedPrice): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.setex(`oracle:price:${asset}`, PRICE_TTL, JSON.stringify(price));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log.warn({ err: message, asset }, 'Failed to cache price');
  }
}

export async function getCachedPrice(asset: string): Promise<AggregatedPrice | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const data = await redis.get(`oracle:price:${asset}`);
    if (!data) return null;
    return JSON.parse(data) as AggregatedPrice;
  } catch {
    return null;
  }
}

export async function cacheAllPrices(prices: Map<string, AggregatedPrice>): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    const pipeline = redis.pipeline();
    for (const [asset, price] of prices) {
      pipeline.setex(`oracle:price:${asset}`, PRICE_TTL, JSON.stringify(price));
    }
    await pipeline.exec();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log.warn({ err: message }, 'Failed to batch cache prices');
  }
}

// ---------------------------------------------------------------------------
// TWAP cache
// ---------------------------------------------------------------------------

export async function cacheTWAP(asset: string, twap: TWAPData): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.setex(`oracle:twap:${asset}`, TWAP_TTL, JSON.stringify(twap));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log.warn({ err: message, asset }, 'Failed to cache TWAP');
  }
}

export async function getCachedTWAP(asset: string): Promise<TWAPData | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const data = await redis.get(`oracle:twap:${asset}`);
    if (!data) return null;
    return JSON.parse(data) as TWAPData;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Status cache
// ---------------------------------------------------------------------------

export async function cacheOracleStatus(status: OracleStatus): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.setex('oracle:status', STATUS_TTL, JSON.stringify(status));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log.warn({ err: message }, 'Failed to cache oracle status');
  }
}

export async function getCachedOracleStatus(): Promise<OracleStatus | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const data = await redis.get('oracle:status');
    if (!data) return null;
    return JSON.parse(data) as OracleStatus;
  } catch {
    return null;
  }
}
