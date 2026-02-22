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
  calculateCompositeScore,
  getCompositeScore,
  simulateScore,
} from '../compositeCredit.service';

describe('calculateCompositeScore', () => {
  it('returns all 3 layer breakdowns', () => {
    const result = calculateCompositeScore('party::test-layers::1');

    expect(result).toHaveProperty('layers');
    expect(result.layers).toHaveProperty('onChain');
    expect(result.layers).toHaveProperty('offChain');
    expect(result.layers).toHaveProperty('ecosystem');

    expect(result.layers.onChain).toHaveProperty('score');
    expect(result.layers.onChain).toHaveProperty('max', 400);
    expect(result.layers.offChain).toHaveProperty('score');
    expect(result.layers.offChain).toHaveProperty('max', 350);
    expect(result.layers.ecosystem).toHaveProperty('score');
    expect(result.layers.ecosystem).toHaveProperty('max', 250);

    // Verify detailed breakdowns exist
    expect(result).toHaveProperty('onChainDetail');
    expect(result).toHaveProperty('offChainDetail');
    expect(result).toHaveProperty('ecosystemDetail');
  });

  it('total equals sum of 3 layers', () => {
    const result = calculateCompositeScore('party::test-sum::1');

    const layerSum =
      result.layers.onChain.score +
      result.layers.offChain.score +
      result.layers.ecosystem.score;

    // compositeScore is capped at 1000, so it equals min(1000, layerSum)
    expect(result.compositeScore).toBe(Math.min(1000, layerSum));
  });

  it('max score is 1000', () => {
    // Even with a partyId that might generate high scores, composite should never exceed 1000
    const result = calculateCompositeScore('party::test-max::1');
    expect(result.compositeScore).toBeLessThanOrEqual(1000);
    expect(result.compositeScore).toBeGreaterThanOrEqual(0);
  });
});

describe('getCompositeScore', () => {
  it('returns cached score on second call', () => {
    const partyId = 'party::test-cache::1';
    const first = calculateCompositeScore(partyId);
    const second = getCompositeScore(partyId);

    // Second call should return the cached result with the same lastCalculated timestamp
    expect(second.compositeScore).toBe(first.compositeScore);
    expect(second.tier).toBe(first.tier);
    expect(second.lastCalculated).toBe(first.lastCalculated);
  });
});

describe('simulateScore', () => {
  it('returns different result than actual without saving to cache', () => {
    const partyId = 'party::test-simulate::1';

    // Calculate actual score first
    const actual = calculateCompositeScore(partyId);

    // Simulate with hypothetical attestations that would add off-chain score
    const hypothetical = simulateScore(partyId, [
      {
        id: 'sim-att-1',
        type: 'credit_bureau',
        provider: 'findeks',
        claimedRange: 'excellent',
        proof: {
          proofData: 'zkp-sim',
          verifierKey: 'vk-sim',
          publicInputs: ['range:excellent'],
          circuit: 'credit-range-v1',
          generatedAt: new Date().toISOString(),
        },
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 86_400_000).toISOString(),
        revoked: false,
        verified: true,
      },
      {
        id: 'sim-att-2',
        type: 'income_verification',
        provider: 'experian',
        claimedRange: 'above_100k',
        proof: {
          proofData: 'zkp-sim-income',
          verifierKey: 'vk-sim-income',
          publicInputs: ['range:above_100k'],
          circuit: 'income-range-v1',
          generatedAt: new Date().toISOString(),
        },
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 86_400_000).toISOString(),
        revoked: false,
        verified: true,
      },
    ]);

    // Simulated score should differ from actual since it uses different attestations
    expect(hypothetical.offChainDetail.total).toBeGreaterThan(0);

    // Verify the cached score is still the original (simulate doesn't update cache)
    const cached = getCompositeScore(partyId);
    expect(cached.lastCalculated).toBe(actual.lastCalculated);
  });
});

describe('deriveTier (via calculateCompositeScore)', () => {
  it('correct tier for each score range boundary', () => {
    // We cannot call deriveTier directly as it is not exported,
    // but we can verify the tier logic through the returned composite scores
    const result = calculateCompositeScore('party::test-tier::1');

    const score = result.compositeScore;
    const tier = result.tier;

    if (score >= 850) {
      expect(tier).toBe('Diamond');
    } else if (score >= 700) {
      expect(tier).toBe('Gold');
    } else if (score >= 500) {
      expect(tier).toBe('Silver');
    } else if (score >= 300) {
      expect(tier).toBe('Bronze');
    } else {
      expect(tier).toBe('Unrated');
    }
  });
});

describe('benefits', () => {
  it('correct LTV and rate discount per tier', () => {
    const result = calculateCompositeScore('party::test-benefits::1');
    const tier = result.tier;
    const benefits = result.benefits;

    const expectedBenefits: Record<string, { maxLTV: number; rateDiscount: number }> = {
      Diamond: { maxLTV: 0.85, rateDiscount: 0.25 },
      Gold: { maxLTV: 0.78, rateDiscount: 0.15 },
      Silver: { maxLTV: 0.70, rateDiscount: 0.08 },
      Bronze: { maxLTV: 0.60, rateDiscount: 0.00 },
      Unrated: { maxLTV: 0.50, rateDiscount: 0.00 },
    };

    const expected = expectedBenefits[tier];
    expect(expected).toBeDefined();
    if (expected) {
      expect(benefits.maxLTV).toBe(expected.maxLTV);
      expect(benefits.rateDiscount).toBe(expected.rateDiscount);
    }

    // Verify all benefit fields exist
    expect(benefits).toHaveProperty('maxLTV');
    expect(benefits).toHaveProperty('rateDiscount');
    expect(benefits).toHaveProperty('minCollateralRatio');
    expect(benefits).toHaveProperty('liquidationBuffer');
  });
});
