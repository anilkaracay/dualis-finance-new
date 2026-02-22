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

// Pre-populate with demo data
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
