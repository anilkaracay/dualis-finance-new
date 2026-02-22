import type { WsPricePayload } from '@dualis/shared';
import { env } from '../config/env.js';
import { createChildLogger } from '../config/logger.js';
import { channelManager } from '../ws/channels.js';
import { getDb, schema } from '../db/client.js';
import { registerJob } from './scheduler.js';

const log = createChildLogger('oracle-update');

// ---------------------------------------------------------------------------
// Mock base prices
// ---------------------------------------------------------------------------

interface AssetPriceConfig {
  /** Base price in USD. */
  basePrice: number;
  /**
   * Maximum random deviation per tick, expressed as a proportion.
   * e.g. 0.001 means +/- 0.1 %
   */
  maxDeviation: number;
  /** Source attribution for DB records. */
  source: string;
}

const ASSET_CONFIGS: Record<string, AssetPriceConfig> = {
  USDC:        { basePrice: 1.0,       maxDeviation: 0.001,  source: 'Chainlink PoR' },
  wBTC:        { basePrice: 97_234.56, maxDeviation: 0.005,  source: 'Chainlink Data Streams' },
  ETH:         { basePrice: 3_456.78,  maxDeviation: 0.005,  source: 'Chainlink Data Streams' },
  CC:          { basePrice: 2.30,      maxDeviation: 0.004,  source: 'Chainlink Data Streams' },
  'T-BILL-2026': { basePrice: 99.87,  maxDeviation: 0.0005, source: 'Chainlink NAVLink + DTCC' },
  'SPY-2026':  { basePrice: 512.45,   maxDeviation: 0.003,  source: 'Chainlink + market data' },
  DUAL:        { basePrice: 1.23,      maxDeviation: 0.006,  source: 'Dualis Oracle' },
};

/** Track the last emitted price so change percentages are meaningful. */
const lastPrices = new Map<string, number>();

// ---------------------------------------------------------------------------
// Job handler
// ---------------------------------------------------------------------------

async function oracleUpdateHandler(): Promise<void> {
  const now = new Date().toISOString();
  const db = getDb();

  for (const [asset, config] of Object.entries(ASSET_CONFIGS)) {
    // Randomise price: basePrice * (1 + random jitter within maxDeviation)
    const jitter = (Math.random() - 0.5) * 2 * config.maxDeviation;
    const price = Number((config.basePrice * (1 + jitter)).toFixed(8));

    // Compute delta against previous tick
    const prev = lastPrices.get(asset) ?? config.basePrice;
    const change = prev !== 0 ? (price - prev) / prev : 0;
    lastPrices.set(asset, price);

    // Build typed payload
    const payload: WsPricePayload = {
      asset,
      price,
      change: Number(change.toFixed(6)),
      ts: now,
    };

    // Broadcast to subscribers of the price channel
    channelManager.broadcast(`prices:${asset}`, payload);

    // Persist to DB if available
    if (db) {
      try {
        await db.insert(schema.priceHistory).values({
          asset,
          price: price.toString(),
          confidence: 0.99,
          source: config.source,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        log.warn({ err: message, asset }, 'Failed to insert price history');
      }
    }
  }

  log.debug({ assets: Object.keys(ASSET_CONFIGS).length }, 'Oracle prices updated');
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

registerJob('oracle-update', env.ORACLE_UPDATE_INTERVAL_MS, oracleUpdateHandler);
