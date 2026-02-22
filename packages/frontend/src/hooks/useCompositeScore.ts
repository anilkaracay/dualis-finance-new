'use client';

import { useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { useCompositeScoreStore } from '@/stores/useCompositeScoreStore';

/**
 * Hook for composite credit score API interactions.
 */
export function useCompositeScore() {
  const store = useCompositeScoreStore();

  const fetchCompositeScore = useCallback(async () => {
    try {
      const { data } = await apiClient.get(ENDPOINTS.COMPOSITE_SCORE);
      return data;
    } catch {
      await store.fetchCompositeScore();
    }
  }, [store]);

  const simulateScore = useCallback(
    async (params: { additionalAttestations?: string[]; additionalCollateral?: number }) => {
      try {
        const { data } = await apiClient.post(ENDPOINTS.COMPOSITE_SIMULATE, params);
        return data;
      } catch {
        store.simulateScore(params as Parameters<typeof store.simulateScore>[0]);
      }
    },
    [store],
  );

  const clearSimulation = useCallback(() => {
    store.clearSimulation();
  }, [store]);

  return {
    compositeScore: store.compositeScore,
    simulatedScore: store.simulatedScore,
    isLoading: store.isLoading,
    fetchCompositeScore,
    simulateScore,
    clearSimulation,
  };
}
