import type { WsPositionPayload, WsNotificationPayload, WsLiquidationPayload } from '@dualis/shared';
import { calculateHealthFactor } from '@dualis/shared';
import { createChildLogger } from '../config/logger.js';
import { channelManager } from '../ws/channels.js';
import { registerJob } from './scheduler.js';

const log = createChildLogger('health-check');

// ---------------------------------------------------------------------------
// Mock borrow positions
// ---------------------------------------------------------------------------

interface MockBorrowPosition {
  positionId: string;
  borrower: string;
  poolId: string;
  borrowedAsset: string;
  /** Current collateral value in USD. */
  collateralValueUSD: number;
  /** Liquidation threshold for the collateral type. */
  liquidationThreshold: number;
  /** Current borrow value in USD. */
  borrowValueUSD: number;
  /** Credit tier at origination. */
  tier: string;
}

/**
 * In a production system these would be fetched from the Canton ledger.
 * The mock data uses mutable values so the job can simulate fluctuations.
 */
const MOCK_POSITIONS: MockBorrowPosition[] = [
  {
    positionId: 'borrow-001',
    borrower: 'party::alice',
    poolId: 'usdc-main',
    borrowedAsset: 'USDC',
    collateralValueUSD: 150_000,
    liquidationThreshold: 0.82,
    borrowValueUSD: 100_000,
    tier: 'Gold',
  },
  {
    positionId: 'borrow-002',
    borrower: 'party::bob',
    poolId: 'eth-main',
    borrowedAsset: 'ETH',
    collateralValueUSD: 48_000,
    liquidationThreshold: 0.82,
    borrowValueUSD: 35_000,
    tier: 'Silver',
  },
  {
    positionId: 'borrow-003',
    borrower: 'party::charlie',
    poolId: 'wbtc-main',
    borrowedAsset: 'wBTC',
    collateralValueUSD: 210_000,
    liquidationThreshold: 0.82,
    borrowValueUSD: 195_000,
    tier: 'Bronze',
  },
];

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

/** Below this health factor a warning notification is sent. */
const WARNING_THRESHOLD = 1.2;

/** Below this health factor the position is eligible for liquidation. */
const LIQUIDATION_THRESHOLD = 1.0;

// ---------------------------------------------------------------------------
// Job handler
// ---------------------------------------------------------------------------

async function healthCheckHandler(): Promise<void> {
  const now = new Date().toISOString();

  for (const pos of MOCK_POSITIONS) {
    // Simulate small fluctuation in collateral value
    const jitter = 1 + (Math.random() - 0.5) * 0.02;
    pos.collateralValueUSD = Number((pos.collateralValueUSD * jitter).toFixed(2));

    const hf = calculateHealthFactor(
      [{ valueUSD: pos.collateralValueUSD, liquidationThreshold: pos.liquidationThreshold }],
      pos.borrowValueUSD,
    ) as number;

    // Broadcast position health to subscribers
    const positionPayload: WsPositionPayload = {
      positionId: pos.positionId,
      healthFactor: Number(hf.toFixed(4)),
      collateralValueUSD: pos.collateralValueUSD,
      borrowValueUSD: pos.borrowValueUSD,
      ts: now,
    };
    channelManager.broadcast(`position:${pos.positionId}`, positionPayload);

    // Warning zone
    if (hf < WARNING_THRESHOLD && hf >= LIQUIDATION_THRESHOLD) {
      log.warn(
        { positionId: pos.positionId, healthFactor: hf.toFixed(4), borrower: pos.borrower },
        'Health factor below warning threshold',
      );

      const notification: WsNotificationPayload = {
        type: 'health_warning',
        title: 'Health Factor Warning',
        message: `Position ${pos.positionId} health factor dropped to ${hf.toFixed(4)}`,
        positionId: pos.positionId,
        healthFactor: Number(hf.toFixed(4)),
        ts: now,
      };
      channelManager.broadcastToParty(pos.borrower, notification);
    }

    // Liquidation zone
    if (hf < LIQUIDATION_THRESHOLD) {
      log.error(
        { positionId: pos.positionId, healthFactor: hf.toFixed(4), borrower: pos.borrower },
        'CRITICAL — position eligible for liquidation',
      );

      const liquidationPayload: WsLiquidationPayload = {
        borrower: pos.borrower,
        poolId: pos.poolId,
        amount: pos.borrowValueUSD,
        tier: pos.tier,
        ts: now,
      };
      channelManager.broadcast('liquidations', liquidationPayload);

      const notification: WsNotificationPayload = {
        type: 'liquidation_alert',
        title: 'Liquidation Alert',
        message: `Position ${pos.positionId} is being liquidated (HF: ${hf.toFixed(4)})`,
        positionId: pos.positionId,
        healthFactor: Number(hf.toFixed(4)),
        ts: now,
      };
      channelManager.broadcastToParty(pos.borrower, notification);
    }
  }

  log.debug({ positions: MOCK_POSITIONS.length }, 'Health check complete');
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

registerJob('health-check', 30_000, healthCheckHandler);
