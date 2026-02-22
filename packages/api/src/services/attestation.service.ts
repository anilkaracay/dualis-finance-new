import { createChildLogger } from '../config/logger.js';
import { randomUUID } from 'node:crypto';
import type {
  OffChainAttestation,
  AttestationBundle,
  AttestationType,
  ZKProof,
  TransactionMeta,
} from '@dualis/shared';

const log = createChildLogger('attestation-service');

function buildTransactionMeta(): TransactionMeta {
  return {
    id: `tx-${randomUUID()}`,
    status: 'confirmed',
    timestamp: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Mock attestation store
// ---------------------------------------------------------------------------

const MOCK_ATTESTATIONS: Map<string, OffChainAttestation[]> = new Map();

// ---------------------------------------------------------------------------
// Cross-referenced mock users:
// 1. party::retail_user_001 — Retail, Gold tier, 2 attestations, 1 productive position
// 2. party::inst_cayvox_001 — Institutional (Cayvox Labs), Diamond tier, full KYB, 3 sub-accounts
// 3. party::inst_goldman_001 — Institutional (Goldman Sachs Digital), Diamond tier, max privacy
// 4. party::retail_user_002 — Retail, Silver tier, no attestations (new user)
// 5. party::sme_konya_001 — SME, Gold tier, solar project owner, TIFA cross-reference
// ---------------------------------------------------------------------------

const DEMO_PARTY = 'party::alice::1';
MOCK_ATTESTATIONS.set(DEMO_PARTY, [
  {
    id: 'att-001',
    type: 'credit_bureau',
    provider: 'findeks',
    claimedRange: 'excellent',
    proof: {
      proofData: 'zkp-findeks-mock-001',
      verifierKey: 'vk-findeks-v1',
      publicInputs: ['range:excellent', 'timestamp:2026-01'],
      circuit: 'credit-range-v1',
      generatedAt: '2026-01-15T10:00:00.000Z',
    },
    issuedAt: '2026-01-15T10:00:00.000Z',
    expiresAt: '2026-07-15T10:00:00.000Z',
    revoked: false,
    verified: true,
  },
  {
    id: 'att-002',
    type: 'income_verification',
    provider: 'experian',
    claimedRange: 'above_100k',
    proof: {
      proofData: 'zkp-experian-mock-002',
      verifierKey: 'vk-experian-v1',
      publicInputs: ['range:above_100k', 'timestamp:2026-02'],
      circuit: 'income-range-v1',
      generatedAt: '2026-02-01T08:00:00.000Z',
    },
    issuedAt: '2026-02-01T08:00:00.000Z',
    expiresAt: '2026-08-01T08:00:00.000Z',
    revoked: false,
    verified: true,
  },
  {
    id: 'att-003',
    type: 'kyc_completion',
    provider: 'tifa',
    claimedRange: 'verified',
    proof: {
      proofData: 'zkp-tifa-mock-003',
      verifierKey: 'vk-tifa-v1',
      publicInputs: ['status:verified'],
      circuit: 'kyc-complete-v1',
      generatedAt: '2025-12-10T12:00:00.000Z',
    },
    issuedAt: '2025-12-10T12:00:00.000Z',
    expiresAt: '2025-12-10T12:00:00.000Z', // expired
    revoked: false,
    verified: false,
  },
]);

// Retail user — Gold tier with credit bureau + income attestations
MOCK_ATTESTATIONS.set('party::retail_user_001', [
  {
    id: 'att-r1-001',
    type: 'credit_bureau',
    provider: 'findeks',
    claimedRange: 'good',
    proof: {
      proofData: 'zkp-findeks-r1-001',
      verifierKey: 'vk-findeks-v1',
      publicInputs: ['range:good', 'timestamp:2026-01'],
      circuit: 'credit-range-v1',
      generatedAt: '2026-01-20T09:00:00.000Z',
    },
    issuedAt: '2026-01-20T09:00:00.000Z',
    expiresAt: '2026-07-20T09:00:00.000Z',
    revoked: false,
    verified: true,
  },
  {
    id: 'att-r1-002',
    type: 'income_verification',
    provider: 'findeks',
    claimedRange: 'above_50k',
    proof: {
      proofData: 'zkp-findeks-r1-002',
      verifierKey: 'vk-findeks-v1',
      publicInputs: ['range:above_50k', 'timestamp:2026-01'],
      circuit: 'income-range-v1',
      generatedAt: '2026-01-20T09:15:00.000Z',
    },
    issuedAt: '2026-01-20T09:15:00.000Z',
    expiresAt: '2026-07-20T09:15:00.000Z',
    revoked: false,
    verified: true,
  },
]);

// Institutional — Cayvox Labs, Diamond tier (credit + income + business + KYC + TIFA)
MOCK_ATTESTATIONS.set('party::inst_cayvox_001', [
  {
    id: 'att-cv-001',
    type: 'credit_bureau',
    provider: 'findeks',
    claimedRange: 'excellent',
    proof: {
      proofData: 'zkp-findeks-cv-001',
      verifierKey: 'vk-findeks-v1',
      publicInputs: ['range:excellent', 'timestamp:2025-12'],
      circuit: 'credit-range-v1',
      generatedAt: '2025-12-01T08:00:00.000Z',
    },
    issuedAt: '2025-12-01T08:00:00.000Z',
    expiresAt: '2026-06-01T08:00:00.000Z',
    revoked: false,
    verified: true,
  },
  {
    id: 'att-cv-002',
    type: 'business_verification',
    provider: 'tifa',
    claimedRange: 'verified',
    proof: {
      proofData: 'zkp-tifa-cv-002',
      verifierKey: 'vk-tifa-v1',
      publicInputs: ['status:verified', 'tier:premium'],
      circuit: 'biz-verify-v1',
      generatedAt: '2025-12-05T10:00:00.000Z',
    },
    issuedAt: '2025-12-05T10:00:00.000Z',
    expiresAt: '2026-12-05T10:00:00.000Z',
    revoked: false,
    verified: true,
  },
  {
    id: 'att-cv-003',
    type: 'kyc_completion',
    provider: 'tifa',
    claimedRange: 'verified',
    proof: {
      proofData: 'zkp-tifa-cv-003',
      verifierKey: 'vk-tifa-v1',
      publicInputs: ['status:verified'],
      circuit: 'kyc-complete-v1',
      generatedAt: '2025-11-20T12:00:00.000Z',
    },
    issuedAt: '2025-11-20T12:00:00.000Z',
    expiresAt: '2026-11-20T12:00:00.000Z',
    revoked: false,
    verified: true,
  },
]);

// SME Konya — Gold tier with TIFA performance attestation
MOCK_ATTESTATIONS.set('party::sme_konya_001', [
  {
    id: 'att-sme-001',
    type: 'credit_bureau',
    provider: 'findeks',
    claimedRange: 'good',
    proof: {
      proofData: 'zkp-findeks-sme-001',
      verifierKey: 'vk-findeks-v1',
      publicInputs: ['range:good', 'timestamp:2026-01'],
      circuit: 'credit-range-v1',
      generatedAt: '2026-01-10T08:00:00.000Z',
    },
    issuedAt: '2026-01-10T08:00:00.000Z',
    expiresAt: '2026-07-10T08:00:00.000Z',
    revoked: false,
    verified: true,
  },
  {
    id: 'att-sme-002',
    type: 'tifa_performance',
    provider: 'tifa',
    claimedRange: 'top_quartile',
    proof: {
      proofData: 'zkp-tifa-sme-002',
      verifierKey: 'vk-tifa-v1',
      publicInputs: ['performance:top_quartile', 'receivables:12'],
      circuit: 'tifa-perf-v1',
      generatedAt: '2026-02-01T10:00:00.000Z',
    },
    issuedAt: '2026-02-01T10:00:00.000Z',
    expiresAt: '2026-08-01T10:00:00.000Z',
    revoked: false,
    verified: true,
  },
]);

// party::retail_user_002 — No attestations (new user, Silver via on-chain only)
// party::inst_goldman_001 — attestations handled by separate KYB flow

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

export function addAttestation(
  partyId: string,
  attestation: {
    type: AttestationType;
    provider: string;
    claimedRange: string;
    proof: ZKProof;
    expiresAt: string;
  },
): { data: OffChainAttestation; transaction: TransactionMeta } {
  log.info({ partyId, type: attestation.type, provider: attestation.provider }, 'Adding attestation');

  const verified = verifyAttestation(attestation.proof);

  const newAttestation: OffChainAttestation = {
    id: `att-${randomUUID().slice(0, 8)}`,
    type: attestation.type,
    provider: attestation.provider,
    claimedRange: attestation.claimedRange,
    proof: attestation.proof,
    issuedAt: new Date().toISOString(),
    expiresAt: attestation.expiresAt,
    revoked: false,
    verified,
  };

  const existing = MOCK_ATTESTATIONS.get(partyId) ?? [];
  existing.push(newAttestation);
  MOCK_ATTESTATIONS.set(partyId, existing);

  return {
    data: newAttestation,
    transaction: buildTransactionMeta(),
  };
}

export function getAttestations(partyId: string): AttestationBundle {
  log.debug({ partyId }, 'Getting attestations');

  const all = MOCK_ATTESTATIONS.get(partyId) ?? [];
  const now = new Date();

  // Filter out expired & revoked for active view, but include all in bundle
  const attestations = all.map((a) => ({
    ...a,
    verified: a.verified && !a.revoked && new Date(a.expiresAt) > now,
  }));

  return {
    partyId,
    attestations,
    lastVerified: new Date().toISOString(),
  };
}

export function revokeAttestation(
  partyId: string,
  attestationId: string,
): { data: { revoked: boolean }; transaction: TransactionMeta } {
  log.info({ partyId, attestationId }, 'Revoking attestation');

  const existing = MOCK_ATTESTATIONS.get(partyId);
  if (existing) {
    const att = existing.find((a) => a.id === attestationId);
    if (att) {
      att.revoked = true;
      att.verified = false;
    }
  }

  return {
    data: { revoked: true },
    transaction: buildTransactionMeta(),
  };
}

export function verifyAttestation(proof: ZKProof): boolean {
  // Mock ZK proof verification — in production this would call a verifier contract
  log.debug({ circuit: proof.circuit }, 'Verifying ZK proof (mock)');
  return (
    proof.proofData.length > 0 &&
    proof.verifierKey.length > 0 &&
    proof.publicInputs.length > 0 &&
    proof.circuit.length > 0
  );
}

export function getAttestationById(
  partyId: string,
  attestationId: string,
): OffChainAttestation | null {
  const all = MOCK_ATTESTATIONS.get(partyId) ?? [];
  return all.find((a) => a.id === attestationId) ?? null;
}
