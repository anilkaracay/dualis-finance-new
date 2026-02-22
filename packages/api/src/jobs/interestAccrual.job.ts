import type { WsPoolPayload } from '@dualis/shared';
import {
  calculateUtilization,
  calculatePoolAPY,
  accrueInterest,
  getRateModel,
  type InterestRateModelConfig,
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
// Pool state with index-based accrual
// ---------------------------------------------------------------------------

interface PoolState {
  poolId: string;
  assetSymbol: string;
  totalSupply: number;
  totalBorrow: number;
  totalReserves: number;
  priceUSD: number;
  model: InterestRateModelConfig;
  borrowIndex: number;
  supplyIndex: number;
  lastAccrualTs: number; // Unix seconds
}

const POOLS: PoolState[] = [
  {
    poolId: 'usdc-main',
    assetSymbol: 'USDC',
    totalSupply: 245_600_000,
    totalBorrow: 178_200_000,
    totalReserves: 4_912_000,
    priceUSD: 1.0,
    model: getRateModel('USDC'),
    borrowIndex: 1.0,
    supplyIndex: 1.0,
    lastAccrualTs: Math.floor(Date.now() / 1000),
  },
  {
    poolId: 'wbtc-main',
    assetSymbol: 'wBTC',
    totalSupply: 1_850,
    totalBorrow: 920,
    totalReserves: 12.5,
    priceUSD: 97_234.56,
    model: getRateModel('wBTC'),
    borrowIndex: 1.0,
    supplyIndex: 1.0,
    lastAccrualTs: Math.floor(Date.now() / 1000),
  },
  {
    poolId: 'eth-main',
    assetSymbol: 'ETH',
    totalSupply: 45_200,
    totalBorrow: 28_900,
    totalReserves: 340,
    priceUSD: 3_456.78,
    model: getRateModel('ETH'),
    borrowIndex: 1.0,
    supplyIndex: 1.0,
    lastAccrualTs: Math.floor(Date.now() / 1000),
  },
  {
    poolId: 'cc-receivable',
    assetSymbol: 'CC-REC',
    totalSupply: 89_000_000,
    totalBorrow: 67_400_000,
    totalReserves: 1_780_000,
    priceUSD: 1.0,
    model: getRateModel('CC-REC'),
    borrowIndex: 1.0,
    supplyIndex: 1.0,
    lastAccrualTs: Math.floor(Date.now() / 1000),
  },
  {
    poolId: 'tbill-short',
    assetSymbol: 'T-BILL',
    totalSupply: 320_000_000,
    totalBorrow: 198_400_000,
    totalReserves: 6_400_000,
    priceUSD: 99.87,
    model: getRateModel('T-BILL'),
    borrowIndex: 1.0,
    supplyIndex: 1.0,
    lastAccrualTs: Math.floor(Date.now() / 1000),
  },
  {
    poolId: 'spy-equity',
    assetSymbol: 'SPY',
    totalSupply: 326_000,
    totalBorrow: 142_800,
    totalReserves: 4_890,
    priceUSD: 512.45,
    model: getRateModel('SPY'),
    borrowIndex: 1.0,
    supplyIndex: 1.0,
    lastAccrualTs: Math.floor(Date.now() / 1000),
  },
];

// ---------------------------------------------------------------------------
// Job handler
// ---------------------------------------------------------------------------

async function interestAccrualHandler(): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const nowIso = new Date().toISOString();
  const db = getDb();

  for (const pool of POOLS) {
    // Simulate minor supply/borrow drift
    const supplyDrift = 1 + (Math.random() - 0.5) * 0.002;
    const borrowDrift = 1 + (Math.random() - 0.5) * 0.003;
    pool.totalSupply = Number((pool.totalSupply * supplyDrift).toFixed(2));
    pool.totalBorrow = Number((pool.totalBorrow * borrowDrift).toFixed(2));

    // Accrue interest using index-based system
    const accrual = accrueInterest(
      pool.model,
      pool.totalBorrow,
      pool.totalSupply,
      pool.totalReserves,
      pool.borrowIndex,
      pool.supplyIndex,
      pool.lastAccrualTs,
      now,
    );

    // Update pool state
    pool.totalBorrow = accrual.newTotalBorrows;
    pool.totalReserves = accrual.newTotalReserves;
    pool.borrowIndex = accrual.newBorrowIndex;
    pool.supplyIndex = accrual.newSupplyIndex;
    pool.lastAccrualTs = now;

    // Compute display rates
    const utilization = calculateUtilization(pool.totalBorrow, pool.totalSupply);
    const supplyAPY = calculatePoolAPY(pool.model, utilization, 'supply');
    const borrowAPY = calculatePoolAPY(pool.model, utilization, 'borrow');

    // Broadcast pool update via WebSocket
    const payload: WsPoolPayload = {
      poolId: pool.poolId,
      totalSupply: pool.totalSupply,
      totalBorrow: pool.totalBorrow,
      utilization: Number(utilization.toFixed(6)),
      supplyAPY: Number(supplyAPY.toFixed(6)),
      borrowAPY: Number(borrowAPY.toFixed(6)),
      ts: nowIso,
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

  log.debug({ pools: POOLS.length }, 'Interest accrual complete');
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

registerJob('interest-accrual', INTERVAL_MS, interestAccrualHandler);
