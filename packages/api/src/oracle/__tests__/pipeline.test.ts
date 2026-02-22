import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('../../config/logger.js', () => ({
  createChildLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('../../config/env.js', () => ({
  env: {
    BINANCE_WS_ENABLED: false,
    BINANCE_WS_URL: 'wss://stream.binance.com:9443/ws',
    COINGECKO_BASE_URL: 'https://api.coingecko.com/api/v3',
    COINGECKO_API_KEY: undefined,
    ORACLE_CIRCUIT_BREAKER_THRESHOLD: 0.10,
    ORACLE_TWAP_WINDOW_MS: 300000,
    ORACLE_CANTON_SYNC_ENABLED: false,
    ORACLE_MIN_SOURCES: 1,
    ORACLE_UPDATE_INTERVAL_MS: 30000,
  },
}));

// Mock fetch for CoinGecko
const mockFetchResponse = {
  ok: true,
  json: async () => ({
    bitcoin: { usd: 62000, usd_24h_change: 1.5 },
    ethereum: { usd: 3400, usd_24h_change: -0.8 },
    'usd-coin': { usd: 1.0, usd_24h_change: 0.01 },
  }),
};
vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(mockFetchResponse)));

// Mock Redis (returns null = graceful degradation)
vi.mock('../../cache/redis.js', () => ({
  getRedis: () => null,
}));

// Mock DB
vi.mock('../../db/client.js', () => ({
  getDb: () => null,
  schema: {},
}));

// Mock WebSocket broadcast
const mockBroadcast = vi.fn();
vi.mock('../../ws/channels.js', () => ({
  channelManager: {
    broadcast: (...args: unknown[]) => mockBroadcast(...args),
  },
}));

// Mock Canton client
vi.mock('../../canton/client.js', () => ({
  CantonClient: {
    getInstance: () => ({
      queryContracts: vi.fn().mockResolvedValue([]),
      exerciseChoice: vi.fn().mockResolvedValue({ exerciseResult: {}, events: [] }),
    }),
  },
}));

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: () => 'test-id',
}));

import { initOracle, runOracleCycle, getLatestPrices, getOracleStatus } from '../oracle.service';

describe('oracle pipeline', () => {
  beforeEach(() => {
    mockBroadcast.mockClear();
  });

  it('initOracle returns a shutdown handle', () => {
    const handle = initOracle();
    expect(handle).toHaveProperty('shutdown');
    expect(typeof handle.shutdown).toBe('function');
    // Clean up
    handle.shutdown();
  });

  it('runOracleCycle fetches and aggregates prices', async () => {
    await runOracleCycle();

    const prices = getLatestPrices();
    expect(prices.length).toBeGreaterThan(0);

    // Should have BTC and ETH from CoinGecko mock
    const assets = prices.map((p) => p.asset);
    expect(assets).toContain('BTC');
    expect(assets).toContain('ETH');
  });

  it('prices have correct structure after cycle', async () => {
    await runOracleCycle();

    const prices = getLatestPrices();
    for (const price of prices) {
      expect(price).toHaveProperty('asset');
      expect(price).toHaveProperty('medianPrice');
      expect(price).toHaveProperty('sources');
      expect(price).toHaveProperty('confidence');
      expect(price).toHaveProperty('timestamp');
      expect(price.medianPrice).toBeGreaterThan(0);
      expect(price.confidence).toBeGreaterThan(0);
      expect(price.confidence).toBeLessThanOrEqual(1);
    }
  });

  it('broadcasts to WebSocket channels after cycle', async () => {
    mockBroadcast.mockClear();
    await runOracleCycle();

    // Should have broadcast to prices:BTC, prices:ETH, etc.
    expect(mockBroadcast).toHaveBeenCalled();
    const calledChannels = mockBroadcast.mock.calls.map((c) => c[0]);
    expect(calledChannels.some((ch: string) => ch.startsWith('prices:'))).toBe(true);
  });

  it('getOracleStatus returns pipeline health', async () => {
    await runOracleCycle();

    const status = getOracleStatus();
    expect(status).toHaveProperty('isHealthy');
    expect(status).toHaveProperty('sourceStatuses');
    expect(status).toHaveProperty('aggregatedPrices');
    expect(status).toHaveProperty('circuitBreakers');
    expect(Array.isArray(status.sourceStatuses)).toBe(true);
    expect(status.sourceStatuses.length).toBeGreaterThan(0);
  });

  it('includes manual NAV prices in aggregation', async () => {
    await runOracleCycle();

    const prices = getLatestPrices();
    const assets = prices.map((p) => p.asset);

    // Manual NAV assets
    expect(assets).toContain('T-BILL-2026');
    expect(assets).toContain('SPY-2026');
  });

  it('handles CoinGecko failure gracefully', async () => {
    // Override fetch to fail
    const originalFetch = globalThis.fetch;
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Network error'))));

    // Should not throw
    await expect(runOracleCycle()).resolves.not.toThrow();

    // Restore
    vi.stubGlobal('fetch', originalFetch);
  });
});
