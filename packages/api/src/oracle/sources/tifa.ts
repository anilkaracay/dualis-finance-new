// ============================================================================
// TIFA Cross-Protocol Price Source (Mock)
// ============================================================================

import { createChildLogger } from '../../config/logger.js';
import type { RawPrice } from '../types.js';
import { DEFAULT_TIFA_PRICES } from '../types.js';

const log = createChildLogger('oracle-tifa');

/**
 * Fetch TIFA cross-protocol reference prices.
 * Currently returns mock data for DUAL token and ecosystem benchmarks.
 * In production, this would call the TIFA protocol API.
 */
export async function fetchTIFAPrices(): Promise<RawPrice[]> {
  const now = Date.now();
  const results: RawPrice[] = [];

  for (const [asset, basePrice] of Object.entries(DEFAULT_TIFA_PRICES)) {
    // Add small realistic jitter (0.1%)
    const jitter = (Math.random() - 0.5) * 0.002 * basePrice;
    const price = Number((basePrice + jitter).toFixed(4));

    results.push({
      asset,
      price,
      source: 'TIFA',
      timestamp: now,
      confidence: 0.90,
    });
  }

  log.debug({ count: results.length }, 'TIFA prices fetched');
  return results;
}
