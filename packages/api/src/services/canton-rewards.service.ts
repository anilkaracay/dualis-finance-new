/**
 * Canton Rewards Service — System A (CIP-0047 Featured App Activity Markers)
 *
 * Exercises FeaturedAppRight_CreateActivityMarker on Canton after user
 * transactions to earn real Canton Coin (CC). Each marker ≈ $1 USD in CC.
 */
import { createChildLogger } from '../config/logger.js';
import { cantonConfig } from '../config/canton-env.js';
import { CantonClient } from '../canton/client.js';
import { env } from '../config/env.js';

const log = createChildLogger('canton-rewards');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Template ID for querying active contracts (Splice.Amulet package)
const SPLICE_AMULET_PKG =
  'c208d7ead1e4e9b610fc2054d0bf00716144ad444011bce0b02dcd6cd0cb8a23';

const FEATURED_APP_RIGHT_TEMPLATE =
  `${SPLICE_AMULET_PKG}:Splice.Amulet:FeaturedAppRight`;

// Interface ID for exercising choices (splice-api-featured-app-v1 package)
const SPLICE_API_FEATURED_APP_PKG =
  '7804375fe5e4c6d5afe067bd314c42fe0b7d005a1300019c73154dd939da4dda';

const FEATURED_APP_RIGHT_INTERFACE =
  `${SPLICE_API_FEATURED_APP_PKG}:Splice.Api.FeaturedAppRightV1:FeaturedAppRight`;

const CREATE_MARKER_CHOICE = 'FeaturedAppRight_CreateActivityMarker';

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

let cachedFeaturedAppRightContractId: string | null = null;

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Find the FeaturedAppRight contract on the ledger.
 * Caches the contractId for subsequent calls.
 */
export async function findFeaturedAppRight(): Promise<string | null> {
  if (cachedFeaturedAppRightContractId) {
    return cachedFeaturedAppRightContractId;
  }

  if (env.CANTON_MOCK) {
    log.debug('Mock mode — returning mock FeaturedAppRight');
    cachedFeaturedAppRightContractId = '#mock-featured-app-right';
    return cachedFeaturedAppRightContractId;
  }

  try {
    const client = CantonClient.getInstance();
    const operator = cantonConfig().parties.operator;

    // Query using the raw HTTP client since FeaturedAppRight is a Splice
    // contract, not a Dualis one — the CantonClient.queryContracts method
    // works fine because it just filters by party + template.
    const contracts = await client.queryContracts<Record<string, unknown>>(
      FEATURED_APP_RIGHT_TEMPLATE,
    );

    // Find contract where our operator is the provider (or any match)
    const match = contracts.find((c) => {
      const payload = c.payload as Record<string, unknown>;
      return payload.provider === operator || true; // take any match
    });

    if (match) {
      cachedFeaturedAppRightContractId = match.contractId;
      log.info(
        { contractId: match.contractId },
        'Found FeaturedAppRight contract',
      );
      return cachedFeaturedAppRightContractId;
    }

    log.warn('FeaturedAppRight contract not found — self-feature required');
    return null;
  } catch (err) {
    log.error({ err }, 'Failed to query FeaturedAppRight');
    return null;
  }
}

/**
 * Create an activity marker on Canton by exercising
 * FeaturedAppRight_CreateActivityMarker.
 *
 * @returns true if the marker was created, false otherwise
 */
export async function createActivityMarker(): Promise<boolean> {
  if (env.CANTON_MOCK) {
    log.debug('Mock mode — skipping activity marker creation');
    return true;
  }

  const contractId = await findFeaturedAppRight();
  if (!contractId) {
    log.warn('Cannot create activity marker — no FeaturedAppRight contract');
    return false;
  }

  try {
    const client = CantonClient.getInstance();
    const operator = cantonConfig().parties.operator;

    await client.exerciseChoice(
      FEATURED_APP_RIGHT_INTERFACE,
      contractId,
      CREATE_MARKER_CHOICE,
      {
        beneficiaries: [
          {
            beneficiary: operator,
            weight: '1.0',
          },
        ],
      },
    );

    log.info('Activity marker created successfully');
    return true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    // If the contract was archived (rotated), invalidate cache and retry once
    if (message.includes('CONTRACT_NOT_FOUND') || message.includes('NOT_FOUND')) {
      log.warn('FeaturedAppRight contract rotated — invalidating cache');
      cachedFeaturedAppRightContractId = null;

      // One retry with fresh contract lookup
      const freshId = await findFeaturedAppRight();
      if (freshId) {
        try {
          const client = CantonClient.getInstance();
          const operator = cantonConfig().parties.operator;

          await client.exerciseChoice(
            FEATURED_APP_RIGHT_TEMPLATE,
            freshId,
            CREATE_MARKER_CHOICE,
            {
              beneficiaries: [
                {
                  beneficiary: operator,
                  weight: '1.0',
                },
              ],
            },
          );

          log.info('Activity marker created on retry');
          return true;
        } catch (retryErr) {
          log.error({ err: retryErr }, 'Activity marker retry failed');
          return false;
        }
      }
    }

    log.error({ err: message }, 'Failed to create activity marker');
    return false;
  }
}

/**
 * Convenience wrapper: find right → create marker.
 * Never throws — errors are logged and false is returned.
 */
export async function recordCantonActivity(): Promise<boolean> {
  try {
    return await createActivityMarker();
  } catch (err) {
    log.error({ err }, 'recordCantonActivity failed');
    return false;
  }
}
