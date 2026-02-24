import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockBroadcast, mockInsert, registeredHandlers } = vi.hoisted(() => {
  const mockBroadcast = vi.fn();
  const mockInsert = vi.fn(() => ({ values: vi.fn(async () => {}) }));
  const registeredHandlers: Array<{ name: string; interval: number; handler: () => Promise<void> }> = [];
  return { mockBroadcast, mockInsert, registeredHandlers };
});

vi.mock('../../config/logger.js', () => ({
  createChildLogger: () => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  }),
}));

vi.mock('../../ws/channels.js', () => ({
  channelManager: { broadcast: mockBroadcast },
}));

vi.mock('../../db/client.js', () => ({
  getDb: vi.fn(() => ({ insert: mockInsert })),
  schema: { poolSnapshots: 'poolSnapshots' },
}));

vi.mock('../scheduler.js', () => ({
  registerJob: vi.fn((name: string, interval: number, handler: () => Promise<void>) => {
    registeredHandlers.push({ name, interval, handler });
  }),
}));

// Mock @dualis/shared math functions
vi.mock('@dualis/shared', async () => {
  const actual = await vi.importActual('@dualis/shared');
  return {
    ...actual,
    calculateUtilization: vi.fn(() => 0.7),
    calculatePoolAPY: vi.fn((_model: any, _util: number, side: string) =>
      side === 'supply' ? 0.035 : 0.08,
    ),
    accrueInterest: vi.fn(() => ({
      newTotalBorrows: 35100,
      newTotalReserves: 1020,
      newBorrowIndex: 1.0001,
      newSupplyIndex: 1.00005,
    })),
  };
});

// Mock poolRegistry so we control the pool data
const mockPool = {
  poolId: 'usdc-main',
  isActive: true,
  totalSupply: 50_000,
  totalBorrow: 35_000,
  totalReserves: 1_000,
  borrowIndex: 1.0,
  supplyIndex: 1.0,
  lastAccrualTs: Math.floor(Date.now() / 1000) - 300,
  asset: { symbol: 'USDC', priceUSD: 1 },
};

const inactivePool = {
  poolId: 'paused-pool',
  isActive: false,
  totalSupply: 10_000,
  totalBorrow: 0,
  totalReserves: 0,
  borrowIndex: 1.0,
  supplyIndex: 1.0,
  lastAccrualTs: Math.floor(Date.now() / 1000) - 300,
  asset: { symbol: 'ETH', priceUSD: 3200 },
};

vi.mock('../../services/poolRegistry.js', () => ({
  getAllPools: vi.fn(() => [{ ...mockPool }, { ...inactivePool }]),
  getPoolRateModel: vi.fn(() => ({
    baseRate: 0.02,
    multiplier: 0.1,
    kink: 0.8,
    jumpMultiplier: 0.3,
    reserveFactor: 0.1,
  })),
}));

// Import the job module (triggers registerJob call at module level)
import '../interestAccrual.job';

describe('Interest Accrual Job', () => {
  let handler: () => Promise<void>;

  beforeEach(() => {
    mockBroadcast.mockClear();
    mockInsert.mockClear();
    handler = registeredHandlers.find((h) => h.name === 'interest-accrual')!.handler;
  });

  it('registers the job with scheduler', () => {
    expect(registeredHandlers.some((h) => h.name === 'interest-accrual')).toBe(true);
    const job = registeredHandlers.find((h) => h.name === 'interest-accrual')!;
    expect(job.interval).toBe(5 * 60 * 1_000);
  });

  it('processes active pools and skips inactive ones', async () => {
    await handler();
    const poolBroadcasts = mockBroadcast.mock.calls.filter(
      (c: any[]) => typeof c[0] === 'string' && c[0].startsWith('pool:'),
    );
    expect(poolBroadcasts.length).toBeGreaterThanOrEqual(1);
    const pausedBroadcasts = mockBroadcast.mock.calls.filter(
      (c: any[]) => c[0] === 'pool:paused-pool',
    );
    expect(pausedBroadcasts.length).toBe(0);
  });

  it('broadcasts pool updates via WebSocket', async () => {
    await handler();
    const call = mockBroadcast.mock.calls.find((c: any[]) => c[0] === 'pool:usdc-main');
    expect(call).toBeDefined();
    const payload = call![1];
    expect(payload).toHaveProperty('poolId', 'usdc-main');
    expect(payload).toHaveProperty('totalSupply');
    expect(payload).toHaveProperty('borrowAPY');
    expect(payload).toHaveProperty('ts');
  });

  it('persists snapshot to DB when available', async () => {
    await handler();
    expect(mockInsert).toHaveBeenCalled();
  });
});
