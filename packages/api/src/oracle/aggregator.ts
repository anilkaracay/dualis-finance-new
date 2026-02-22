// ============================================================================
// Price Aggregator — Median Calculation Across Sources
// ============================================================================

import { createChildLogger } from '../config/logger.js';
import type { RawPrice, AggregatedPrice } from './types.js';

const log = createChildLogger('oracle-aggregator');

/** Maximum age for a price source to be considered valid (5 minutes) */
const MAX_SOURCE_AGE_MS = 5 * 60 * 1000;

/**
 * Aggregate raw prices from all sources into median-based prices per asset.
 *
 * - Groups prices by asset symbol
 * - Filters out stale sources (> 5 min old)
 * - Computes median price across active sources
 * - Computes weighted confidence score
 */
export function aggregatePrices(rawPrices: RawPrice[]): Map<string, AggregatedPrice> {
  const now = Date.now();
  const grouped = new Map<string, RawPrice[]>();

  // Group by asset
  for (const raw of rawPrices) {
    const list = grouped.get(raw.asset) ?? [];
    list.push(raw);
    grouped.set(raw.asset, list);
  }

  const results = new Map<string, AggregatedPrice>();

  for (const [asset, sources] of grouped) {
    // Filter stale sources
    const fresh = sources.filter((s) => now - s.timestamp < MAX_SOURCE_AGE_MS);

    if (fresh.length === 0) {
      log.debug({ asset }, 'No fresh sources, skipping aggregation');
      continue;
    }

    const prices = fresh.map((s) => s.price);
    const medianPrice = calculateMedian(prices);
    const confidence = calculateConfidence(fresh);

    results.set(asset, {
      asset,
      medianPrice,
      sources: fresh,
      twap: null, // TWAP filled later by oracle service
      confidence,
      timestamp: now,
    });
  }

  log.debug({ assetCount: results.size }, 'Prices aggregated');
  return results;
}

/**
 * Calculate median of a number array.
 * For even-length arrays, returns the average of the two middle values.
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const first = values[0];
  if (values.length === 1 && first !== undefined) return first;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    const a = sorted[mid - 1] ?? 0;
    const b = sorted[mid] ?? 0;
    return (a + b) / 2;
  }
  return sorted[mid] ?? 0;
}

/**
 * Calculate weighted confidence based on source count and individual confidences.
 */
function calculateConfidence(sources: RawPrice[]): number {
  if (sources.length === 0) return 0;

  // Average confidence weighted by a bonus for more sources
  const avgConfidence = sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length;
  const sourceBonus = Math.min(sources.length / 3, 1); // max bonus at 3+ sources

  return Math.min(avgConfidence * (0.8 + 0.2 * sourceBonus), 1.0);
}
