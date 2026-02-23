import { createChildLogger } from '../../config/logger.js';
import { registerJob } from '../../jobs/scheduler.js';
import { notificationBus } from '../notification.bus.js';

const log = createChildLogger('rate-change-monitor');

// ---------------------------------------------------------------------------
// Mock pool rates for tracking (in production, read from DB/Canton)
// ---------------------------------------------------------------------------

interface PoolRateSnapshot {
  poolId: string;
  asset: string;
  supplyAPY: number;
  borrowAPY: number;
  timestamp: number;
}

const lastSnapshots = new Map<string, PoolRateSnapshot>();

const MOCK_POOLS = [
  { poolId: 'usdc-main', asset: 'USDC', supplyAPY: 0.042, borrowAPY: 0.068 },
  { poolId: 'eth-main', asset: 'ETH', supplyAPY: 0.018, borrowAPY: 0.035 },
  { poolId: 'wbtc-main', asset: 'wBTC', supplyAPY: 0.012, borrowAPY: 0.028 },
];

/** Significant rate change threshold (1 percentage point = 0.01) */
const RATE_CHANGE_THRESHOLD = 0.01;

// ---------------------------------------------------------------------------
// Job handler — runs every 6 hours
// ---------------------------------------------------------------------------

async function rateChangeHandler(): Promise<void> {
  for (const pool of MOCK_POOLS) {
    // Simulate small rate fluctuations
    const jitter = 1 + (Math.random() - 0.5) * 0.1;
    const currentSupplyAPY = pool.supplyAPY * jitter;
    const currentBorrowAPY = pool.borrowAPY * jitter;

    const prev = lastSnapshots.get(pool.poolId);

    if (prev) {
      const supplyChange = Math.abs(currentSupplyAPY - prev.supplyAPY);
      const borrowChange = Math.abs(currentBorrowAPY - prev.borrowAPY);

      if (supplyChange > RATE_CHANGE_THRESHOLD || borrowChange > RATE_CHANGE_THRESHOLD) {
        log.info(
          { poolId: pool.poolId, supplyChange, borrowChange },
          'Significant rate change detected',
        );

        // In production: notify all users with positions in this pool
        // For now, emit a general notification
        notificationBus.emit({
          type: 'RATE_CHANGE_SIGNIFICANT',
          category: 'financial',
          severity: 'info',
          partyId: 'party::operator', // Would be per-user in production
          title: `Rate Change: ${pool.asset}`,
          message: `${pool.asset} pool supply APY changed from ${(prev.supplyAPY * 100).toFixed(2)}% to ${(currentSupplyAPY * 100).toFixed(2)}%`,
          data: {
            pool: pool.poolId,
            asset: pool.asset,
            oldSupplyRate: prev.supplyAPY,
            newSupplyRate: currentSupplyAPY,
            oldBorrowRate: prev.borrowAPY,
            newBorrowRate: currentBorrowAPY,
            changePercent: ((supplyChange / prev.supplyAPY) * 100).toFixed(1),
          },
          deduplicationKey: `rate-change:${pool.poolId}`,
          link: '/markets',
        }).catch((err) => log.warn({ err }, 'Rate change notification failed'));
      }
    }

    // Update snapshot
    lastSnapshots.set(pool.poolId, {
      poolId: pool.poolId,
      asset: pool.asset,
      supplyAPY: currentSupplyAPY,
      borrowAPY: currentBorrowAPY,
      timestamp: Date.now(),
    });
  }

  log.debug('Rate change check complete');
}

// Register job: every 6 hours (21600000 ms)
registerJob('rate-change-monitor', 6 * 60 * 60 * 1000, rateChangeHandler);
