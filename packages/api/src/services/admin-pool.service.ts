import type { AdminPoolSummary, AdminPoolParams } from '@dualis/shared';

// ---------------------------------------------------------------------------
// Mock pool data
// ---------------------------------------------------------------------------

const MOCK_POOLS: (AdminPoolSummary & { totalSuppliers: number; totalBorrowers: number; params: AdminPoolParams })[] = [
  { poolId: 'usdc-main', name: 'USDC Main Pool', asset: 'USDC', status: 'active', tvl: 25_000_000, totalBorrow: 12_500_000, utilization: 0.50, supplyAPY: 0.032, borrowAPY: 0.058, maxLTV: 0.80, liquidationThreshold: 0.85, createdAt: '2024-06-01', totalSuppliers: 342, totalBorrowers: 89, params: { baseRatePerYear: 0.02, multiplierPerYear: 0.07, jumpMultiplierPerYear: 0.30, kink: 0.80, maxLTV: 0.80, liquidationThreshold: 0.85, liquidationPenalty: 0.04, liquidationBonus: 0.02, supplyCap: 1_000_000_000, borrowCap: 500_000_000 } },
  { poolId: 'wbtc-main', name: 'wBTC Pool', asset: 'wBTC', status: 'active', tvl: 10_000_000, totalBorrow: 3_500_000, utilization: 0.35, supplyAPY: 0.012, borrowAPY: 0.028, maxLTV: 0.73, liquidationThreshold: 0.80, createdAt: '2024-06-15', totalSuppliers: 156, totalBorrowers: 42, params: { baseRatePerYear: 0.01, multiplierPerYear: 0.04, jumpMultiplierPerYear: 0.50, kink: 0.65, maxLTV: 0.73, liquidationThreshold: 0.80, liquidationPenalty: 0.06, liquidationBonus: 0.03, supplyCap: 100_000_000, borrowCap: 50_000_000 } },
  { poolId: 'eth-main', name: 'ETH Pool', asset: 'ETH', status: 'active', tvl: 8_200_000, totalBorrow: 4_100_000, utilization: 0.50, supplyAPY: 0.018, borrowAPY: 0.034, maxLTV: 0.75, liquidationThreshold: 0.82, createdAt: '2024-07-01', totalSuppliers: 210, totalBorrowers: 67, params: { baseRatePerYear: 0.01, multiplierPerYear: 0.04, jumpMultiplierPerYear: 0.50, kink: 0.65, maxLTV: 0.75, liquidationThreshold: 0.82, liquidationPenalty: 0.05, liquidationBonus: 0.025, supplyCap: 200_000_000, borrowCap: 100_000_000 } },
  { poolId: 'tbill-main', name: 'T-Bill Pool', asset: 'T-BILL', status: 'active', tvl: 5_000_000, totalBorrow: 1_500_000, utilization: 0.30, supplyAPY: 0.042, borrowAPY: 0.052, maxLTV: 0.85, liquidationThreshold: 0.90, createdAt: '2024-08-01', totalSuppliers: 45, totalBorrowers: 12, params: { baseRatePerYear: 0.04, multiplierPerYear: 0.03, jumpMultiplierPerYear: 0.15, kink: 0.90, maxLTV: 0.85, liquidationThreshold: 0.90, liquidationPenalty: 0.03, liquidationBonus: 0.015, supplyCap: 500_000_000, borrowCap: 200_000_000 } },
  { poolId: 'cc-main', name: 'CC Token Pool', asset: 'CC', status: 'paused', tvl: 2_000_000, totalBorrow: 900_000, utilization: 0.45, supplyAPY: 0.045, borrowAPY: 0.095, maxLTV: 0.55, liquidationThreshold: 0.65, createdAt: '2024-09-01', totalSuppliers: 78, totalBorrowers: 23, params: { baseRatePerYear: 0.03, multiplierPerYear: 0.10, jumpMultiplierPerYear: 0.80, kink: 0.60, maxLTV: 0.55, liquidationThreshold: 0.65, liquidationPenalty: 0.08, liquidationBonus: 0.04, supplyCap: 50_000_000, borrowCap: 20_000_000 } },
  { poolId: 'spy-main', name: 'SPY ETF Pool', asset: 'SPY', status: 'active', tvl: 3_000_000, totalBorrow: 800_000, utilization: 0.27, supplyAPY: 0.015, borrowAPY: 0.032, maxLTV: 0.65, liquidationThreshold: 0.75, createdAt: '2024-10-01', totalSuppliers: 32, totalBorrowers: 8, params: { baseRatePerYear: 0.02, multiplierPerYear: 0.05, jumpMultiplierPerYear: 0.18, kink: 0.75, maxLTV: 0.65, liquidationThreshold: 0.75, liquidationPenalty: 0.06, liquidationBonus: 0.03, supplyCap: 100_000_000, borrowCap: 50_000_000 } },
];

