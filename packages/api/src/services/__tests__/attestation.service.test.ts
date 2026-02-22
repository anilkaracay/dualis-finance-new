import { describe, it, expect, vi } from 'vitest';

// Mock the logger before importing the service
vi.mock('../../config/logger.js', () => ({
  createChildLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import {
  addAttestation,
  getAttestations,
  revokeAttestation,
  verifyAttestation,
} from '../attestation.service';

describe('addAttestation', () => {
  it('creates attestation in store and returns it', () => {
    const partyId = 'party::test-add::1';
    const result = addAttestation(partyId, {
      type: 'credit_bureau',
      provider: 'findeks',
      claimedRange: 'excellent',
      proof: {
        proofData: 'zkp-test-001',
        verifierKey: 'vk-test-v1',
        publicInputs: ['range:excellent'],
        circuit: 'credit-range-v1',
        generatedAt: '2026-01-15T10:00:00.000Z',
      },
      expiresAt: '2027-01-15T10:00:00.000Z',
    });

    expect(result.data).toHaveProperty('id');
    expect(result.data.id).toMatch(/^att-/);
    expect(result.data.type).toBe('credit_bureau');
    expect(result.data.provider).toBe('findeks');
    expect(result.data.claimedRange).toBe('excellent');
    expect(result.data.revoked).toBe(false);
    expect(result.data.verified).toBe(true);
    expect(result.transaction).toHaveProperty('id');
    expect(result.transaction.status).toBe('confirmed');
  });

  it('rejects invalid proof format (empty proofData)', () => {
    const partyId = 'party::test-invalid::1';
    const result = addAttestation(partyId, {
      type: 'income_verification',
      provider: 'experian',
      claimedRange: 'above_100k',
      proof: {
        proofData: '',
        verifierKey: 'vk-test-v1',
        publicInputs: ['range:above_100k'],
        circuit: 'income-range-v1',
        generatedAt: '2026-01-15T10:00:00.000Z',
      },
      expiresAt: '2027-01-15T10:00:00.000Z',
    });

    // With empty proofData, verification should fail and attestation marked as unverified
    expect(result.data.verified).toBe(false);
  });
});

describe('getAttestations', () => {
  it('returns bundle with all attestations', () => {
    const bundle = getAttestations('party::alice::1');

    expect(bundle).toHaveProperty('partyId', 'party::alice::1');
    expect(bundle).toHaveProperty('attestations');
    expect(bundle).toHaveProperty('lastVerified');
    expect(Array.isArray(bundle.attestations)).toBe(true);
    expect(bundle.attestations.length).toBeGreaterThan(0);
  });

  it('marks expired attestations as unverified', () => {
    const bundle = getAttestations('party::alice::1');

    // att-003 has an expiresAt in the past (2025-12-10), so it should be unverified
    const expired = bundle.attestations.find((a) => a.id === 'att-003');
    expect(expired).toBeDefined();
    if (expired) {
      expect(expired.verified).toBe(false);
    }
  });
});

describe('revokeAttestation', () => {
  it('marks attestation as revoked', () => {
    const partyId = 'party::alice::1';
    const result = revokeAttestation(partyId, 'att-001');

    expect(result.data.revoked).toBe(true);
    expect(result.transaction).toHaveProperty('id');
    expect(result.transaction.status).toBe('confirmed');

    // Verify the attestation is now unverified after revocation
    const bundle = getAttestations(partyId);
    const revoked = bundle.attestations.find((a) => a.id === 'att-001');
    expect(revoked).toBeDefined();
    if (revoked) {
      expect(revoked.verified).toBe(false);
    }
  });
});

describe('verifyAttestation', () => {
  it('returns true for valid proof', () => {
    const result = verifyAttestation({
      proofData: 'zkp-valid-proof',
      verifierKey: 'vk-valid-v1',
      publicInputs: ['range:excellent'],
      circuit: 'credit-range-v1',
      generatedAt: '2026-01-15T10:00:00.000Z',
    });

    expect(result).toBe(true);
  });

  it('returns false for empty proof', () => {
    const result = verifyAttestation({
      proofData: '',
      verifierKey: 'vk-valid-v1',
      publicInputs: ['range:excellent'],
      circuit: 'credit-range-v1',
      generatedAt: '2026-01-15T10:00:00.000Z',
    });

    expect(result).toBe(false);
  });
});
