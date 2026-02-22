'use client';

import { useCallback } from 'react';
import { apiClient, parseError } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { useProductiveStore } from '@/stores/useProductiveStore';

/**
 * Hook for productive project API interactions.
 */
export function useProductiveProjects() {
  const store = useProductiveStore();

  const fetchProjects = useCallback(async () => {
    try {
      const { data } = await apiClient.get(ENDPOINTS.PRODUCTIVE_PROJECTS);
      return data;
    } catch {
      await store.fetchProjects();
    }
  }, [store]);

  const fetchProjectDetail = useCallback(
    async (projectId: string) => {
      try {
        const { data } = await apiClient.get(ENDPOINTS.PRODUCTIVE_PROJECT_DETAIL(projectId));
        return data;
      } catch {
        await store.fetchProjectDetail(projectId);
      }
    },
    [store],
  );

  const submitProject = useCallback(
    async (payload: Record<string, unknown>) => {
      try {
        const { data } = await apiClient.post(ENDPOINTS.PRODUCTIVE_PROJECT_SUBMIT, payload);
        await store.fetchProjects();
        return data;
      } catch (err) {
        throw new Error(parseError(err));
      }
    },
    [store],
  );

  const fetchIoTReadings = useCallback(
    async (projectId: string) => {
      try {
        const { data } = await apiClient.get(ENDPOINTS.PRODUCTIVE_IOT(projectId));
        return data;
      } catch {
        await store.fetchIoTReadings(projectId);
      }
    },
    [store],
  );

  return {
    projects: store.projects,
    selectedProject: store.selectedProject,
    iotReadings: store.iotReadings,
    isLoading: store.isLoading,
    fetchProjects,
    fetchProjectDetail,
    submitProject,
    fetchIoTReadings,
  };
}
