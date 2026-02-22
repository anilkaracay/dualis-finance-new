'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, parseError } from '@/lib/api/client';

export interface UseQueryOptions<T> {
  enabled?: boolean | undefined;
  fallbackData?: T | undefined;
}

export interface UseQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Generic data-fetching hook built on the Dualis API client.
 *
 * Pass `null` as the URL to skip fetching (e.g. when a required param is
 * not yet available). Failed requests return `null` data so pages can
 * fall back to store mock data.
 *
 * A 200 ms debounce prevents rapid re-fetches when dependencies change
 * in quick succession.
 */
export function useQuery<T>(
  url: string | null,
  options?: UseQueryOptions<T> | undefined,
): UseQueryResult<T> {
  const [data, setData] = useState<T | null>(options?.fallbackData ?? null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef<boolean>(true);

  const enabled = options?.enabled !== false;

  const fetchData = useCallback(async () => {
    if (!url || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<T>(url);
      if (mountedRef.current) {
        setData(response.data);
        setIsLoading(false);
      }
    } catch (err: unknown) {
      if (mountedRef.current) {
        setError(parseError(err));
        setData(options?.fallbackData ?? null);
        setIsLoading(false);
      }
    }
  }, [url, enabled, options?.fallbackData]);

  // Debounced effect: fires 200 ms after the URL/enabled state settles
  useEffect(() => {
    mountedRef.current = true;

    if (!url || !enabled) {
      setData(options?.fallbackData ?? null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      void fetchData();
    }, 200);

    return () => {
      mountedRef.current = false;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [url, enabled, fetchData, options?.fallbackData]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
}
