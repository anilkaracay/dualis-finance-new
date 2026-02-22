import { createChildLogger } from '../config/logger.js';
import type {
  CompositeScore,
  OnChainBreakdown,
  OffChainBreakdown,
  EcosystemBreakdown,
  CreditTier,
  OffChainAttestation,
} from '@dualis/shared';
import { TIER_BENEFITS } from '@dualis/shared';
import * as attestationService from './attestation.service.js';

const log = createChildLogger('composite-credit-service');

// ---------------------------------------------------------------------------
// Score cache
// ---------------------------------------------------------------------------

const scoreCache: Map<string, CompositeScore> = new Map();

// ---------------------------------------------------------------------------
// Tier thresholds
// ---------------------------------------------------------------------------

const TIER_THRESHOLDS: { tier: CreditTier; min: number }[] = [
  { tier: 'Diamond', min: 850 },
  { tier: 'Gold', min: 700 },
  { tier: 'Silver', min: 500 },
  { tier: 'Bronze', min: 300 },
  { tier: 'Unrated', min: 0 },
];

function deriveTier(score: number): CreditTier {
  for (const t of TIER_THRESHOLDS) {
    if (score >= t.min) return t.tier;
  }
  return 'Unrated';
}

function getNextTier(score: number, currentTier: CreditTier) {
  const idx = TIER_THRESHOLDS.findIndex((t) => t.tier === currentTier);
  if (idx <= 0) {
    return { name: 'Diamond', threshold: 850, pointsNeeded: 0, progressPercent: 100 };
  }
  const next = TIER_THRESHOLDS[idx - 1]!;
  const current = TIER_THRESHOLDS[idx]!;
  const pointsNeeded = Math.max(0, next.min - score);
  const range = next.min - current.min;
  const progress = range > 0 ? ((score - current.min) / range) * 100 : 100;
  return {
    name: next.tier,
    threshold: next.min,
    pointsNeeded,
    progressPercent: Math.min(100, Math.round(progress)),
  };
}

// ---------------------------------------------------------------------------
// Layer calculations
// ---------------------------------------------------------------------------

function calculateOnChainLayer(partyId: string): OnChainBreakdown {
  // Mock: deterministic based on partyId hash
  const hash = simpleHash(partyId);
  const loanCompletion = Math.min(150, 80 + (hash % 70));
  const repaymentSpeed = Math.min(100, 50 + ((hash >> 4) % 50));
  const collateralHealth = Math.min(80, 40 + ((hash >> 8) % 40));
  const protocolHistory = Math.min(40, 15 + ((hash >> 12) % 25));
  const secLendingRecord = Math.min(30, 10 + ((hash >> 16) % 20));
  const total = loanCompletion + repaymentSpeed + collateralHealth + protocolHistory + secLendingRecord;

  return { loanCompletion, repaymentSpeed, collateralHealth, protocolHistory, secLendingRecord, total };
}

function calculateOffChainLayer(attestations: OffChainAttestation[]): OffChainBreakdown {
  const now = new Date();
  const valid = attestations.filter((a) => a.verified && !a.revoked && new Date(a.expiresAt) > now);

  let creditBureauScore = 0;
  let incomeVerification = 0;
  let businessVerification = 0;
  let kycCompletion = 0;

  for (const att of valid) {
    switch (att.type) {
      case 'credit_bureau': {
        const rangeScores: Record<string, number> = { excellent: 150, good: 110, fair: 70, above_700: 130 };
        creditBureauScore = Math.max(creditBureauScore, rangeScores[att.claimedRange] ?? 50);
        break;
      }
      case 'income_verification': {
        const rangeScores: Record<string, number> = { above_100k: 100, above_50k: 70, verified: 50 };
        incomeVerification = Math.max(incomeVerification, rangeScores[att.claimedRange] ?? 30);
        break;
      }
      case 'business_verification':
        businessVerification = Math.max(businessVerification, att.claimedRange === 'verified' ? 50 : 25);
        break;
      case 'kyc_completion':
        kycCompletion = Math.max(kycCompletion, att.claimedRange === 'verified' ? 50 : 25);
        break;
    }
  }

  const total = creditBureauScore + incomeVerification + businessVerification + kycCompletion;
  return { creditBureauScore, incomeVerification, businessVerification, kycCompletion, total };
}

function calculateEcosystemLayer(partyId: string): EcosystemBreakdown {
  // Mock: deterministic based on partyId
  const hash = simpleHash(partyId + ':ecosystem');
  const tifaPerformance = Math.min(100, 30 + (hash % 70));
  const crossProtocolRefs = Math.min(80, 20 + ((hash >> 8) % 60));
  const governanceStaking = Math.min(70, 10 + ((hash >> 16) % 60));
  const total = tifaPerformance + crossProtocolRefs + governanceStaking;

  return { tifaPerformance, crossProtocolRefs, governanceStaking, total };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function calculateCompositeScore(partyId: string): CompositeScore {
  log.info({ partyId }, 'Calculating composite score');

  const bundle = attestationService.getAttestations(partyId);
  const onChainDetail = calculateOnChainLayer(partyId);
  const offChainDetail = calculateOffChainLayer(bundle.attestations);
  const ecosystemDetail = calculateEcosystemLayer(partyId);

  const compositeScore = Math.min(1000, onChainDetail.total + offChainDetail.total + ecosystemDetail.total);
  const tier = deriveTier(compositeScore);
  const benefits = TIER_BENEFITS[tier];
  const nextTier = getNextTier(compositeScore, tier);

  const result: CompositeScore = {
    partyId,
    compositeScore,
    tier,
    layers: {
      onChain: { score: onChainDetail.total, max: 400 },
      offChain: { score: offChainDetail.total, max: 350 },
      ecosystem: { score: ecosystemDetail.total, max: 250 },
    },
    onChainDetail,
    offChainDetail,
    ecosystemDetail,
    nextTier,
    benefits,
    lastCalculated: new Date().toISOString(),
  };

  scoreCache.set(partyId, result);
  return result;
}

export function getCompositeScore(partyId: string): CompositeScore {
  log.debug({ partyId }, 'Getting composite score');

  const cached = scoreCache.get(partyId);
  if (cached) return cached;

  return calculateCompositeScore(partyId);
}

export function simulateScore(
  partyId: string,
  hypotheticalAttestations: OffChainAttestation[],
): CompositeScore {
  log.debug({ partyId, count: hypotheticalAttestations.length }, 'Simulating composite score');

  const onChainDetail = calculateOnChainLayer(partyId);
  const offChainDetail = calculateOffChainLayer(hypotheticalAttestations);
  const ecosystemDetail = calculateEcosystemLayer(partyId);

  const compositeScore = Math.min(1000, onChainDetail.total + offChainDetail.total + ecosystemDetail.total);
  const tier = deriveTier(compositeScore);
  const benefits = TIER_BENEFITS[tier];
  const nextTier = getNextTier(compositeScore, tier);

  return {
    partyId,
    compositeScore,
    tier,
    layers: {
      onChain: { score: onChainDetail.total, max: 400 },
      offChain: { score: offChainDetail.total, max: 350 },
      ecosystem: { score: ecosystemDetail.total, max: 250 },
    },
    onChainDetail,
    offChainDetail,
    ecosystemDetail,
    nextTier,
    benefits,
    lastCalculated: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function simpleHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
