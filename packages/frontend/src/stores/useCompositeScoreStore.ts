'use client';

import { create } from 'zustand';
import type { CompositeScore, OffChainAttestation, CreditTier } from '@dualis/shared';

interface CompositeScoreState {
  compositeScore: CompositeScore | null;
  isLoading: boolean;
  simulatedScore: CompositeScore | null;
}

interface CompositeScoreActions {
  fetchCompositeScore: () => Promise<void>;
  simulateScore: (hypothetical: Partial<OffChainAttestation>[]) => Promise<void>;
  clearSimulation: () => void;
}

const MOCK_COMPOSITE_SCORE: CompositeScore = {
  partyId: 'party::alice::1',
  compositeScore: 742,
  tier: 'Gold' as CreditTier,
  layers: {
    onChain: { score: 312, max: 400 },
    offChain: { score: 250, max: 350 },
    ecosystem: { score: 180, max: 250 },
  },
  onChainDetail: {
    loanCompletion: 130,
    repaymentSpeed: 78,
    collateralHealth: 52,
    protocolHistory: 28,
    secLendingRecord: 24,
    total: 312,
  },
  offChainDetail: {
    creditBureauScore: 150,
    incomeVerification: 50,
    businessVerification: 25,
    kycCompletion: 25,
    total: 250,
  },
  ecosystemDetail: {
    tifaPerformance: 80,
    crossProtocolRefs: 55,
    governanceStaking: 45,
    total: 180,
  },
  nextTier: {
    name: 'Diamond',
    threshold: 850,
    pointsNeeded: 108,
    progressPercent: 72,
  },
  benefits: {
    maxLTV: 0.78,
    rateDiscount: 0.15,
    minCollateralRatio: 1.25,
    liquidationBuffer: 0.08,
  },
  lastCalculated: '2026-02-22T06:00:00.000Z',
};

export const useCompositeScoreStore = create<CompositeScoreState & CompositeScoreActions>()((set) => ({
  compositeScore: null,
  isLoading: false,
  simulatedScore: null,

  fetchCompositeScore: async () => {
    set({ isLoading: true });
    try {
      const { apiClient } = await import('@/lib/api/client');
      const res = await apiClient.get<CompositeScore>('/attestation/composite-score');
      if (res.data && typeof res.data.compositeScore === 'number') {
        set({ compositeScore: res.data, isLoading: false });
        return;
      }
      throw new Error('Invalid response');
    } catch {
      set({ compositeScore: MOCK_COMPOSITE_SCORE, isLoading: false });
    }
  },

  simulateScore: async (hypothetical) => {
    set({ isLoading: true });
    try {
      const { apiClient } = await import('@/lib/api/client');
      const res = await apiClient.post<CompositeScore>('/attestation/composite-score/simulate', {
        hypotheticalAttestations: hypothetical,
      });
      if (res.data) {
        set({ simulatedScore: res.data, isLoading: false });
        return;
      }
      throw new Error('Invalid response');
    } catch {
      // Simulate locally: add estimated points
      const current = MOCK_COMPOSITE_SCORE;
      const bonus = hypothetical.length * 50;
      const newScore = Math.min(1000, current.compositeScore + bonus);
      const simulated: CompositeScore = {
        ...current,
        compositeScore: newScore,
        tier: newScore >= 850 ? 'Diamond' : newScore >= 700 ? 'Gold' : newScore >= 500 ? 'Silver' : 'Bronze',
        offChainDetail: {
          ...current.offChainDetail,
          total: Math.min(350, current.offChainDetail.total + bonus),
        },
        layers: {
          ...current.layers,
          offChain: { score: Math.min(350, current.layers.offChain.score + bonus), max: 350 },
        },
        nextTier: {
          ...current.nextTier,
          pointsNeeded: Math.max(0, 850 - newScore),
          progressPercent: Math.min(100, Math.round(((newScore - 700) / 150) * 100)),
        },
      };
      set({ simulatedScore: simulated, isLoading: false });
    }
  },

  clearSimulation: () => set({ simulatedScore: null }),
}));
