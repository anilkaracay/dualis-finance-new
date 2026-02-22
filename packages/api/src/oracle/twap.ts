// ============================================================================
// TWAP (Time-Weighted Average Price) Calculator
// ============================================================================

import { createChildLogger } from '../config/logger.js';
import type { TWAPData, TWAPSample } from './types.js';

const log = createChildLogger('oracle-twap');

/** Rolling sample buffers per asset */
const sampleBuffers = new Map<string, TWAPSample[]>();

/** Max samples to keep per asset (enough for 1h at 30s intervals) */
const MAX_SAMPLES = 150;

/** Window durations in milliseconds */
const WINDOW_5M = 5 * 60 * 1000;
const WINDOW_15M = 15 * 60 * 1000;
const WINDOW_1H = 60 * 60 * 1000;

/**
 * Add a new price sample and recalculate TWAP windows.
 */
export function updateTWAP(asset: string, price: number, timestamp: number): TWAPData {
  let samples = sampleBuffers.get(asset);
  if (!samples) {
    samples = [];
    sampleBuffers.set(asset, samples);
  }

  // Add new sample
  samples.push({ price, timestamp });

  // Prune old samples (older than 1h)
  const cutoff = timestamp - WINDOW_1H;
  while (samples.length > 0 && samples[0] !== undefined && samples[0].timestamp < cutoff) {
    samples.shift();
  }

  // Also enforce max buffer size
  while (samples.length > MAX_SAMPLES) {
    samples.shift();
  }

  // Calculate TWAP for each window
  const price5m = calculateTWAPForWindow(samples, timestamp, WINDOW_5M);
  const price15m = calculateTWAPForWindow(samples, timestamp, WINDOW_15M);
  const price1h = calculateTWAPForWindow(samples, timestamp, WINDOW_1H);

  return {
    price5m,
    price15m,
    price1h,
    sampleCount: samples.length,
    lastSampleTs: timestamp,
  };
}

/**
 * Get current TWAP data for an asset without adding a new sample.
 */
export function getTWAP(asset: string): TWAPData | null {
  const samples = sampleBuffers.get(asset);
  if (!samples || samples.length === 0) return null;

  const now = Date.now();
  const lastSample = samples[samples.length - 1];

  return {
    price5m: calculateTWAPForWindow(samples, now, WINDOW_5M),
    price15m: calculateTWAPForWindow(samples, now, WINDOW_15M),
    price1h: calculateTWAPForWindow(samples, now, WINDOW_1H),
    sampleCount: samples.length,
    lastSampleTs: lastSample ? lastSample.timestamp : now,
  };
}

/**
 * Calculate TWAP for a specific time window.
 *
 * Time-weighted: each sample's weight is proportional to the time it
 * was the "current" price (duration until the next sample).
 */
function calculateTWAPForWindow(
  samples: TWAPSample[],
  now: number,
  windowMs: number,
): number | null {
  const windowStart = now - windowMs;
  const windowSamples = samples.filter((s) => s.timestamp >= windowStart);

  if (windowSamples.length === 0) return null;

  const first = windowSamples[0];
  if (!first) return null;
  if (windowSamples.length === 1) return first.price;

  let weightedSum = 0;
  let totalWeight = 0;

  for (let i = 0; i < windowSamples.length; i++) {
    const current = windowSamples[i];
    if (!current) continue;

    const next = windowSamples[i + 1];
    const nextTs = next ? next.timestamp : now;
    const weight = nextTs - current.timestamp;

    weightedSum += current.price * weight;
    totalWeight += weight;
  }

  const lastSample = windowSamples[windowSamples.length - 1];
  if (totalWeight === 0) return lastSample ? lastSample.price : null;

  return Number((weightedSum / totalWeight).toFixed(8));
}

/**
 * Clear all TWAP data (used in tests or reset scenarios).
 */
export function clearTWAPData(): void {
  sampleBuffers.clear();
  log.debug('TWAP data cleared');
}
