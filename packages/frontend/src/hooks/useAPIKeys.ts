'use client';

import { useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { useInstitutionalStore } from '@/stores/useInstitutionalStore';

/**
 * Hook for institutional API key management.
 */
export function useAPIKeys() {
  const store = useInstitutionalStore();

  const fetchAPIKeys = useCallback(async () => {
    try {
      const { data } = await apiClient.get(ENDPOINTS.INSTITUTIONAL_API_KEYS);
      return data;
    } catch {
      await store.fetchInstitutionStatus();
    }
  }, [store]);

  const createAPIKey = useCallback(
    async (name: string, permissions: string[]) => {
      try {
        const { data } = await apiClient.post(ENDPOINTS.INSTITUTIONAL_API_KEY_CREATE, {
          name,
          permissions,
        });
        await store.fetchInstitutionStatus();
        return data;
      } catch {
        await store.createAPIKey(name, permissions);
      }
    },
    [store],
  );

  const revokeAPIKey = useCallback(
    async (keyId: string) => {
      try {
        await apiClient.post(ENDPOINTS.INSTITUTIONAL_API_KEY_REVOKE(keyId));
        store.revokeAPIKey(keyId);
      } catch {
        // Fallback to store's local key revocation
        store.revokeAPIKey(keyId);
      }
    },
    [store],
  );

  return {
    apiKeys: store.apiKeys,
    isLoading: store.isLoading,
    fetchAPIKeys,
    createAPIKey,
    revokeAPIKey,
  };
}
