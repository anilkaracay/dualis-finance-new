/**
 * Reward Tracker Service — unified entry point combining System A + B.
 *
 * System A: Canton Network CC rewards (CIP-0047 activity markers)
 * System B: Internal protocol rewards (points, tiers, leaderboard)
 *
 * CRITICAL: Errors in reward tracking NEVER fail the main transaction.
 * All calls are fire-and-forget with try-catch guards.
 */
import { createChildLogger } from '../config/logger.js';
import { recordCantonActivity } from './canton-rewards.service.js';
import { logActivity, type LogActivityInput } from './activity.service.js';

const log = createChildLogger('reward-tracker');

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export interface TrackActivityParams {
  activityType: 'deposit' | 'withdraw' | 'borrow' | 'repay' | 'add_collateral';
  userId?: string | undefined;
  partyId: string;
  poolId?: string | undefined;
  asset?: string | undefined;
  amount?: number | undefined;
  cantonOffset?: string | undefined;
  cantonContractId?: string | undefined;
}

/**
 * Track a user activity across both reward systems.
 *
 * 1. System A — create Canton activity marker for CC rewards
 * 2. System B — log activity to PostgreSQL for points/tier/leaderboard
 *
 * Never throws. Errors are logged and swallowed.
 */
export async function trackActivity(params: TrackActivityParams): Promise<void> {
  let markerCreated = false;

  // System A: Canton activity marker (CC rewards)
  try {
    markerCreated = await recordCantonActivity();
    if (markerCreated) {
      log.debug({ activityType: params.activityType }, 'Canton activity marker created');
    }
  } catch (err) {
    log.error({ err, activityType: params.activityType }, 'System A (Canton marker) failed');
  }

  // System B: Internal protocol rewards (points/tiers)
  try {
    const input: LogActivityInput = {
      activityType: params.activityType,
      userId: params.userId,
      partyId: params.partyId,
      poolId: params.poolId,
      asset: params.asset,
      amount: params.amount,
      cantonOffset: params.cantonOffset,
      cantonContractId: params.cantonContractId,
      activityMarkerCreated: markerCreated,
    };
    await logActivity(input);
  } catch (err) {
    log.error({ err, activityType: params.activityType }, 'System B (activity log) failed');
  }
}
