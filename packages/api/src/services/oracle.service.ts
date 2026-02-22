// ============================================================================
// Oracle Service — Legacy Wrapper
// ============================================================================
// Thin compatibility layer that delegates to the new oracle pipeline.
// Keeps the same exported API signatures for existing route consumers.

import { createChildLogger } from '../config/logger.js';
import type {
  OraclePriceParams,
  OraclePriceItem,
  OraclePriceWithHistory,
} from '@dualis/shared';
import {
  getLatestPrices,
  getAssetPrice as getOracleAssetPrice,
} from '../oracle/oracle.service.js';

const log = createChildLogger('oracle-service');

/**
 * Get all current oracle prices.
 * Delegates to the new oracle pipeline; returns data in the legacy OraclePriceItem format.
 */
export function getAllPrices(): OraclePriceItem[] {
  const prices = getLatestPrices();

  if (prices.length === 0) {
    log.debug('No prices from oracle pipeline, returning empty');
    return [];
  }

  return prices.map((p) => ({
    asset: p.asset,
    quoteCurrency: 'USD',
    price: p.medianPrice,
    confidence: p.confidence,
    source: p.sources.map((s) => s.source).join('+') || 'Oracle Pipeline',
    timestamp: new Date(p.timestamp).toISOString(),
    change24h: 0,
    change24hPercent: 0,
  }));
}

/**
 * Get a single asset price, optionally with history.
 * Delegates to the new oracle pipeline.
 */
export function getAssetPrice(
  asset: string,
  params: OraclePriceParams,
): OraclePriceItem | OraclePriceWithHistory {
  const price = getOracleAssetPrice(asset);
  if (!price) {
    throw new Error(`Asset ${asset} not found`);
  }

  const current: OraclePriceItem = {
    asset: price.asset,
    quoteCurrency: 'USD',
    price: price.medianPrice,
    confidence: price.confidence,
    source: price.sources.map((s) => s.source).join('+') || 'Oracle Pipeline',
    timestamp: new Date(price.timestamp).toISOString(),
    change24h: 0,
    change24hPercent: 0,
  };

  if (params.history) {
    // Generate synthetic history from TWAP data
    const history = generatePriceHistory(price.medianPrice, params.period ?? '24h');
    return { current, history };
  }

  return current;
}

/**
 * Generate synthetic price history for backward compatibility.
 * Once we have enough priceSnapshots data, this can query the DB instead.
 */
function generatePriceHistory(
  currentPrice: number,
  period: string,
): Array<{ timestamp: string; price: number }> {
  const periodHours: Record<string, number> = {
    '1h': 1,
    '24h': 24,
    '7d': 168,
    '30d': 720,
  };
  const hours = periodHours[period] ?? 24;
  const intervalMs = (hours * 3_600_000) / 100;
  const nowMs = Date.now();
  const history: Array<{ timestamp: string; price: number }> = [];

  const volatility = currentPrice > 100 ? 0.005 : 0.001;

  for (let i = 100; i >= 0; i--) {
    const ts = new Date(nowMs - i * intervalMs);
    const jitter = 1 + Math.sin(i * 0.15) * volatility + (Math.random() - 0.5) * volatility;
    history.push({
      timestamp: ts.toISOString(),
      price: Number((currentPrice * jitter).toFixed(4)),
    });
  }

  return history;
}