const MOCK_POSITIONS = [
  { id: 'pos-1', user: 'party::alice', type: 'supply', amount: 500_000, valueUSD: 500_000, healthFactor: null, duration: '180 days' },
  { id: 'pos-2', user: 'party::bob', type: 'borrow', amount: 100_000, valueUSD: 100_000, healthFactor: 1.65, duration: '45 days' },
  { id: 'pos-3', user: 'party::carol', type: 'supply', amount: 250_000, valueUSD: 250_000, healthFactor: null, duration: '90 days' },
  { id: 'pos-4', user: 'party::dave', type: 'borrow', amount: 50_000, valueUSD: 50_000, healthFactor: 1.15, duration: '30 days' },
  { id: 'pos-5', user: 'party::eve', type: 'borrow', amount: 200_000, valueUSD: 200_000, healthFactor: 2.10, duration: '60 days' },
];

const MOCK_HISTORY = [
  { id: 1, event: 'supply', user: 'party::alice', amount: 500_000, timestamp: '2024-12-01T10:00:00Z' },
  { id: 2, event: 'borrow', user: 'party::bob', amount: 100_000, timestamp: '2024-12-02T14:30:00Z' },
  { id: 3, event: 'parameter_change', user: 'admin', amount: 0, timestamp: '2024-11-15T09:00:00Z' },
  { id: 4, event: 'withdraw', user: 'party::carol', amount: 50_000, timestamp: '2024-12-03T16:00:00Z' },
  { id: 5, event: 'repay', user: 'party::dave', amount: 25_000, timestamp: '2024-12-05T16:00:00Z' },
];

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

export function listPools(filters?: { status?: string; asset?: string; search?: string }, pagination?: { page: number; limit: number }) {
  let pools = [...MOCK_POOLS];

  if (filters?.status) pools = pools.filter((p) => p.status === filters.status);
  if (filters?.asset) pools = pools.filter((p) => p.asset === filters.asset);
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    pools = pools.filter((p) => p.name.toLowerCase().includes(s) || p.poolId.toLowerCase().includes(s));
  }

  const total = pools.length;
  const page = pagination?.page ?? 1;
  const limit = pagination?.limit ?? 20;
  const offset = (page - 1) * limit;

  return { data: pools.slice(offset, offset + limit), total, page, limit };
}

export function getPoolById(poolId: string) {
  return MOCK_POOLS.find((p) => p.poolId === poolId) ?? null;
}

export function createPool(data: { poolId: string; name: string; asset: string; params: AdminPoolParams }) {
  const newPool = {
    poolId: data.poolId,
    name: data.name,
    asset: data.asset,
    status: 'active' as const,
    tvl: 0,
    totalBorrow: 0,
    utilization: 0,
    supplyAPY: 0,
    borrowAPY: 0,
    maxLTV: data.params.maxLTV,
    liquidationThreshold: data.params.liquidationThreshold,
    createdAt: new Date().toISOString().slice(0, 10),
    totalSuppliers: 0,
    totalBorrowers: 0,
    params: data.params,
  };
  MOCK_POOLS.push(newPool);
  return newPool;
}

export function updatePoolParams(poolId: string, params: Partial<AdminPoolParams>) {
  const pool = MOCK_POOLS.find((p) => p.poolId === poolId);
  if (!pool) return null;
  const oldParams = { ...pool.params };
  Object.assign(pool.params, params);
  if (params.maxLTV !== undefined) pool.maxLTV = params.maxLTV;
  if (params.liquidationThreshold !== undefined) pool.liquidationThreshold = params.liquidationThreshold;
  return { oldParams, newParams: pool.params };
}

export function pausePool(poolId: string) {
  const pool = MOCK_POOLS.find((p) => p.poolId === poolId);
  if (!pool) return null;
  pool.status = 'paused';
  return pool;
}

export function resumePool(poolId: string) {
  const pool = MOCK_POOLS.find((p) => p.poolId === poolId);
  if (!pool) return null;
  pool.status = 'active';
  return pool;
}

export function archivePool(poolId: string) {
  const pool = MOCK_POOLS.find((p) => p.poolId === poolId);
  if (!pool) return null;
  pool.status = 'archived';
  return pool;
}

export function getPoolPositions(_poolId: string, pagination?: { page: number; limit: number }) {
  return { data: MOCK_POSITIONS, total: MOCK_POSITIONS.length, page: pagination?.page ?? 1, limit: pagination?.limit ?? 20 };
}

export function getPoolHistory(_poolId: string, pagination?: { page: number; limit: number }) {
  return { data: MOCK_HISTORY, total: MOCK_HISTORY.length, page: pagination?.page ?? 1, limit: pagination?.limit ?? 20 };
}
