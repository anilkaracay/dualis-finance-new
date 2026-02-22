import { describe, it, expect } from 'vitest';
import { aggregatePrices, calculateMedian } from '../aggregator';
import type { RawPrice } from '../types';

describe('calculateMedian', () => {
  it('returns 0 for empty array', () => {
    expect(calculateMedian([])).toBe(0);
  });

  it('returns the single value for one element', () => {
    expect(calculateMedian([42])).toBe(42);
  });

  it('returns average of two middle for even count', () => {
    expect(calculateMedian([10, 20])).toBe(15);
    expect(calculateMedian([1, 2, 3, 4])).toBe(2.5);
  });

  it('returns middle value for odd count', () => {
    expect(calculateMedian([1, 2, 3])).toBe(2);
    expect(calculateMedian([10, 30, 50, 70, 90])).toBe(50);
  });

  it('handles unsorted input', () => {
    expect(calculateMedian([50, 10, 30])).toBe(30);
    expect(calculateMedian([100, 1, 50, 25])).toBe(37.5);
  });

  it('handles identical values', () => {
    expect(calculateMedian([5, 5, 5, 5, 5])).toBe(5);
  });
});

describe('aggregatePrices', () => {
  const now = Date.now();

  function makeRaw(asset: string, price: number, source: string = 'CoinGecko'): RawPrice {
    return {
      asset,
      price,
      source: source as RawPrice['source'],
      timestamp: now,
      confidence: 0.95,
    };
  }

  it('aggregates single source per asset', () => {
    const raw = [makeRaw('BTC', 60000), makeRaw('ETH', 3000)];
    const result = aggregatePrices(raw);

    expect(result.size).toBe(2);
    expect(result.get('BTC')?.medianPrice).toBe(60000);
    expect(result.get('ETH')?.medianPrice).toBe(3000);
  });

  it('calculates median across multiple sources', () => {
    const raw = [
      makeRaw('BTC', 60000, 'CoinGecko'),
      makeRaw('BTC', 61000, 'Binance'),
      makeRaw('BTC', 60500, 'TIFA'),
    ];
    const result = aggregatePrices(raw);

    expect(result.get('BTC')?.medianPrice).toBe(60500);
    expect(result.get('BTC')?.sources.length).toBe(3);
  });

  it('computes confidence based on source count', () => {
    const single = aggregatePrices([makeRaw('ETH', 3000)]);
    const triple = aggregatePrices([
      makeRaw('ETH', 3000, 'CoinGecko'),
      makeRaw('ETH', 3010, 'Binance'),
      makeRaw('ETH', 2990, 'TIFA'),
    ]);

    const singleConf = single.get('ETH')?.confidence ?? 0;
    const tripleConf = triple.get('ETH')?.confidence ?? 0;

    // More sources should give higher (or equal) confidence
    expect(tripleConf).toBeGreaterThanOrEqual(singleConf);
  });

  it('filters out stale sources (> 5 min old)', () => {
    const staleTs = now - 6 * 60 * 1000; // 6 minutes ago
    const raw: RawPrice[] = [
      { asset: 'BTC', price: 60000, source: 'CoinGecko', timestamp: staleTs, confidence: 0.95 },
      { asset: 'BTC', price: 61000, source: 'Binance', timestamp: now, confidence: 0.98 },
    ];

    const result = aggregatePrices(raw);
    expect(result.get('BTC')?.sources.length).toBe(1);
    expect(result.get('BTC')?.medianPrice).toBe(61000);
  });

  it('returns empty map when all sources are stale', () => {
    const staleTs = now - 10 * 60 * 1000;
    const raw: RawPrice[] = [
      { asset: 'BTC', price: 60000, source: 'CoinGecko', timestamp: staleTs, confidence: 0.95 },
    ];

    const result = aggregatePrices(raw);
    expect(result.size).toBe(0);
  });

  it('handles empty input', () => {
    const result = aggregatePrices([]);
    expect(result.size).toBe(0);
  });
});
