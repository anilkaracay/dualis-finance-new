import type { CreditTier } from './core';

export interface OnChainBreakdown {
  loanCompletion: number; // max 150
  repaymentSpeed: number; // max 100
  collateralHealth: number; // max 80
  protocolHistory: number; // max 40
  secLendingRecord: number; // max 30
  total: number; // max 400
}

export interface OffChainBreakdown {
  creditBureauScore: number; // max 150
  incomeVerification: number; // max 100
  businessVerification: number; // max 50
  kycCompletion: number; // max 50
  total: number; // max 350
}

export interface EcosystemBreakdown {
  tifaPerformance: number; // max 100
  crossProtocolRefs: number; // max 80
  governanceStaking: number; // max 70
  total: number; // max 250
}

export interface ScoreLayer {
  onChain: { score: number; max: 400 };
  offChain: { score: number; max: 350 };
  ecosystem: { score: number; max: 250 };
}

export interface TierBenefits {
  maxLTV: number;
  rateDiscount: number;
  minCollateralRatio: number;
  liquidationBuffer: number;
}

export interface CompositeScore {
  partyId: string;
  compositeScore: number; // 0-1000
  tier: CreditTier;
  layers: ScoreLayer;
  onChainDetail: OnChainBreakdown;
  offChainDetail: OffChainBreakdown;
  ecosystemDetail: EcosystemBreakdown;
  nextTier: {
    name: string;
    threshold: number;
    pointsNeeded: number;
    progressPercent: number;
  };
  benefits: TierBenefits;
  lastCalculated: string;
}

export const TIER_BENEFITS: Record<CreditTier, TierBenefits> = {
  Diamond: { maxLTV: 0.85, rateDiscount: 0.25, minCollateralRatio: 1.15, liquidationBuffer: 0.05 },
  Gold: { maxLTV: 0.78, rateDiscount: 0.15, minCollateralRatio: 1.25, liquidationBuffer: 0.08 },
  Silver: { maxLTV: 0.70, rateDiscount: 0.08, minCollateralRatio: 1.35, liquidationBuffer: 0.10 },
  Bronze: { maxLTV: 0.60, rateDiscount: 0.00, minCollateralRatio: 1.50, liquidationBuffer: 0.12 },
  Unrated: { maxLTV: 0.50, rateDiscount: 0.00, minCollateralRatio: 1.75, liquidationBuffer: 0.15 },
};
