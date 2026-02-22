'use client';

import { useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
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
      } catch {
        // Fallback to store's local attestation creation
        await store.addAttestation(
          payload.type as Parameters<typeof store.addAttestation>[0],
          payload.provider,
          payload.claimedRange,
          { proofData: payload.proof.publicInputHash, verifierKey: '', publicInputs: [], circuit: payload.proof.circuit, generatedAt: new Date().toISOString() },
          new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        );
      }
    },
    [store],
  );

  const revokeAttestation = useCallback(
    async (id: string) => {
      try {
        await apiClient.post(ENDPOINTS.ATTESTATION_REVOKE(id));
        store.revokeAttestation(id);
      } catch {
        // Fallback to store's local revocation
        await store.revokeAttestation(id);
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
