/**
 * Common Canton query patterns.
 *
 * Each function uses the CantonClient singleton to fetch typed contract data
 * from the Canton ledger (or mock data in dev mode).
 */
import type {
  LendingPool,
  BorrowPosition,
  CreditProfile,
  SecLendingOffer,
  SecLendingDeal,
  PriceFeed,
  ProtocolConfig,
} from '@dualis/shared';
import { CantonClient } from './client.js';
import type { CantonContract } from './types.js';

// ---------------------------------------------------------------------------
// Template IDs
// ---------------------------------------------------------------------------

const TEMPLATES = {
  lendingPool: 'Dualis.LendingPool:LendingPool',
  borrowPosition: 'Dualis.LendingPool:BorrowPosition',
  creditProfile: 'Dualis.Credit:CreditProfile',
  secLendingOffer: 'Dualis.SecLending:SecLendingOffer',
  secLendingDeal: 'Dualis.SecLending:SecLendingDeal',
  priceFeed: 'Dualis.Oracle:PriceFeed',
  protocolConfig: 'Dualis.Protocol:ProtocolConfig',
} as const;

// ---------------------------------------------------------------------------
// Lending pool queries
// ---------------------------------------------------------------------------

/** Fetch all active lending pools from the ledger. */
export async function getAllPools(): Promise<CantonContract<LendingPool>[]> {
  const client = CantonClient.getInstance();
  return client.queryContracts<LendingPool>(TEMPLATES.lendingPool);
}

/** Fetch a single lending pool by its pool key. */
export async function getPoolByKey(poolId: string): Promise<CantonContract<LendingPool> | null> {
  const client = CantonClient.getInstance();
  return client.queryContractByKey<LendingPool>(TEMPLATES.lendingPool, { poolId });
}

// ---------------------------------------------------------------------------
// Borrow / position queries
// ---------------------------------------------------------------------------

/** Fetch all positions for a given user. */
export async function getUserPositions(partyId: string): Promise<CantonContract<BorrowPosition>[]> {
  const client = CantonClient.getInstance();
  return client.queryContracts<BorrowPosition>(TEMPLATES.borrowPosition, { borrower: partyId });
}

/** Fetch all active borrow positions (optionally filtered by pool). */
export async function getActiveBorrows(poolId?: string): Promise<CantonContract<BorrowPosition>[]> {
  const client = CantonClient.getInstance();
  const query = poolId ? { lendingPoolId: poolId } : undefined;
  return client.queryContracts<BorrowPosition>(TEMPLATES.borrowPosition, query);
}

// ---------------------------------------------------------------------------
// Credit queries
// ---------------------------------------------------------------------------

/** Fetch a user's credit profile from the ledger. */
export async function getCreditProfile(partyId: string): Promise<CantonContract<CreditProfile> | null> {
  const client = CantonClient.getInstance();
  return client.queryContractByKey<CreditProfile>(TEMPLATES.creditProfile, { borrower: partyId });
}

// ---------------------------------------------------------------------------
// Securities lending queries
// ---------------------------------------------------------------------------

/** Fetch all open securities lending offers. */
export async function getSecLendingOffers(
  assetType?: string,
): Promise<CantonContract<SecLendingOffer>[]> {
  const client = CantonClient.getInstance();
  const query = assetType && assetType !== 'all'
    ? { 'security.instrumentType': assetType }
    : undefined;
  return client.queryContracts<SecLendingOffer>(TEMPLATES.secLendingOffer, query);
}

/** Fetch all active securities lending deals for a party. */
export async function getActiveDeals(partyId: string): Promise<CantonContract<SecLendingDeal>[]> {
  const client = CantonClient.getInstance();
  // Query for deals where the party is either lender or borrower
  return client.queryContracts<SecLendingDeal>(TEMPLATES.secLendingDeal, {
    $or: [{ lender: partyId }, { borrower: partyId }],
  });
}

// ---------------------------------------------------------------------------
// Oracle queries
// ---------------------------------------------------------------------------

/** Fetch all active price feeds from the ledger. */
export async function getPriceFeed(): Promise<CantonContract<PriceFeed>[]> {
  const client = CantonClient.getInstance();
  return client.queryContracts<PriceFeed>(TEMPLATES.priceFeed);
}

// ---------------------------------------------------------------------------
// Protocol config queries
// ---------------------------------------------------------------------------

/** Fetch the current protocol configuration. */
export async function getProtocolConfig(): Promise<CantonContract<ProtocolConfig> | null> {
  const client = CantonClient.getInstance();
  const configs = await client.queryContracts<ProtocolConfig>(TEMPLATES.protocolConfig);
  return configs[0] ?? null;
}
