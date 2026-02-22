'use client';

import { useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { usePrivacyStore } from '@/stores/usePrivacyStore';
import type { PrivacyLevel, DataScope } from '@dualis/shared';

/**
 * Hook for privacy configuration API interactions.
 */
export function usePrivacy() {
  const store = usePrivacyStore();

  const fetchPrivacyConfig = useCallback(async () => {
    try {
      const { data } = await apiClient.get(ENDPOINTS.PRIVACY_CONFIG);
      return data;
    } catch {
      await store.fetchPrivacyConfig();
    }
  }, [store]);

  const setPrivacyLevel = useCallback(
    async (level: PrivacyLevel) => {
      try {
        await apiClient.put(ENDPOINTS.PRIVACY_LEVEL, { level });
        store.setPrivacyLevel(level);
      } catch {
        store.setPrivacyLevel(level);
      }
    },
    [store],
  );

  const addDisclosure = useCallback(
    async (disclosure: {
      discloseTo: string;
      displayName: string;
      dataScope: DataScope;
      purpose: string;
      expiresAt: string | null;
    }) => {
      try {
        const { data } = await apiClient.post(ENDPOINTS.PRIVACY_DISCLOSURE_ADD, disclosure);
        await store.fetchPrivacyConfig();
        return data;
      } catch {
        store.addDisclosure(disclosure);
      }
    },
    [store],
  );

  const removeDisclosure = useCallback(
    async (id: string) => {
      try {
        await apiClient.delete(ENDPOINTS.PRIVACY_DISCLOSURE_REMOVE(id));
        store.removeDisclosure(id);
      } catch {
        store.removeDisclosure(id);
      }
    },
    [store],
  );

  const fetchAuditLog = useCallback(async () => {
    try {
      const { data } = await apiClient.get(ENDPOINTS.PRIVACY_AUDIT_LOG);
      return data;
    } catch {
      await store.fetchAuditLog();
    }
  }, [store]);

  return {
    config: store.config,
    auditLog: store.auditLog,
    isLoading: store.isLoading,
    fetchPrivacyConfig,
    setPrivacyLevel,
    addDisclosure,
    removeDisclosure,
    fetchAuditLog,
  };
}
