// ============================================================================
// Oracle Service — Main Pipeline Orchestrator
// ============================================================================
// Coordinates: Sources → Aggregation → Circuit Breaker → TWAP → Cache →
//              DB Persist → Canton Sync → WebSocket Broadcast

import { createChildLogger } from '../config/logger.js';
import { channelManager } from '../ws/channels.js';
import { getDb, schema } from '../db/client.js';
import type { WsPricePayload } from '@dualis/shared';

// Source adapters
import { fetchCoinGeckoPrices } from './sources/coingecko.js';
import { createBinanceWsStream, getBinanceLatestPrices } from './sources/binance.js';
import { getManualNAVPrices } from './sources/manual.js';
import { fetchTIFAPrices } from './sources/tifa.js';

// Pipeline stages
import { aggregatePrices } from './aggregator.js';
import { checkCircuitBreaker, getAllBreakerStates, getAlerts as getCBAlerts } from './circuit-breaker.js';
import { updateTWAP, getTWAP as getTWAPData } from './twap.js';
import { cacheAllPrices, cacheTWAP, cacheOracleStatus } from './cache.js';
import { syncPricesToCanton } from './canton-sync.js';

// Types
import type {
  RawPrice,
  AggregatedPrice,
  OracleStatus,
  OracleAlert,
  SourceStatus,
  TWAPData,
} from './types.js';
import { COINGECKO_ID_MAP, BINANCE_SYMBOL_MAP } from './types.js';

const log = createChildLogger('oracle-service');

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** Latest aggregated prices (in-memory for fast access) */
const latestPrices = new Map<string, AggregatedPrice>();

/** Source adapter statuses */
const sourceStatuses = {
  CoinGecko: { source: 'CoinGecko' as const, isConnected: true, lastFetchTs: null as number | null, lastError: null as string | null, assetCount: 0 },
  Binance: { source: 'Binance' as const, isConnected: false, lastFetchTs: null as number | null, lastError: null as string | null, assetCount: 0 },
  ManualNAV: { source: 'ManualNAV' as const, isConnected: true, lastFetchTs: null as number | null, lastError: null as string | null, assetCount: 0 },
  TIFA: { source: 'TIFA' as const, isConnected: true, lastFetchTs: null as number | null, lastError: null as string | null, assetCount: 0 },
};

/** Last cycle timing */
let lastCycleTs: number | null = null;
let lastCycleDurationMs: number | null = null;

/** Binance WS shutdown handle */
let binanceHandle: { close(): void } | null = null;

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Initialize the oracle pipeline.
 * Starts Binance WS (if enabled) and returns a shutdown handle.
 */
