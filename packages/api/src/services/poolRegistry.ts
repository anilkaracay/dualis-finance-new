/**
 * Centralized Pool Registry — single source of truth for all pool state.
 *
 * Every service (pool.service, borrow.service, admin-pool.service,
 * interestAccrual.job) reads from and writes to this registry.  When a new
 * pool is created via the admin API the registry is updated and all
 * operations (deposit, withdraw, borrow, repay, add-collateral, interest
 * accrual) immediately work for the new pool — no hardcoded maps to update.
 *
 * When CANTON_MOCK=false, pools are loaded from the Canton ledger on startup
 * via loadFromCanton(). When CANTON_MOCK=true, hardcoded INITIAL_POOLS are used.
 */

import {
  getRateModel,
  type InterestRateModelConfig,
} from '@dualis/shared';
import { createChildLogger } from '../config/logger.js';
import { env } from '../config/env.js';

const log = createChildLogger('pool-registry');

// ---------------------------------------------------------------------------
// Pool State type
// ---------------------------------------------------------------------------

export interface PoolState {
  poolId: string;
  asset: { symbol: string; type: string; priceUSD: number };
  totalSupply: number;
  totalBorrow: number;
  totalReserves: number;
  borrowIndex: number;
  supplyIndex: number;
  lastAccrualTs: number; // Unix seconds
  isActive: boolean;
  contractId: string;
}

// ---------------------------------------------------------------------------
// Initial seed pools (used when CANTON_MOCK=true)
// ---------------------------------------------------------------------------

const now = () => Math.floor(Date.now() / 1000);

const INITIAL_POOLS: PoolState[] = [
  {
    poolId: 'usdc-main',
    asset: { symbol: 'USDC', type: 'Stablecoin', priceUSD: 1.0 },
    totalSupply: 245_600_000,
    totalBorrow: 178_200_000,
    totalReserves: 4_912_000,
    borrowIndex: 1.0,
    supplyIndex: 1.0,
    lastAccrualTs: now() - 300,
    isActive: true,
    contractId: 'canton::pool::usdc-main::001',
  },
  {
    poolId: 'wbtc-main',
    asset: { symbol: 'wBTC', type: 'CryptoCurrency', priceUSD: 67_710 },
    totalSupply: 1_850,
    totalBorrow: 920,
    totalReserves: 12.5,
    borrowIndex: 1.0,
    supplyIndex: 1.0,
    lastAccrualTs: now() - 300,
    isActive: true,
    contractId: 'canton::pool::wbtc-main::002',
  },
  {
    poolId: 'eth-main',
    asset: { symbol: 'ETH', type: 'CryptoCurrency', priceUSD: 2_041 },
    totalSupply: 45_200,
    totalBorrow: 28_900,
    totalReserves: 340,
    borrowIndex: 1.0,
    supplyIndex: 1.0,
    lastAccrualTs: now() - 300,
    isActive: true,
    contractId: 'canton::pool::eth-main::003',
  },
  {
    poolId: 'cc-main',
    asset: { symbol: 'CC', type: 'CryptoCurrency', priceUSD: 1.00 },
    totalSupply: 89_000_000,
    totalBorrow: 34_200_000,
    totalReserves: 890_000,
    borrowIndex: 1.0,
    supplyIndex: 1.0,
    lastAccrualTs: now() - 300,
    isActive: true,
    contractId: 'canton::pool::cc-main::004',
  },
  {
    poolId: 'tbill-2026',
    asset: { symbol: 'T-BILL-2026', type: 'TokenizedTreasury', priceUSD: 99.87 },
    totalSupply: 320_000_000,
    totalBorrow: 245_000_000,
    totalReserves: 3_200_000,
    borrowIndex: 1.0,
    supplyIndex: 1.0,
    lastAccrualTs: now() - 300,
    isActive: true,
    contractId: 'canton::pool::tbill-2026::005',
  },
  {
    poolId: 'spy-2026',
    asset: { symbol: 'SPY-2026', type: 'TokenizedEquity', priceUSD: 512.45 },
    totalSupply: 156_000_000,
    totalBorrow: 89_400_000,
    totalReserves: 1_560_000,
    borrowIndex: 1.0,
    supplyIndex: 1.0,
    lastAccrualTs: now() - 300,
    isActive: true,
    contractId: 'canton::pool::spy-2026::006',
  },
];

