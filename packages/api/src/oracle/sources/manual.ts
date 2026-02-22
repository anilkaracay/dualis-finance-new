// ============================================================================
// Manual NAV Price Source (RWA Assets)
// ============================================================================

import { createChildLogger } from '../../config/logger.js';
import type { RawPrice } from '../types.js';
import { DEFAULT_NAV_PRICES } from '../types.js';

const log = createChildLogger('oracle-manual');

/** In-memory store for manually configured NAV prices */
const navPrices = new Map<string, { price: number; updatedAt: number }>();

// Initialize from defaults
for (const [asset, price] of Object.entries(DEFAULT_NAV_PRICES)) {
  navPrices.set(asset, { price, updatedAt: Date.now() });
}

/**
 * Get current manual NAV prices for all configured RWA assets.
 */
export function getManualNAVPrices(): RawPrice[] {
  const results: RawPrice[] = [];

  for (const [asset, entry] of navPrices) {
    results.push({
      asset,
      price: entry.price,
      source: 'ManualNAV',
      timestamp: entry.updatedAt,
      confidence: 0.99, // Manual entries are high-confidence
    });
  }

  log.debug({ count: results.length }, 'Manual NAV prices retrieved');
  return results;
}

/**
 * Update a manual NAV price. Used by admin API endpoint.
 */
export function updateManualPrice(asset: string, price: number): void {
  navPrices.set(asset, { price, updatedAt: Date.now() });
  log.info({ asset, price }, 'Manual NAV price updated');
}

/**
 * Get a single manual price entry.
 */
export function getManualPrice(asset: string): { price: number; updatedAt: number } | null {
  return navPrices.get(asset) ?? null;
}

/**
 * List all manually configured assets.
 */
export function getManualAssets(): string[] {
  return [...navPrices.keys()];
}
