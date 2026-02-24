import type { WsPoolPayload } from '@dualis/shared';
import {
  calculateUtilization,
  calculatePoolAPY,
  accrueInterest,
} from '@dualis/shared';
import { createChildLogger } from '../config/logger.js';
import { channelManager } from '../ws/channels.js';
import { getDb, schema } from '../db/client.js';
import { registerJob } from './scheduler.js';
import * as registry from '../services/poolRegistry.js';

const log = createChildLogger('interest-accrual');

// ---------------------------------------------------------------------------
// Interval
// ---------------------------------------------------------------------------

/** Accrual interval: 5 minutes. */
const INTERVAL_MS = 5 * 60 * 1_000;

// ---------------------------------------------------------------------------
// Job handler — reads from the centralized pool registry so any
// pool created at runtime is automatically covered.
// ---------------------------------------------------------------------------

async function interestAccrualHandler(): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const nowIso = new Date().toISOString();
  const db = getDb();

  const allPools = registry.getAllPools();

  for (const pool of allPools) {
    if (!pool.isActive) continue;

    const model = registry.getPoolRateModel(pool.poolId);

    // Simulate minor supply/borrow drift
    const supplyDrift = 1 + (Math.random() - 0.5) * 0.002;
    const borrowDrift = 1 + (Math.random() - 0.5) * 0.003;
    pool.totalSupply = Number((pool.totalSupply * supplyDrift).toFixed(2));
    pool.totalBorrow = Number((pool.totalBorrow * borrowDrift).toFixed(2));

    // Accrue interest using index-based system
    const accrual = accrueInterest(
      model,
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
    const supplyAPY = calculatePoolAPY(model, utilization, 'supply');
    const borrowAPY = calculatePoolAPY(model, utilization, 'borrow');

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
          priceUSD: pool.asset.priceUSD.toString(),
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        log.warn({ err: message, poolId: pool.poolId }, 'Failed to insert pool snapshot');
      }
    }
  }

  log.debug({ pools: allPools.length }, 'Interest accrual complete');
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

registerJob('interest-accrual', INTERVAL_MS, interestAccrualHandler);
