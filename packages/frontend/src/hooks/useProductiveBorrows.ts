'use client';

import { useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { useProductiveStore } from '@/stores/useProductiveStore';

/**
 * Hook for productive borrow API interactions.
 */
export function useProductiveBorrows() {
  const store = useProductiveStore();

  const fetchBorrows = useCallback(async () => {
    try {
      const { data } = await apiClient.get(ENDPOINTS.PRODUCTIVE_BORROWS);
      return data;
    } catch {
      await store.fetchBorrows();
    }
  }, [store]);

  return {
    borrows: store.borrows,
    isLoading: store.isLoading,
    fetchBorrows,
  };
}
