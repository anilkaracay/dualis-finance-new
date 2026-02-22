// ============================================================================
// CoinGecko REST Price Source
// ============================================================================

import { createChildLogger } from '../../config/logger.js';
import { env } from '../../config/env.js';
import type { RawPrice } from '../types.js';
import { COINGECKO_ID_MAP } from '../types.js';

const log = createChildLogger('oracle-coingecko');

/** Reverse map: coingecko id → our asset symbol */
const REVERSE_MAP = new Map<string, string>();
for (const [symbol, cgId] of Object.entries(COINGECKO_ID_MAP)) {
  // First mapping wins (e.g. BTC wins over wBTC for 'bitcoin')
  if (!REVERSE_MAP.has(cgId)) {
    REVERSE_MAP.set(cgId, symbol);
  }
}

/**
 * Fetch prices from CoinGecko /simple/price endpoint.
 * Free tier: ~30 req/min, no API key required.
 */
export async function fetchCoinGeckoPrices(assets: string[]): Promise<RawPrice[]> {
  const cgIds = new Set<string>();
  for (const asset of assets) {
    const id = COINGECKO_ID_MAP[asset];
    if (id) cgIds.add(id);
  }

  if (cgIds.size === 0) return [];

  const ids = [...cgIds].join(',');
  const url = `${env.COINGECKO_BASE_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (env.COINGECKO_API_KEY) {
    headers['x-cg-demo-api-key'] = env.COINGECKO_API_KEY;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      log.warn({ status: response.status }, 'CoinGecko API returned non-200');
      return [];
    }

    const data = (await response.json()) as Record<
      string,
      { usd?: number; usd_24h_change?: number }
    >;

    const now = Date.now();
    const results: RawPrice[] = [];

    for (const [cgId, priceData] of Object.entries(data)) {
      if (priceData.usd == null) continue;

      // Map back to all our asset symbols that use this CoinGecko ID
      for (const [symbol, mappedId] of Object.entries(COINGECKO_ID_MAP)) {
        if (mappedId === cgId && assets.includes(symbol)) {
          results.push({
            asset: symbol,
            price: priceData.usd,
            source: 'CoinGecko',
            timestamp: now,
            confidence: 0.95,
          });
        }
      }
    }

    log.debug({ count: results.length }, 'CoinGecko prices fetched');
    return results;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log.warn({ err: message }, 'CoinGecko fetch failed');
    return [];
  }
}
