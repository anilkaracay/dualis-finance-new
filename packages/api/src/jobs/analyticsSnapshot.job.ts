import { createChildLogger } from '../config/logger.js';
import { getDb, schema } from '../db/client.js';
import { registerJob } from './scheduler.js';

const log = createChildLogger('analytics-snapshot');

// ---------------------------------------------------------------------------
// Mock data generators (Canton not live yet)
// ---------------------------------------------------------------------------

const MOCK_POOLS = [
  { id: 'pool_usdc', asset: 'USDC', baseTvl: 35_000_000, baseUtil: 0.72 },
  { id: 'pool_eth', asset: 'ETH', baseTvl: 45_000_000, baseUtil: 0.68 },
  { id: 'pool_wbtc', asset: 'WBTC', baseTvl: 30_000_000, baseUtil: 0.55 },
  { id: 'pool_usd1', asset: 'USD1', baseTvl: 15_000_000, baseUtil: 0.78 },
  { id: 'pool_tbill', asset: 'T-BILL', baseTvl: 20_000_000, baseUtil: 0.85 },
  { id: 'pool_spy', asset: 'SPY', baseTvl: 8_000_000, baseUtil: 0.42 },
];

function jitter(factor = 0.03): number {
  return 1 + (Math.random() - 0.5) * 2 * factor;
}

// ---------------------------------------------------------------------------
// 1. Hourly Pool Snapshots
// ---------------------------------------------------------------------------

