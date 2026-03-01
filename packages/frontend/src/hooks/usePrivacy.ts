'use client';

import { usePrivacyStore } from '@/stores/usePrivacyStore';

/**
 * Hook for privacy configuration — thin wrapper over usePrivacyStore.
 * All API interactions are handled by the store.
 */
export function usePrivacy() {
  const store = usePrivacyStore();

  return {
    config: store.config,
    auditLog: store.auditLog,
    isLoading: store.isLoading,
    error: store.error,
    fetchPrivacyConfig: store.fetchPrivacyConfig,
    setPrivacyLevel: store.setPrivacyLevel,
    addDisclosure: store.addDisclosure,
    removeDisclosure: store.removeDisclosure,
    fetchAuditLog: store.fetchAuditLog,
    clearError: store.clearError,
  };
}
