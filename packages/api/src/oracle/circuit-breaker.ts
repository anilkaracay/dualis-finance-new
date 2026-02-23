// ============================================================================
// Circuit Breaker — Price Anomaly Protection
// ============================================================================

import { nanoid } from 'nanoid';
import { createChildLogger } from '../config/logger.js';
import { env } from '../config/env.js';
import type { CircuitBreakerState, OracleAlert } from './types.js';
import { notificationBus } from '../notification/notification.bus.js';

const log = createChildLogger('oracle-circuit-breaker');

/** Auto-recovery window: 60 seconds after trip */
const RECOVERY_WINDOW_MS = 60_000;

/** In-memory circuit breaker states per asset */
const breakers = new Map<string, CircuitBreakerState>();

/** Recent alerts (kept in memory, capped at 100) */
const alerts: OracleAlert[] = [];
const MAX_ALERTS = 100;

/**
 * Check if a new price triggers the circuit breaker for an asset.
 *
 * Trips if:
 * - Price deviation > ORACLE_CIRCUIT_BREAKER_THRESHOLD (default 10%) from last valid price
 * - Source count < ORACLE_MIN_SOURCES
 *
 * Auto-recovers after RECOVERY_WINDOW_MS if subsequent prices are normal.
 */
export function checkCircuitBreaker(
  asset: string,
  newPrice: number,
  sourceCount: number,
): CircuitBreakerState {
  const now = Date.now();
  let state = breakers.get(asset);

  if (!state) {
    state = {
      asset,
      isTripped: false,
      reason: null,
      trippedAt: null,
      recoversAt: null,
      lastValidPrice: null,
    };
    breakers.set(asset, state);
  }

  // Check for auto-recovery
  if (state.isTripped && state.recoversAt && now >= state.recoversAt) {
    state.isTripped = false;
    state.reason = null;
    state.trippedAt = null;
    state.recoversAt = null;
    addAlert({
      type: 'circuit_breaker_recover',
      asset,
      message: `Circuit breaker recovered for ${asset} (auto-recovery)`,
      severity: 'info',
    });
    log.info({ asset }, 'Circuit breaker auto-recovered');
  }

  // If already tripped and not recovered, keep tripped
  if (state.isTripped) {
    return state;
  }

  // Check source count
  if (sourceCount < env.ORACLE_MIN_SOURCES) {
    trip(state, `Insufficient sources for ${asset}: ${sourceCount} < ${env.ORACLE_MIN_SOURCES}`, now);
    return state;
  }

  // Check price deviation
  if (state.lastValidPrice != null && state.lastValidPrice > 0) {
    const deviation = Math.abs(newPrice - state.lastValidPrice) / state.lastValidPrice;
    if (deviation > env.ORACLE_CIRCUIT_BREAKER_THRESHOLD) {
      trip(
        state,
        `Price deviation ${(deviation * 100).toFixed(1)}% for ${asset} exceeds threshold ${(env.ORACLE_CIRCUIT_BREAKER_THRESHOLD * 100).toFixed(0)}%`,
        now,
      );
      return state;
    }
  }

  // Price is valid — update last valid
  state.lastValidPrice = newPrice;
  return state;
}

/**
 * Manually reset a circuit breaker (admin action).
 */
export function resetCircuitBreaker(asset: string): void {
  const state = breakers.get(asset);
  if (state) {
    state.isTripped = false;
    state.reason = null;
    state.trippedAt = null;
    state.recoversAt = null;
    addAlert({
      type: 'circuit_breaker_recover',
      asset,
      message: `Circuit breaker manually reset for ${asset}`,
      severity: 'info',
    });
    log.info({ asset }, 'Circuit breaker manually reset');
  }
}

/**
 * Get all circuit breaker states.
 */
export function getAllBreakerStates(): CircuitBreakerState[] {
  return [...breakers.values()];
}

/**
 * Get circuit breaker state for a specific asset.
 */
export function getBreakerState(asset: string): CircuitBreakerState | null {
  return breakers.get(asset) ?? null;
}

/**
 * Get recent alerts (newest first).
 */
export function getAlerts(): OracleAlert[] {
  return [...alerts].reverse();
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function trip(state: CircuitBreakerState, reason: string, now: number): void {
  state.isTripped = true;
  state.reason = reason;
  state.trippedAt = now;
  state.recoversAt = now + RECOVERY_WINDOW_MS;
  addAlert({
    type: 'circuit_breaker_trip',
    asset: state.asset,
    message: reason,
    severity: 'warning',
  });
  log.warn({ asset: state.asset, reason }, 'Circuit breaker tripped');

  // MP20: Notify admin users about circuit breaker trip
  notificationBus.emit({
    type: 'ORACLE_CIRCUIT_BREAKER',
    category: 'system',
    severity: 'critical',
    partyId: 'party::operator', // Admin party
    title: `Circuit Breaker: ${state.asset}`,
    message: reason,
    data: { asset: state.asset, reason },
    deduplicationKey: `oracle:cb:${state.asset}`,
    channels: ['in_app'],
  }).catch(() => { /* non-blocking */ });
}

function addAlert(partial: Omit<OracleAlert, 'id' | 'timestamp' | 'metadata'>): void {
  alerts.push({
    ...partial,
    id: nanoid(),
    metadata: {},
    timestamp: Date.now(),
  });
  // Cap alerts
  while (alerts.length > MAX_ALERTS) {
    alerts.shift();
  }
}
