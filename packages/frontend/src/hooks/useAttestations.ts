'use client';

import { useCallback } from 'react';
import { apiClient, parseError } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { useAttestationStore } from '@/stores/useAttestationStore';

/**
 * Hook for attestation API interactions.
 * Uses the attestation store for state management with API-first, mock fallback.
 */
export function useAttestations() {
  const store = useAttestationStore();

  const fetchAttestations = useCallback(async () => {
    try {
      const { data } = await apiClient.get(ENDPOINTS.ATTESTATIONS);
      // If API succeeds, we could update the store here
      return data;
    } catch {
      // Fallback to store's mock data
      await store.fetchAttestations();
    }
  }, [store]);

  const submitAttestation = useCallback(
    async (payload: {
      type: string;
      provider: string;
      claimedRange: string;
      proof: { circuit: string; publicInputHash: string };
    }) => {
      try {
        const { data } = await apiClient.post(ENDPOINTS.ATTESTATION_SUBMIT, payload);
        await store.fetchAttestations();
        return data;
      } catch (err) {
        throw new Error(parseError(err));
      }
    },
    [store],
  );

  const revokeAttestation = useCallback(
    async (id: string) => {
      try {
        await apiClient.post(ENDPOINTS.ATTESTATION_REVOKE(id));
        store.revokeAttestation(id);
      } catch (err) {
        throw new Error(parseError(err));
      }
    },
    [store],
  );

  return {
    attestations: store.attestations,
    isLoading: store.isLoading,
    fetchAttestations,
    submitAttestation,
    revokeAttestation,
  };
}
