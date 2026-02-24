import { createChildLogger } from '../config/logger.js';
import type {
  CreditHistoryParams,
  CreditScoreResponse,
  CreditHistoryPoint,
  CreditTier,
  CompositeScore,
} from '@dualis/shared';
import * as compositeCreditService from './compositeCredit.service.js';

const log = createChildLogger('credit-service');

const MOCK_SCORE: CreditScoreResponse = {
  rawScore: 742,
  creditTier: 'Gold' as CreditTier,
  breakdown: {
    loanCompletion: { score: 180, max: 200, loansCompleted: 14, loansDefaulted: 0 },
    repaymentTimeliness: { score: 220, max: 250, onTime: 38, late: 2 },
    volumeHistory: { score: 140, max: 200, totalVolumeRepaid: 2_850_000 },
    collateralHealth: { score: 112, max: 150, lowestHealthFactor: 1.32 },
    securitiesLending: { score: 90, max: 200, dealsCompleted: 8 },
  },
  tierBenefits: {
    minCollateralRatio: 1.15,
    maxLTV: 0.78,
    rateDiscount: 0.15,
  },
  nextTier: {
    tier: 'Diamond' as CreditTier,
    scoreRequired: 850,
    pointsNeeded: 108,
  },
  lastUpdated: '2026-02-22T06:00:00.000Z',
};

function generateCreditHistory(period: string): CreditHistoryPoint[] {
  const periodDays: Record<string, number> = {
    '3m': 90,
    '6m': 180,
    '1y': 365,
    all: 730,
  };
  const days = periodDays[period] ?? 90;
  const now = Date.now();
  const points: CreditHistoryPoint[] = [];

  const events = [
    'Loan repaid on time',
    'New borrow position opened',
    'Collateral added',
    'Sec lending deal completed',
    'Credit tier upgrade',
    'Score recalculated',
    'Loan fully repaid',
    'Interest payment made',
  ];

  let score = 620;
  const tiers: CreditTier[] = ['Bronze', 'Silver', 'Gold', 'Diamond'];

  for (let i = days; i >= 0; i -= Math.max(1, Math.floor(days / 40))) {
    const ts = new Date(now - i * 86_400_000);
    score = Math.min(1000, score + Math.floor(Math.random() * 8) - 1);
    const tierIndex = score < 500 ? 0 : score < 650 ? 1 : score < 850 ? 2 : 3;

    points.push({
      timestamp: ts.toISOString(),
      score,
      tier: tiers[tierIndex] ?? 'Unrated',
      event: events[Math.floor(Math.random() * events.length)] ?? 'Score recalculated',
    });
  }

  return points;
}

export function getScore(partyId: string): CreditScoreResponse {
  log.debug({ partyId }, 'Getting credit score');

  // Enrich with composite score data when available
  try {
    const composite = compositeCreditService.getCompositeScore(partyId);
    return {
      ...MOCK_SCORE,
      rawScore: composite.compositeScore,
      creditTier: composite.tier,
      tierBenefits: {
        minCollateralRatio: composite.benefits.minCollateralRatio,
        maxLTV: composite.benefits.maxLTV,
        rateDiscount: composite.benefits.rateDiscount,
      },
      nextTier: composite.nextTier.pointsNeeded > 0
        ? {
            tier: composite.nextTier.name as CreditTier,
            scoreRequired: composite.nextTier.threshold,
            pointsNeeded: composite.nextTier.pointsNeeded,
          }
        : null,
      lastUpdated: composite.lastCalculated,
    };
  } catch (err) {
    log.warn({ partyId, err }, 'Composite score unavailable, returning mock score');
    return MOCK_SCORE;
  }
}

export function getCompositeScoreForParty(partyId: string): CompositeScore {
  log.debug({ partyId }, 'Getting composite score via credit service');
  return compositeCreditService.getCompositeScore(partyId);
}

export function getHistory(
  partyId: string,
  params: CreditHistoryParams
): CreditHistoryPoint[] {
  log.debug({ partyId, params }, 'Getting credit history');
  return generateCreditHistory(params.period ?? '3m');
}
