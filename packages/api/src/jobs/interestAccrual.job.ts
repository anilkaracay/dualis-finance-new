import type { WsPoolPayload } from '@dualis/shared';
import {
  calculateUtilization,
  calculateBorrowRate,
  calculateSupplyRate,
  PROTOCOL_DEFAULTS,
} from '@dualis/shared';
import { createChildLogger } from '../config/logger.js';
import { channelManager } from '../ws/channels.js';
import { getDb, schema } from '../db/client.js';
import { registerJob } from './scheduler.js';

const log = createChildLogger('interest-accrual');

// ---------------------------------------------------------------------------
// Interval
// ---------------------------------------------------------------------------

/** Accrual interval: 5 minutes. */
const INTERVAL_MS = 5 * 60 * 1_000;

// ---------------------------------------------------------------------------
// Mock pool state (mutable so we can simulate drift)
// ---------------------------------------------------------------------------

interface MockPoolState {
  poolId: string;
  totalSupply: number;
  totalBorrow: number;
  totalReserves: number;
  priceUSD: number;
  /** Variable-rate model parameters */
  baseRate: number;
  multiplier: number;
  kink: number;
  jumpMultiplier: number;
}

const MOCK_POOLS: MockPoolState[] = [
  {
    poolId: 'usdc-main',
    totalSupply: 245_600_000,
    totalBorrow: 178_200_000,
    totalReserves: 4_912_000,
    priceUSD: 1.0,
    baseRate: 0.02,
    multiplier: 0.05,
    kink: 0.8,
    jumpMultiplier: 0.15,
  },
  {
    poolId: 'wbtc-main',
    totalSupply: 1_850,
    totalBorrow: 920,
    totalReserves: 12.5,
    priceUSD: 97_234.56,
    baseRate: 0.02,
    multiplier: 0.04,
    kink: 0.75,
    jumpMultiplier: 0.20,
  },
  {
    poolId: 'eth-main',
    totalSupply: 45_200,
    totalBorrow: 28_900,
    totalReserves: 340,
    priceUSD: 3_456.78,
    baseRate: 0.02,
    multiplier: 0.05,
    kink: 0.8,
    jumpMultiplier: 0.15,
  },
  {
    poolId: 'cc-receivable',
    totalSupply: 89_000_000,
    totalBorrow: 67_400_000,
    totalReserves: 1_780_000,
    priceUSD: 1.0,
    baseRate: 0.03,
    multiplier: 0.06,
    kink: 0.7,
    jumpMultiplier: 0.25,
  },
  {
    poolId: 'tbill-short',
    totalSupply: 320_000_000,
    totalBorrow: 198_400_000,
    totalReserves: 6_400_000,
    priceUSD: 99.87,
    baseRate: 0.015,
    multiplier: 0.04,
    kink: 0.85,
    jumpMultiplier: 0.12,
  },
  {
    poolId: 'spy-equity',
    totalSupply: 326_000,
    totalBorrow: 142_800,
    totalReserves: 4_890,
    priceUSD: 512.45,
    baseRate: 0.02,
    multiplier: 0.05,
    kink: 0.75,
    jumpMultiplier: 0.18,
  },
];

// ---------------------------------------------------------------------------
// Job handler
// ---------------------------------------------------------------------------

async function interestAccrualHandler(): Promise<void> {
  const now = new Date().toISOString();
  const db = getDb();

  for (const pool of MOCK_POOLS) {
    // Simulate minor supply/borrow drift
    const supplyDrift = 1 + (Math.random() - 0.5) * 0.002;
    const borrowDrift = 1 + (Math.random() - 0.5) * 0.003;
    pool.totalSupply = Number((pool.totalSupply * supplyDrift).toFixed(2));
    pool.totalBorrow = Number((pool.totalBorrow * borrowDrift).toFixed(2));

    // Recompute rates
    const utilization = calculateUtilization(pool.totalBorrow, pool.totalSupply);
    const borrowAPY = calculateBorrowRate(
      utilization,
      pool.baseRate,
      pool.multiplier,
      pool.kink,
      pool.jumpMultiplier,
    );
    const supplyAPY = calculateSupplyRate(
      borrowAPY,
      utilization,
      PROTOCOL_DEFAULTS.protocolFeeRate,
    );

    // Broadcast pool update via WebSocket
    const payload: WsPoolPayload = {
      poolId: pool.poolId,
      totalSupply: pool.totalSupply,
      totalBorrow: pool.totalBorrow,
      utilization: Number(utilization.toFixed(6)),
      supplyAPY: Number(supplyAPY.toFixed(6)),
      borrowAPY: Number(borrowAPY.toFixed(6)),
      ts: now,
    };
    channelManager.broadcast(`pool:${pool.poolId}`, payload);

    // Persist snapshot to DB if available
    if (db) {
      try {
        await db.insert(schema.poolSnapshots).values({
          poolId: pool.poolId,
          totalSupply: pool.totalSupply.toString(),
          totalBorrow: pool.totalBorrow.toString(),
          totalReserves: pool.totalReserves.toString(),
          supplyAPY: Number(supplyAPY.toFixed(6)),
          borrowAPY: Number(borrowAPY.toFixed(6)),
          utilization: Number(utilization.toFixed(6)),
          priceUSD: pool.priceUSD.toString(),
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        log.warn({ err: message, poolId: pool.poolId }, 'Failed to insert pool snapshot');
      }
    }
  }

  log.debug({ pools: MOCK_POOLS.length }, 'Interest accrual complete');
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

registerJob('interest-accrual', INTERVAL_MS, interestAccrualHandler);
