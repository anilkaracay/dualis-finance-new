'use client';

import { useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { useProductiveStore } from '@/stores/useProductiveStore';

/**
 * Hook for productive lending pool API interactions.
 */
export function useProductivePools() {
  const store = useProductiveStore();

  const fetchPools = useCallback(async () => {
    try {
      const { data } = await apiClient.get(ENDPOINTS.PRODUCTIVE_POOLS);
      return data;
    } catch {
      await store.fetchPools();
    }
  }, [store]);

  return {
    pools: store.pools,
    isLoading: store.isLoading,
    fetchPools,
  };
}