async function takePoolSnapshots(): Promise<void> {
  const db = getDb();
  if (!db) {
    log.debug('Database unavailable — pool snapshots skipped');
    return;
  }

  const snapshotAt = new Date();
  // Truncate to the hour for uniqueness
  snapshotAt.setMinutes(0, 0, 0);

  for (const pool of MOCK_POOLS) {
    const tvl = pool.baseTvl * jitter();
    const utilization = Math.min(0.95, Math.max(0.1, pool.baseUtil * jitter(0.05)));
    const totalSupply = tvl / (1 - utilization);
    const totalBorrows = totalSupply * utilization;
    const available = totalSupply - totalBorrows;
    const supplyApy = utilization * 0.06 * jitter(0.1);
    const borrowApy = utilization * 0.12 * jitter(0.1);
    const reserve = totalSupply * 0.02 * jitter();

    try {
      await db.insert(schema.analyticsPoolSnapshots).values({
        poolId: pool.id,
        totalSupplyUsd: totalSupply.toFixed(6),
        totalBorrowUsd: totalBorrows.toFixed(6),
        availableLiquidityUsd: available.toFixed(6),
        tvlUsd: tvl.toFixed(6),
        utilization: utilization.toFixed(6),
        supplyApy: supplyApy.toFixed(6),
        borrowApy: borrowApy.toFixed(6),
        depositorCount: Math.round(150 * jitter(0.2)),
        borrowerCount: Math.round(80 * jitter(0.2)),
        reserveUsd: reserve.toFixed(6),
        snapshotAt,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('duplicate key') || msg.includes('unique constraint')) {
        log.debug({ pool: pool.id }, 'Pool snapshot already exists for this hour');
      } else {
        log.warn({ err: msg, pool: pool.id }, 'Failed to insert pool snapshot');
      }
    }
  }

  log.info({ poolCount: MOCK_POOLS.length }, 'Pool snapshots taken');
}

// ---------------------------------------------------------------------------
// 2. Hourly Protocol Snapshot (aggregate of all pools)
// ---------------------------------------------------------------------------

async function takeProtocolSnapshot(): Promise<void> {
  const db = getDb();
  if (!db) return;

  const totalTvl = MOCK_POOLS.reduce((sum, p) => sum + p.baseTvl * jitter(), 0);
  const totalSupply = totalTvl * 1.3 * jitter();
  const totalBorrows = totalSupply * 0.65 * jitter(0.05);
  const totalReserve = totalSupply * 0.02 * jitter();
  const avgUtil = totalBorrows / totalSupply;

  try {
    await db.insert(schema.analyticsProtocolSnapshots).values({
      totalTvlUsd: totalTvl.toFixed(6),
      totalSupplyUsd: totalSupply.toFixed(6),
      totalBorrowUsd: totalBorrows.toFixed(6),
      totalReserveUsd: totalReserve.toFixed(6),
      totalUsers: Math.round(1240 * jitter(0.05)),
      activePools: MOCK_POOLS.length,
      avgUtilization: avgUtil.toFixed(6),
    });
    log.info('Protocol snapshot taken');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log.warn({ err: msg }, 'Failed to insert protocol snapshot');
  }
}

// ---------------------------------------------------------------------------
// 3. Daily User Position Snapshots
// ---------------------------------------------------------------------------

const MOCK_USERS = [
  'user_alice', 'user_bob', 'user_carol', 'user_dave', 'user_eve',
];

async function takeUserSnapshots(): Promise<void> {
  const db = getDb();
  if (!db) return;

  const snapshotAt = new Date();
  snapshotAt.setHours(0, 0, 0, 0); // truncate to day

  for (const userId of MOCK_USERS) {
    const supplied = 50_000 * jitter(0.3);
    const borrowed = 20_000 * jitter(0.3);
    const collateral = supplied * 1.2 * jitter();
    const interestEarned = supplied * 0.03 * jitter();
    const interestPaid = borrowed * 0.06 * jitter();
    const hf = 1.2 + Math.random() * 0.8;

    try {
      await db.insert(schema.analyticsUserPositionSnapshots).values({
        userId,
        totalSupplyUsd: supplied.toFixed(6),
        totalBorrowUsd: borrowed.toFixed(6),
        totalCollateralUsd: collateral.toFixed(6),
        netWorthUsd: (supplied - borrowed).toFixed(6),
        interestEarnedUsd: interestEarned.toFixed(6),
        interestPaidUsd: interestPaid.toFixed(6),
        netInterestUsd: (interestEarned - interestPaid).toFixed(6),
        healthFactor: hf.toFixed(4),
        netApy: (0.03 + Math.random() * 0.02).toFixed(6),
        snapshotAt,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('duplicate key') || msg.includes('unique constraint')) {
        log.debug({ userId }, 'User snapshot already exists for today');
      } else {
        log.warn({ err: msg, userId }, 'Failed to insert user snapshot');
      }
    }
  }

  log.info({ userCount: MOCK_USERS.length }, 'User position snapshots taken');
}

// ---------------------------------------------------------------------------
// 4. Protocol Health Snapshot (every 15 minutes)
// ---------------------------------------------------------------------------

function calculateHealthScore(): {
  healthScore: number;
  badDebtRatio: number;
  reserveCoverage: number;
  avgHealthFactor: number;
  hfDangerCount: number;
  hfDangerVolumeUsd: number;
  liquidationEfficiency: number;
  oracleUptime: number;
  concentrationRisk: number;
} {
  const badDebt = 0.0002 + Math.random() * 0.001;
  const reserve = 0.05 + Math.random() * 0.03;
  const avgHf = 1.5 + Math.random() * 0.5;
  const hfDangerCount = Math.floor(Math.random() * 5);
  const hfDangerVol = hfDangerCount * 50_000 * jitter(0.5);
  const liqEff = 0.92 + Math.random() * 0.07;
  const oracleUp = 0.995 + Math.random() * 0.005;
  const concentration = 0.15 + Math.random() * 0.2;

  // Score calculation (0–100)
  const badDebtScore = Math.max(0, 20 - badDebt * 2000);
  const reserveScore = Math.min(20, reserve * 400);
  const hfScore = avgHf > 2 ? 20 : avgHf > 1.5 ? 15 : avgHf > 1.2 ? 10 : 5;
  const liqScore = liqEff * 15;
  const oracleScore = oracleUp * 15;
  const concScore = Math.max(0, 10 - concentration * 20);

  const healthScore = Math.round(
    Math.min(100, badDebtScore + reserveScore + hfScore + liqScore + oracleScore + concScore)
  );

  return {
    healthScore,
    badDebtRatio: badDebt,
    reserveCoverage: reserve,
    avgHealthFactor: avgHf,
    hfDangerCount,
    hfDangerVolumeUsd: hfDangerVol,
    liquidationEfficiency: liqEff,
    oracleUptime: oracleUp,
    concentrationRisk: concentration,
  };
}

async function takeHealthSnapshot(): Promise<void> {
  const db = getDb();
  if (!db) return;

  const health = calculateHealthScore();

  try {
    await db.insert(schema.protocolHealthSnapshots).values({
      healthScore: health.healthScore,
      badDebtRatio: health.badDebtRatio.toFixed(6),
      reserveCoverage: health.reserveCoverage.toFixed(6),
      avgHealthFactor: health.avgHealthFactor.toFixed(4),
      hfDangerCount: health.hfDangerCount,
      hfDangerVolumeUsd: health.hfDangerVolumeUsd.toFixed(6),
      liquidationEfficiency: health.liquidationEfficiency.toFixed(6),
      oracleUptime: health.oracleUptime.toFixed(6),
      concentrationRisk: health.concentrationRisk.toFixed(6),
    });
    log.info({ score: health.healthScore }, 'Protocol health snapshot taken');

    if (health.healthScore < 50) {
      log.warn({ score: health.healthScore }, 'CRITICAL: Protocol health score below 50');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log.warn({ err: msg }, 'Failed to insert health snapshot');
  }
}

// ---------------------------------------------------------------------------
// Combined handlers
// ---------------------------------------------------------------------------

/** Hourly: pool snapshots + protocol snapshot */
async function hourlySnapshotHandler(): Promise<void> {
  await takePoolSnapshots();
  await takeProtocolSnapshot();
}

/** Daily: user position snapshots */
async function dailyUserSnapshotHandler(): Promise<void> {
  await takeUserSnapshots();
}

/** Every 15 minutes: protocol health check */
async function healthSnapshotHandler(): Promise<void> {
  await takeHealthSnapshot();
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

const HOUR_MS = 60 * 60 * 1_000;
const DAY_MS = 24 * HOUR_MS;
const FIFTEEN_MIN_MS = 15 * 60 * 1_000;

registerJob('analytics-pool-snapshot', HOUR_MS, hourlySnapshotHandler);
registerJob('analytics-user-snapshot', DAY_MS, dailyUserSnapshotHandler);
registerJob('analytics-health-snapshot', FIFTEEN_MIN_MS, healthSnapshotHandler);