// ---------------------------------------------------------------------------
// Canton LendingPool → PoolState mapping
// ---------------------------------------------------------------------------

/** Map Canton DAML instrumentType to our internal type string. */
function mapInstrumentType(instrumentType: string): string {
  const typeMap: Record<string, string> = {
    Stablecoin: 'Stablecoin',
    CryptoCurrency: 'CryptoCurrency',
    TokenizedTreasury: 'TokenizedTreasury',
    TokenizedEquity: 'TokenizedEquity',
    TokenizedReceivable: 'TokenizedReceivable',
  };
  return typeMap[instrumentType] ?? instrumentType;
}

/** Convert a Canton LendingPool contract payload to a PoolState. */
function cantonPoolToState(
  contractId: string,
  payload: Record<string, unknown>,
): PoolState {
  const asset = payload.asset as Record<string, unknown> | undefined;
  const accrual = payload.accrual as Record<string, unknown> | undefined;
  const symbol = (asset?.symbol as string) ?? 'UNKNOWN';
  const instrumentType = (asset?.instrumentType as string) ?? 'CryptoCurrency';
  const priceUSD = parseFloat((asset?.priceUSD as string) ?? '1');

  return {
    poolId: (payload.poolId as string) ?? 'unknown',
    asset: {
      symbol,
      type: mapInstrumentType(instrumentType),
      priceUSD,
    },
    totalSupply: parseFloat((payload.totalSupply as string) ?? '0'),
    totalBorrow: parseFloat((payload.totalBorrow as string) ?? '0'),
    totalReserves: parseFloat((payload.totalReserves as string) ?? '0'),
    borrowIndex: parseFloat((accrual?.borrowIndex as string) ?? '1'),
    supplyIndex: parseFloat((accrual?.supplyIndex as string) ?? '1'),
    // Canton sends lastAccrualTs as string "0" for bootstrap pools.
    // Parse to number and use current time if 0 so interest accrual
    // starts from "now" rather than epoch 0.
    lastAccrualTs: Number(accrual?.lastAccrualTs) || now(),
    isActive: (payload.isActive as boolean) ?? true,
    contractId,
  };
}

// ---------------------------------------------------------------------------
// Registry (mutable in-memory store)
// ---------------------------------------------------------------------------

const pools: Map<string, PoolState> = new Map();

// Seed initial pools (CANTON_MOCK=true mode). When CANTON_MOCK=false,
// loadFromCanton() will be called at startup and these will be replaced.
if (env.CANTON_MOCK) {
  for (const p of INITIAL_POOLS) {
    pools.set(p.poolId, p);
  }
  log.info({ count: INITIAL_POOLS.length }, 'Pool registry initialized with mock data');
}

// ---------------------------------------------------------------------------
// Canton loader
// ---------------------------------------------------------------------------

let _cantonLoaded = false;

/**
 * Load pools from the Canton ledger. Replaces any existing pool data.
 * Called once at API startup when CANTON_MOCK=false.
 */
