'use client';

import { useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { useInstitutionalStore } from '@/stores/useInstitutionalStore';

/**
 * Hook for institutional API interactions.
 */
export function useInstitutional() {
  const store = useInstitutionalStore();

  const fetchInstitutionStatus = useCallback(async () => {
    try {
      const { data } = await apiClient.get(ENDPOINTS.INSTITUTIONAL_STATUS);
      return data;
    } catch {
      await store.fetchInstitutionStatus();
    }
  }, [store]);

  const startOnboarding = useCallback(
    async (payload: { legalName: string; registrationNo: string; jurisdiction: string }) => {
      try {
        const { data } = await apiClient.post(ENDPOINTS.INSTITUTIONAL_ONBOARD, payload);
        return data;
      } catch {
        await store.startOnboarding(payload);
      }
    },
    [store],
  );

  const submitKYB = useCallback(
    async (documents: Record<string, unknown>) => {
      try {
        const { data } = await apiClient.post(ENDPOINTS.INSTITUTIONAL_KYB, { documents });
        return data;
      } catch {
        await store.submitKYB(documents);
      }
    },
    [store],
  );

  return {
    institution: store.institution,
    isLoading: store.isLoading,
    onboardingStep: store.onboardingStep,
    fetchInstitutionStatus,
    startOnboarding,
    submitKYB,
    setOnboardingStep: store.setOnboardingStep,
  };
}
