'use client';

import { useState, useEffect, useCallback } from 'react';
import { walletApi } from '@/lib/api/wallet';
import { parseError } from '@/lib/api/client';
import type { WalletPreferences, UpdateWalletPreferencesRequest } from '@dualis/shared';

/**
 * Hook for wallet preferences management.
 */
export function useWalletPreferences() {
  const [preferences, setPreferences] = useState<WalletPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await walletApi.getPreferences();
      setPreferences(data);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const update = useCallback(async (updates: Partial<UpdateWalletPreferencesRequest>) => {
    setIsUpdating(true);
    setError(null);
    try {
      const { data } = await walletApi.updatePreferences(updates);
      setPreferences(data);
      return data;
    } catch (err) {
      setError(parseError(err));
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  return {
    preferences,
    isLoading,
    isUpdating,
    error,
    update,
    refetch: fetch,
  };
}
