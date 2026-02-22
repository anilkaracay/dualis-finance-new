import { describe, it, expect, vi } from 'vitest';

// Mock env with configurable threshold
vi.mock('../../config/env.js', () => ({
  env: {
    ORACLE_CIRCUIT_BREAKER_THRESHOLD: 0.10,
    ORACLE_MIN_SOURCES: 1,
  },
}));

// Mock logger
vi.mock('../../config/logger.js', () => ({
  createChildLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: () => 'test-alert-id',
}));

import {
  checkCircuitBreaker,
  resetCircuitBreaker,
  getAllBreakerStates,
  getAlerts,
} from '../circuit-breaker';

describe('circuit-breaker', () => {
  // Note: circuit breaker state is in-memory and persists across tests.
  // We use unique asset names per test to avoid interference.

  it('does not trip on first price for a new asset', () => {
    const state = checkCircuitBreaker('CB_TEST_1', 60000, 2);
    expect(state.isTripped).toBe(false);
    expect(state.lastValidPrice).toBe(60000);
  });

  it('does not trip on normal price change (< 10%)', () => {
    checkCircuitBreaker('CB_TEST_2', 60000, 2);
    const state = checkCircuitBreaker('CB_TEST_2', 63000, 2); // +5%
    expect(state.isTripped).toBe(false);
    expect(state.lastValidPrice).toBe(63000);
  });

  it('trips on large price deviation (> 10%)', () => {
    checkCircuitBreaker('CB_TEST_3', 60000, 2);
    const state = checkCircuitBreaker('CB_TEST_3', 48000, 2); // -20%
    expect(state.isTripped).toBe(true);
    expect(state.reason).toContain('deviation');
    expect(state.trippedAt).not.toBeNull();
    expect(state.recoversAt).not.toBeNull();
  });

  it('trips on insufficient sources', () => {
    const state = checkCircuitBreaker('CB_TEST_4', 60000, 0); // 0 sources
    expect(state.isTripped).toBe(true);
    expect(state.reason).toContain('Insufficient sources');
  });

  it('stays tripped until recovery window passes', () => {
    checkCircuitBreaker('CB_TEST_5', 60000, 2);
    checkCircuitBreaker('CB_TEST_5', 20000, 2); // trip

    // Still tripped with normal price
    const state = checkCircuitBreaker('CB_TEST_5', 60000, 2);
    expect(state.isTripped).toBe(true);
  });

  it('manual reset clears tripped state', () => {
    checkCircuitBreaker('CB_TEST_6', 60000, 2);
    checkCircuitBreaker('CB_TEST_6', 20000, 2); // trip

    resetCircuitBreaker('CB_TEST_6');

    const states = getAllBreakerStates();
    const state = states.find((s) => s.asset === 'CB_TEST_6');
    expect(state?.isTripped).toBe(false);
  });

  it('generates alerts on trip and reset', () => {
    checkCircuitBreaker('CB_TEST_7', 60000, 2);
    checkCircuitBreaker('CB_TEST_7', 20000, 2); // trip → alert
    resetCircuitBreaker('CB_TEST_7'); // reset → alert

    const alerts = getAlerts();
    expect(alerts.length).toBeGreaterThanOrEqual(2);

    const tripAlert = alerts.find(
      (a) => a.type === 'circuit_breaker_trip' && a.asset === 'CB_TEST_7',
    );
    const recoverAlert = alerts.find(
      (a) => a.type === 'circuit_breaker_recover' && a.asset === 'CB_TEST_7',
    );
    expect(tripAlert).toBeDefined();
    expect(recoverAlert).toBeDefined();
  });

  it('getAllBreakerStates returns all tracked assets', () => {
    checkCircuitBreaker('CB_TEST_A', 100, 2);
    checkCircuitBreaker('CB_TEST_B', 200, 2);

    const states = getAllBreakerStates();
    const assets = states.map((s) => s.asset);
    expect(assets).toContain('CB_TEST_A');
    expect(assets).toContain('CB_TEST_B');
  });
});
