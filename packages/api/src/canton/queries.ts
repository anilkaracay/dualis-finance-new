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
  AttestationBundle,
  CompositeScore,
  ProductiveProject,
  ProductiveBorrow,
  ProductivePool,
  VerifiedInstitution,
  PrivacyConfig,
  PrivacyAuditEntry,
} from '@dualis/shared';
import { CantonClient } from './client.js';
import type { CantonContract } from './types.js';

// ---------------------------------------------------------------------------
// Template IDs
// ---------------------------------------------------------------------------

const TEMPLATES = {
  lendingPool: 'Dualis.Lending.Pool:LendingPool',
  supplyPosition: 'Dualis.Lending.Pool:SupplyPosition',
  borrowPosition: 'Dualis.Lending.Borrow:BorrowPosition',
  collateralVault: 'Dualis.Lending.Collateral:CollateralVault',
  creditProfile: 'Dualis.Credit.CompositeScore:CompositeCredit', // No CreditProfile template; use CompositeCredit
  secLendingOffer: 'Dualis.SecLending.Advanced:FractionalOffer',
  secLendingDeal: 'Dualis.SecLending.Advanced:NettingAgreement',
  priceFeed: 'Dualis.Oracle.PriceFeed:PriceFeed',
  protocolConfig: 'Dualis.Core.Config:ProtocolConfig',
  creditAttestationBundle: 'Dualis.Credit.Attestation:CreditAttestationBundle',
  compositeCredit: 'Dualis.Credit.CompositeScore:CompositeCredit',
  productiveProject: 'Dualis.Productive.Core:ProductiveProject',
  productiveBorrow: 'Dualis.Productive.Core:ProductiveBorrow',
  productivePool: 'Dualis.Productive.Core:ProductiveLendingPool',
  verifiedInstitution: 'Dualis.Institutional.Core:VerifiedInstitution',
  privacyConfig: 'Dualis.Privacy.Config:PrivacyConfig',
  privacyAuditEntry: 'Dualis.Privacy.AuditLog:PrivacyAuditEntry',
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
// Supply position queries
// ---------------------------------------------------------------------------

/** Fetch all supply positions for a given depositor. */
export async function getSupplyPositions(depositor: string): Promise<CantonContract<Record<string, unknown>>[]> {
  const client = CantonClient.getInstance();
  return client.queryContracts<Record<string, unknown>>(TEMPLATES.supplyPosition, { depositor });
}

/** Fetch all supply positions for a given pool. */
export async function getSupplyPositionsByPool(poolId: string): Promise<CantonContract<Record<string, unknown>>[]> {
  const client = CantonClient.getInstance();
  return client.queryContracts<Record<string, unknown>>(TEMPLATES.supplyPosition, { poolId });
}

// ---------------------------------------------------------------------------
// Borrow / position queries
// ---------------------------------------------------------------------------

/** Fetch all borrow positions for a given borrower. */
export async function getUserPositions(partyId: string): Promise<CantonContract<BorrowPosition>[]> {
  const client = CantonClient.getInstance();
  return client.queryContracts<BorrowPosition>(TEMPLATES.borrowPosition, { borrower: partyId });
}

/** Fetch all active borrow positions (optionally filtered by pool). */
export async function getActiveBorrows(poolId?: string): Promise<CantonContract<BorrowPosition>[]> {
  const client = CantonClient.getInstance();
  const query = poolId ? { poolId } : undefined;
  return client.queryContracts<BorrowPosition>(TEMPLATES.borrowPosition, query);
}

// ---------------------------------------------------------------------------
// Collateral vault queries
// ---------------------------------------------------------------------------

/** Fetch all collateral vaults for a given owner. */
export async function getCollateralVaults(owner: string): Promise<CantonContract<Record<string, unknown>>[]> {
  const client = CantonClient.getInstance();
  return client.queryContracts<Record<string, unknown>>(TEMPLATES.collateralVault, { owner });
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

// ---------------------------------------------------------------------------
// Credit attestation queries
// ---------------------------------------------------------------------------

/** Fetch the attestation bundle for a given party. */
export async function getAttestationBundle(partyId: string): Promise<CantonContract<AttestationBundle> | null> {
  const client = CantonClient.getInstance();
  return client.queryContractByKey<AttestationBundle>(TEMPLATES.creditAttestationBundle, { owner: partyId });
}

/** Fetch the composite credit score for a given party. */
export async function getCompositeScore(partyId: string): Promise<CantonContract<CompositeScore> | null> {
  const client = CantonClient.getInstance();
  return client.queryContractByKey<CompositeScore>(TEMPLATES.compositeCredit, { owner: partyId });
}

// ---------------------------------------------------------------------------
// Productive queries
// ---------------------------------------------------------------------------

/** Fetch all productive projects, optionally filtered. */
export async function getProductiveProjects(filters?: Record<string, unknown>): Promise<CantonContract<ProductiveProject>[]> {
  const client = CantonClient.getInstance();
  return client.queryContracts<ProductiveProject>(TEMPLATES.productiveProject, filters);
}

/** Fetch a single productive project by its key. */
export async function getProductiveProjectByKey(projectId: string): Promise<CantonContract<ProductiveProject> | null> {
  const client = CantonClient.getInstance();
  return client.queryContractByKey<ProductiveProject>(TEMPLATES.productiveProject, { projectId });
}

/** Fetch all productive borrows, optionally filtered by party. */
export async function getProductiveBorrows(partyId?: string): Promise<CantonContract<ProductiveBorrow>[]> {
  const client = CantonClient.getInstance();
  const query = partyId ? { borrower: partyId } : undefined;
  return client.queryContracts<ProductiveBorrow>(TEMPLATES.productiveBorrow, query);
}

/** Fetch all productive lending pools. */
export async function getProductivePools(): Promise<CantonContract<ProductivePool>[]> {
  const client = CantonClient.getInstance();
  return client.queryContracts<ProductivePool>(TEMPLATES.productivePool);
}

// ---------------------------------------------------------------------------
// Institutional queries
// ---------------------------------------------------------------------------

/** Fetch the verified institution record for a given party. */
export async function getVerifiedInstitution(partyId: string): Promise<CantonContract<VerifiedInstitution> | null> {
  const client = CantonClient.getInstance();
  return client.queryContractByKey<VerifiedInstitution>(TEMPLATES.verifiedInstitution, { institution: partyId });
}

// ---------------------------------------------------------------------------
// Privacy queries
// ---------------------------------------------------------------------------

/** Fetch the privacy config for a given party. */
export async function getPrivacyConfig(partyId: string): Promise<CantonContract<PrivacyConfig> | null> {
  const client = CantonClient.getInstance();
  return client.queryContractByKey<PrivacyConfig>(TEMPLATES.privacyConfig, { user: partyId });
}

/** Fetch privacy audit entries for a given party (owner). */
export async function getPrivacyAuditEntries(partyId: string): Promise<CantonContract<PrivacyAuditEntry>[]> {
  const client = CantonClient.getInstance();
  return client.queryContracts<PrivacyAuditEntry>(TEMPLATES.privacyAuditEntry, { ownerParty: partyId });
}