export async function loadFromCanton(): Promise<number> {
  if (_cantonLoaded) return pools.size;

  // Dynamic import to avoid circular deps at module load time
  const { getAllPools: cantonGetAllPools } = await import('../canton/queries.js');

  try {
    const contracts = await cantonGetAllPools();
    log.info({ found: contracts.length }, 'Loaded LendingPool contracts from Canton');

    // Clear any pre-seeded mock pools
    pools.clear();

    for (const c of contracts) {
      const poolState = cantonPoolToState(c.contractId, c.payload as unknown as Record<string, unknown>);
      pools.set(poolState.poolId, poolState);
      log.debug(
        { poolId: poolState.poolId, asset: poolState.asset.symbol, supply: poolState.totalSupply },
        'Registered Canton pool',
      );
    }

    _cantonLoaded = true;
    log.info({ count: pools.size }, 'Pool registry loaded from Canton ledger');
    return pools.size;
  } catch (err) {
    log.error({ err }, 'Failed to load pools from Canton, falling back to mock data');
    // Fall back to initial pools so API still works
    for (const p of INITIAL_POOLS) {
      if (!pools.has(p.poolId)) pools.set(p.poolId, p);
    }
    return pools.size;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Get all pool states. */
export function getAllPools(): PoolState[] {
  return Array.from(pools.values());
}

/** Get a single pool by ID. Returns undefined if not found. */
export function getPool(poolId: string): PoolState | undefined {
  return pools.get(poolId);
}

/** Check if a pool exists. */
export function hasPool(poolId: string): boolean {
  return pools.has(poolId);
}

/** Get the InterestRateModelConfig for a pool (from shared config, falls back to USDC defaults). */
export function getPoolRateModel(poolId: string): InterestRateModelConfig {
  const pool = pools.get(poolId);
  if (!pool) return getRateModel('USDC');
  return getRateModel(pool.asset.symbol);
}

/** Get the asset symbol for a pool. */
export function getPoolAssetSymbol(poolId: string): string | undefined {
  return pools.get(poolId)?.asset.symbol;
}

/** Get the asset price for a pool. */
export function getPoolAssetPrice(poolId: string): number {
  return pools.get(poolId)?.asset.priceUSD ?? 1;
}

/** Get all unique asset symbols across all registered pools. */
export function getAllAssetSymbols(): string[] {
  const symbols = new Set<string>();
  for (const pool of pools.values()) {
    symbols.add(pool.asset.symbol);
  }
  return Array.from(symbols);
}

/** Get a map of asset symbol → price for all registered pools + known collateral assets. */
export function getAssetPriceMap(): Record<string, number> {
  const priceMap: Record<string, number> = {};
  for (const pool of pools.values()) {
    priceMap[pool.asset.symbol] = pool.asset.priceUSD;
  }
  // Include additional known collateral assets not tied to a pool
  const extras: Record<string, number> = {
    'T-BILL': 1.0,
    'CC-REC': 1.0,
    SPY: 478.5,
    'SOLAR-ASSET': 1.0,
    'WIND-ASSET': 1.0,
    'INFRA-ASSET': 1.0,
    'TIFA-REC': 1.0,
    'TIFA-INVOICE': 1.0,
  };
  for (const [sym, price] of Object.entries(extras)) {
    if (!(sym in priceMap)) priceMap[sym] = price;
  }
  return priceMap;
}

/**
 * Register a brand-new pool into the registry.  Called by admin createPool.
 * Immediately available for deposit, withdraw, borrow, interest accrual.
 */
export function registerPool(opts: {
  poolId: string;
  assetSymbol: string;
  assetType: string;
  priceUSD: number;
  totalSupply?: number;
  totalBorrow?: number;
  totalReserves?: number;
}): PoolState {
  if (pools.has(opts.poolId)) {
    throw new Error(`Pool ${opts.poolId} already exists`);
  }

  const pool: PoolState = {
    poolId: opts.poolId,
    asset: {
      symbol: opts.assetSymbol,
      type: opts.assetType,
      priceUSD: opts.priceUSD,
    },
    totalSupply: opts.totalSupply ?? 0,
    totalBorrow: opts.totalBorrow ?? 0,
    totalReserves: opts.totalReserves ?? 0,
    borrowIndex: 1.0,
    supplyIndex: 1.0,
    lastAccrualTs: now(),
    isActive: true,
    contractId: `canton::pool::${opts.poolId}::${String(pools.size + 1).padStart(3, '0')}`,
  };

  pools.set(opts.poolId, pool);
  log.info({ poolId: opts.poolId, asset: opts.assetSymbol }, 'Pool registered');
  return pool;
}

/** Pause / resume / archive a pool. */
export function setPoolActive(poolId: string, active: boolean): boolean {
  const pool = pools.get(poolId);
  if (!pool) return false;
  pool.isActive = active;
  return true;
}

/** Update asset price by pool ID (oracle feed). */
export function updateAssetPrice(poolId: string, newPrice: number): boolean {
  const pool = pools.get(poolId);
  if (!pool) return false;
  pool.asset.priceUSD = newPrice;
  return true;
}

/** Update asset price by symbol across all pools that hold this asset. */
export function updateAssetPriceBySymbol(symbol: string, newPrice: number): number {
  let updated = 0;
  for (const pool of pools.values()) {
    if (pool.asset.symbol === symbol) {
      pool.asset.priceUSD = newPrice;
      updated++;
    }
  }
  return updated;
}

/** Total pool count. */
export function poolCount(): number {
  return pools.size;
}
