// ============================================================================
// Canton Price Feed Sync
// ============================================================================
// Syncs aggregated prices to DAML PriceFeed contracts via BatchUpdatePrices.
// Only active when ORACLE_CANTON_SYNC_ENABLED=true.

import { CantonClient } from '../canton/client.js';
import { createChildLogger } from '../config/logger.js';
import { env } from '../config/env.js';
import type { AggregatedPrice } from './types.js';

const log = createChildLogger('oracle-canton-sync');

const PRICE_FEED_TEMPLATE = 'Dualis.Oracle.PriceFeed:PriceFeed';

/** Map our source type names to DAML OracleSource constructors */
const SOURCE_TYPE_MAP: Record<string, string> = {
  CoinGecko: 'Chainlink',     // Map to DAML enum values
  Binance: 'Pyth',
  ManualNAV: 'InternalFeed',
  TIFA: 'InternalFeed',
};

/**
 * Sync aggregated prices to Canton PriceFeed DAML contracts.
 * Non-blocking: failures are logged but don't propagate.
 */
export async function syncPricesToCanton(
  prices: Map<string, AggregatedPrice>,
): Promise<void> {
  if (!env.ORACLE_CANTON_SYNC_ENABLED) return;

  const canton = CantonClient.getInstance();
  let synced = 0;
  let failed = 0;

  for (const [asset, aggregated] of prices) {
    try {
      // Build PriceSourceEntry[] for DAML
      const newSources = aggregated.sources.map((s) => ({
        source: SOURCE_TYPE_MAP[s.source] ?? 'InternalFeed',
        priceUSD: s.price.toString(),
        timestamp: new Date(s.timestamp).toISOString(),
        confidence: s.confidence.toString(),
        isActive: true,
      }));

      // Query existing PriceFeed contract for this asset
      const contracts = await canton.queryContracts(PRICE_FEED_TEMPLATE, {
        asset,
      });

      if (contracts.length === 0) {
        log.debug({ asset }, 'No PriceFeed contract found, skipping sync');
        continue;
      }

      const firstContract = contracts[0];
      if (!firstContract) continue;
      const contractId = firstContract.contractId;

      // Exercise BatchUpdatePrices choice
      await canton.exerciseChoice(
        PRICE_FEED_TEMPLATE,
        contractId,
        'BatchUpdatePrices',
        {
          newSources,
          updateTime: new Date(aggregated.timestamp).toISOString(),
        },
      );

      synced++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      log.warn({ err: message, asset }, 'Canton sync failed for asset');
      failed++;
    }
  }

  if (synced > 0 || failed > 0) {
    log.info({ synced, failed }, 'Canton price sync complete');
  }
}