export function initOracle(): { shutdown(): Promise<void> } {
  log.info('Initializing oracle pipeline');

  // Start Binance WS for real-time prices
  const binanceAssets = Object.keys(BINANCE_SYMBOL_MAP);
  binanceHandle = createBinanceWsStream(binanceAssets, (_price) => {
    // Real-time prices are collected in getBinanceLatestPrices()
    // and consumed in the next oracle cycle
    sourceStatuses.Binance.isConnected = true;
    sourceStatuses.Binance.lastFetchTs = Date.now();
  });

  return {
    async shutdown(): Promise<void> {
      log.info('Shutting down oracle pipeline');
      if (binanceHandle) {
        binanceHandle.close();
        binanceHandle = null;
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Main Oracle Cycle
// ---------------------------------------------------------------------------

/**
 * Run a single oracle pipeline cycle.
 * Called by the job scheduler on each tick.
 */
export async function runOracleCycle(): Promise<void> {
  const cycleStart = Date.now();

  try {
    // Step 1: Fetch from all sources in parallel
    const cgAssets = Object.keys(COINGECKO_ID_MAP);
    const [cgPrices, tifaPrices] = await Promise.all([
      fetchCoinGeckoPrices(cgAssets).catch((err) => {
        sourceStatuses.CoinGecko.lastError = err instanceof Error ? err.message : String(err);
        return [] as RawPrice[];
      }),
      fetchTIFAPrices().catch((err) => {
        sourceStatuses.TIFA.lastError = err instanceof Error ? err.message : String(err);
        return [] as RawPrice[];
      }),
    ]);

    const binancePrices = getBinanceLatestPrices();
    const manualPrices = getManualNAVPrices();

    // Update source statuses
    if (cgPrices.length > 0) {
      sourceStatuses.CoinGecko.lastFetchTs = Date.now();
      sourceStatuses.CoinGecko.assetCount = cgPrices.length;
      sourceStatuses.CoinGecko.lastError = null;
    }
    sourceStatuses.Binance.assetCount = binancePrices.length;
    sourceStatuses.ManualNAV.lastFetchTs = Date.now();
    sourceStatuses.ManualNAV.assetCount = manualPrices.length;
    if (tifaPrices.length > 0) {
      sourceStatuses.TIFA.lastFetchTs = Date.now();
      sourceStatuses.TIFA.assetCount = tifaPrices.length;
      sourceStatuses.TIFA.lastError = null;
    }

    // Step 2: Combine all raw prices
    const allRawPrices: RawPrice[] = [
      ...cgPrices,
      ...binancePrices,
      ...manualPrices,
      ...tifaPrices,
    ];

    if (allRawPrices.length === 0) {
      log.warn('No prices from any source');
      return;
    }

    // Step 3: Aggregate (median across sources)
    const aggregated = aggregatePrices(allRawPrices);

    // Step 4: Circuit breaker check + TWAP update per asset
    const now = Date.now();
    for (const [asset, price] of aggregated) {
      const breaker = checkCircuitBreaker(asset, price.medianPrice, price.sources.length);

      if (breaker.isTripped) {
        // Use last valid price instead when tripped
        const existing = latestPrices.get(asset);
        if (existing) {
          aggregated.set(asset, existing);
        }
        continue;
      }

      // Update TWAP
      const twap = updateTWAP(asset, price.medianPrice, now);
      price.twap = twap;
    }

    // Step 5: Update in-memory state
    for (const [asset, price] of aggregated) {
      latestPrices.set(asset, price);
    }

    // Step 6: Cache to Redis (non-blocking)
    await cacheAllPrices(aggregated).catch(() => {});

    // Cache TWAP data
    for (const [asset, price] of aggregated) {
      if (price.twap) {
        await cacheTWAP(asset, price.twap).catch(() => {});
      }
    }

    // Step 7: Persist to DB
    const db = getDb();
    if (db) {
      for (const [, price] of aggregated) {
        try {
          await db.insert(schema.priceSnapshots).values({
            asset: price.asset,
            medianPrice: price.medianPrice.toString(),
            sources: price.sources.map((s) => ({
              source: s.source,
              price: s.price,
              confidence: s.confidence,
              timestamp: s.timestamp,
            })),
            confidence: price.confidence,
            twapData: price.twap as unknown as Record<string, unknown>,
            circuitBreakerActive: false,
          });
        } catch {
          // DB insert failures are non-critical
        }
      }

      // Also persist to legacy priceHistory table for backward compat
      for (const [, price] of aggregated) {
        try {
          await db.insert(schema.priceHistory).values({
            asset: price.asset,
            price: price.medianPrice.toString(),
            confidence: price.confidence,
            source: price.sources.map((s) => s.source).join('+'),
          });
        } catch {
          // Non-critical
        }
      }
    }

    // Step 8: Sync to Canton (if enabled, non-blocking)
    await syncPricesToCanton(aggregated).catch((err) => {
      const message = err instanceof Error ? err.message : String(err);
      log.warn({ err: message }, 'Canton sync failed');
    });

    // Step 9: Broadcast to WebSocket subscribers
    for (const [asset, price] of aggregated) {
      const prev = latestPrices.get(asset);
      const prevPrice = prev?.medianPrice ?? price.medianPrice;
      const change = prevPrice !== 0 ? (price.medianPrice - prevPrice) / prevPrice : 0;

      const payload: WsPricePayload = {
        asset,
        price: price.medianPrice,
        change: Number(change.toFixed(6)),
        ts: new Date(price.timestamp).toISOString(),
      };
      channelManager.broadcast(`prices:${asset}`, payload);
    }

    // Step 10: Cache oracle status
    const status = buildOracleStatus(aggregated);
    await cacheOracleStatus(status).catch(() => {});

    lastCycleTs = now;
    lastCycleDurationMs = Date.now() - cycleStart;

    log.debug(
      { assets: aggregated.size, durationMs: lastCycleDurationMs },
      'Oracle cycle completed',
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log.error({ err: message }, 'Oracle cycle failed');
    lastCycleDurationMs = Date.now() - cycleStart;
  }
}

// ---------------------------------------------------------------------------
// Public API (used by routes & legacy service wrapper)
// ---------------------------------------------------------------------------

/** Get all latest aggregated prices */
export function getLatestPrices(): AggregatedPrice[] {
  return [...latestPrices.values()];
}

/** Get a single asset's aggregated price */
export function getAssetPrice(asset: string): AggregatedPrice | null {
  return latestPrices.get(asset) ?? null;
}

/** Get TWAP data for an asset */
export function getAssetTWAP(asset: string): TWAPData | null {
  return getTWAPData(asset);
}

/** Get full oracle status */
export function getOracleStatus(): OracleStatus {
  return buildOracleStatus(latestPrices);
}

/** Get recent alerts */
export function getOracleAlerts(): OracleAlert[] {
  return getCBAlerts();
}

/** Get source adapter statuses */
export function getSourceStatuses(): SourceStatus[] {
  return Object.values(sourceStatuses);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildOracleStatus(prices: Map<string, AggregatedPrice>): OracleStatus {
  return {
    sourceStatuses: Object.values(sourceStatuses),
    aggregatedPrices: [...prices.values()],
    circuitBreakers: getAllBreakerStates(),
    lastCycleTs,
    lastCycleDurationMs,
    isHealthy: prices.size > 0 && lastCycleTs != null && Date.now() - lastCycleTs < 120_000,
  };
}
