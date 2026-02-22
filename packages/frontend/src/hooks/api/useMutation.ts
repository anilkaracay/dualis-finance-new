'use client';

import { useState, useCallback } from 'react';
import { apiClient, parseError } from '@/lib/api/client';

export interface UseMutationResult<T> {
  execute: (url: string, body?: Record<string, unknown> | undefined) => Promise<T>;
  isLoading: boolean;
  error: string | null;
  data: T | null;
  reset: () => void;
}

/**
 * Generic mutation hook for POST requests through the Dualis API client.
 *
 * Usage:
 * ```ts
 * const { execute, isLoading, error } = useMutation<DepositResponse>();
 * const result = await execute('/pools/usdc-main/deposit', { amount: '1000' });
 * ```
 */
export function useMutation<T = unknown>(): UseMutationResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (url: string, body?: Record<string, unknown> | undefined): Promise<T> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.post<T>(url, body);
        setData(response.data);
        setIsLoading(false);
        return response.data;
      } catch (err: unknown) {
        const message = parseError(err);
        setError(message);
        setIsLoading(false);
        throw new Error(message);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { execute, isLoading, error, data, reset };
}
