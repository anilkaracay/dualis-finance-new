import { describe, it, expect, vi } from 'vitest';

// Mock the logger before importing the services
vi.mock('../../config/logger.js', () => ({
  createChildLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import * as attestationService from '../attestation.service';
import * as compositeCreditService from '../compositeCredit.service';

describe('Credit Attestation Flow', () => {
  it('complete lifecycle: add attestation -> score recalculates -> tier benefits', () => {
    const partyId = 'party::integration-test::1';

    // -----------------------------------------------------------------------
    // 1. Add an attestation (credit_bureau with excellent range)
    // -----------------------------------------------------------------------
    const addResult = attestationService.addAttestation(partyId, {
      type: 'credit_bureau',
      provider: 'findeks',
      claimedRange: 'excellent',
      proof: {
        proofData: 'zkp-test-integration-001',
        verifierKey: 'vk-findeks-v1',
        publicInputs: ['range:excellent'],
        circuit: 'credit-range-v1',
        generatedAt: new Date().toISOString(),
      },
      expiresAt: new Date(Date.now() + 180 * 86_400_000).toISOString(),
    });

    expect(addResult.data.id).toMatch(/^att-/);
    expect(addResult.data.type).toBe('credit_bureau');
    expect(addResult.data.provider).toBe('findeks');
    expect(addResult.data.claimedRange).toBe('excellent');
    expect(addResult.data.verified).toBe(true);
    expect(addResult.data.revoked).toBe(false);
    expect(addResult.transaction.status).toBe('confirmed');

    // -----------------------------------------------------------------------
    // 2. Get attestations for the party
    // -----------------------------------------------------------------------
    const bundle = attestationService.getAttestations(partyId);

    expect(bundle.partyId).toBe(partyId);
    expect(bundle.attestations.length).toBe(1);
    expect(bundle.attestations[0]!.type).toBe('credit_bureau');
    expect(bundle.attestations[0]!.verified).toBe(true);
    expect(bundle).toHaveProperty('lastVerified');

    // -----------------------------------------------------------------------
    // 3. Calculate composite score - should include credit bureau points
    // -----------------------------------------------------------------------
    const score = compositeCreditService.calculateCompositeScore(partyId);

    expect(score.partyId).toBe(partyId);
    expect(score.compositeScore).toBeGreaterThan(0);
    expect(score.compositeScore).toBeLessThanOrEqual(1000);

    // Off-chain layer should reflect the credit_bureau attestation
    // excellent range = 150 points for creditBureauScore
    expect(score.offChainDetail.creditBureauScore).toBe(150);
    expect(score.offChainDetail.total).toBeGreaterThanOrEqual(150);

    // On-chain layer should have some score (deterministic based on partyId hash)
    expect(score.onChainDetail.total).toBeGreaterThan(0);
    expect(score.layers.onChain.max).toBe(400);
    expect(score.layers.offChain.max).toBe(350);
    expect(score.layers.ecosystem.max).toBe(250);

    // Composite = onChain + offChain + ecosystem
    const expectedComposite = Math.min(
      1000,
      score.onChainDetail.total + score.offChainDetail.total + score.ecosystemDetail.total,
    );
    expect(score.compositeScore).toBe(expectedComposite);

    // -----------------------------------------------------------------------
    // 4. Score has valid tier
    // -----------------------------------------------------------------------
    expect(['Diamond', 'Gold', 'Silver', 'Bronze', 'Unrated']).toContain(score.tier);

    // Verify tier is consistent with score thresholds
    if (score.compositeScore >= 850) {
      expect(score.tier).toBe('Diamond');
    } else if (score.compositeScore >= 700) {
      expect(score.tier).toBe('Gold');
    } else if (score.compositeScore >= 500) {
      expect(score.tier).toBe('Silver');
    } else if (score.compositeScore >= 300) {
      expect(score.tier).toBe('Bronze');
    } else {
      expect(score.tier).toBe('Unrated');
    }

    // -----------------------------------------------------------------------
    // 5. Benefits match tier
    // -----------------------------------------------------------------------
    expect(score.benefits).toHaveProperty('maxLTV');
    expect(score.benefits).toHaveProperty('rateDiscount');
    expect(score.benefits).toHaveProperty('minCollateralRatio');
    expect(score.benefits).toHaveProperty('liquidationBuffer');
    expect(score.benefits.maxLTV).toBeGreaterThan(0);

    // -----------------------------------------------------------------------
    // 6. Next tier info is present
    // -----------------------------------------------------------------------
    expect(score.nextTier).toHaveProperty('name');
    expect(score.nextTier).toHaveProperty('threshold');
    expect(score.nextTier).toHaveProperty('pointsNeeded');
    expect(score.nextTier).toHaveProperty('progressPercent');

    // -----------------------------------------------------------------------
    // 7. Simulate with additional attestation should increase or maintain score
    // -----------------------------------------------------------------------
    const simulated = compositeCreditService.simulateScore(partyId, [
      ...bundle.attestations,
      {
        id: 'sim-1',
        type: 'income_verification',
        provider: 'experian',
        claimedRange: 'above_100k',
        proof: {
          proofData: 'zkp-sim-income-001',
          verifierKey: 'vk-experian-v1',
          publicInputs: ['range:above_100k'],
          circuit: 'income-range-v1',
          generatedAt: new Date().toISOString(),
        },
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 180 * 86_400_000).toISOString(),
        revoked: false,
        verified: true,
      },
    ]);

    // Adding income_verification (above_100k = 100 points) should increase off-chain total
    expect(simulated.offChainDetail.incomeVerification).toBe(100);
    expect(simulated.offChainDetail.total).toBeGreaterThan(score.offChainDetail.total);
    expect(simulated.compositeScore).toBeGreaterThanOrEqual(score.compositeScore);
    expect(['Diamond', 'Gold', 'Silver', 'Bronze', 'Unrated']).toContain(simulated.tier);

    // Simulation should NOT alter the cached score
    const cachedScore = compositeCreditService.getCompositeScore(partyId);
    expect(cachedScore.compositeScore).toBe(score.compositeScore);
    expect(cachedScore.lastCalculated).toBe(score.lastCalculated);
  });

  it('revoked attestation reduces score', () => {
    const partyId = 'party::integration-revoke::1';

    // Add a credit_bureau attestation
    const addResult = attestationService.addAttestation(partyId, {
      type: 'credit_bureau',
      provider: 'findeks',
      claimedRange: 'good',
      proof: {
        proofData: 'zkp-revoke-test-001',
        verifierKey: 'vk-findeks-v1',
        publicInputs: ['range:good'],
        circuit: 'credit-range-v1',
        generatedAt: new Date().toISOString(),
      },
      expiresAt: new Date(Date.now() + 180 * 86_400_000).toISOString(),
    });

    expect(addResult.data.verified).toBe(true);
    const attestationId = addResult.data.id;

    // Calculate score with the attestation active
    const scoreBefore = compositeCreditService.calculateCompositeScore(partyId);
    expect(scoreBefore.offChainDetail.creditBureauScore).toBe(110); // good range = 110

    // Revoke the attestation
    const revokeResult = attestationService.revokeAttestation(partyId, attestationId);
    expect(revokeResult.data.revoked).toBe(true);
    expect(revokeResult.transaction.status).toBe('confirmed');

    // Verify the attestation is now unverified
    const bundleAfter = attestationService.getAttestations(partyId);
    const revokedAtt = bundleAfter.attestations.find((a) => a.id === attestationId);
    expect(revokedAtt).toBeDefined();
    expect(revokedAtt!.verified).toBe(false);

    // Recalculate score after revocation - credit bureau should be 0 now
    const scoreAfter = compositeCreditService.calculateCompositeScore(partyId);
    expect(scoreAfter.offChainDetail.creditBureauScore).toBe(0);
    expect(scoreAfter.offChainDetail.total).toBeLessThan(scoreBefore.offChainDetail.total);
    expect(scoreAfter.compositeScore).toBeLessThanOrEqual(scoreBefore.compositeScore);
  });

  it('multiple attestation types contribute independently to off-chain score', () => {
    const partyId = 'party::integration-multi-att::1';

    // Add credit_bureau attestation
    attestationService.addAttestation(partyId, {
      type: 'credit_bureau',
      provider: 'findeks',
      claimedRange: 'excellent',
      proof: {
        proofData: 'zkp-multi-credit',
        verifierKey: 'vk-findeks-v1',
        publicInputs: ['range:excellent'],
        circuit: 'credit-range-v1',
        generatedAt: new Date().toISOString(),
      },
      expiresAt: new Date(Date.now() + 180 * 86_400_000).toISOString(),
    });

    // Add income_verification attestation
    attestationService.addAttestation(partyId, {
      type: 'income_verification',
      provider: 'experian',
      claimedRange: 'above_100k',
      proof: {
        proofData: 'zkp-multi-income',
        verifierKey: 'vk-experian-v1',
        publicInputs: ['range:above_100k'],
        circuit: 'income-range-v1',
        generatedAt: new Date().toISOString(),
      },
      expiresAt: new Date(Date.now() + 180 * 86_400_000).toISOString(),
    });

    // Add kyc_completion attestation
    attestationService.addAttestation(partyId, {
      type: 'kyc_completion',
      provider: 'tifa',
      claimedRange: 'verified',
      proof: {
        proofData: 'zkp-multi-kyc',
        verifierKey: 'vk-tifa-v1',
        publicInputs: ['status:verified'],
        circuit: 'kyc-complete-v1',
        generatedAt: new Date().toISOString(),
      },
      expiresAt: new Date(Date.now() + 180 * 86_400_000).toISOString(),
    });

    const bundle = attestationService.getAttestations(partyId);
    expect(bundle.attestations.length).toBe(3);

    const score = compositeCreditService.calculateCompositeScore(partyId);

    // excellent credit_bureau = 150, above_100k income = 100, verified kyc = 50
    expect(score.offChainDetail.creditBureauScore).toBe(150);
    expect(score.offChainDetail.incomeVerification).toBe(100);
    expect(score.offChainDetail.kycCompletion).toBe(50);
    expect(score.offChainDetail.total).toBe(150 + 100 + 50);
  });

  it('invalid proof produces unverified attestation that does not contribute to score', () => {
    const partyId = 'party::integration-invalid-proof::1';

    // Add attestation with empty proofData (invalid proof)
    const addResult = attestationService.addAttestation(partyId, {
      type: 'credit_bureau',
      provider: 'findeks',
      claimedRange: 'excellent',
      proof: {
        proofData: '',
        verifierKey: 'vk-findeks-v1',
        publicInputs: ['range:excellent'],
        circuit: 'credit-range-v1',
        generatedAt: new Date().toISOString(),
      },
      expiresAt: new Date(Date.now() + 180 * 86_400_000).toISOString(),
    });

    // Proof verification should fail
    expect(addResult.data.verified).toBe(false);

    // Calculate score - unverified attestation should not contribute
    const score = compositeCreditService.calculateCompositeScore(partyId);
    expect(score.offChainDetail.creditBureauScore).toBe(0);
  });
});
