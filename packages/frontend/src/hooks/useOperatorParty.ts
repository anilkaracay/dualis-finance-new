'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';

let cachedOperatorParty: string | null = null;

/**
 * Fetches and caches the protocol operator party identifier.
 * Used as the `to` address for wallet CC transfers (deposit, repay, add-collateral).
 */
export function useOperatorParty() {
  const [operatorParty, setOperatorParty] = useState<string | null>(cachedOperatorParty);

  useEffect(() => {
    if (cachedOperatorParty) {
      setOperatorParty(cachedOperatorParty);
      return;
    }

    apiClient.get<{ operatorParty: string }>('/config/operator')
      .then((res) => {
        // apiClient response interceptor unwraps { data: T }, so res.data = { operatorParty }
        const party = (res.data as unknown as { operatorParty?: string })?.operatorParty
          ?? (res.data as unknown as { data?: { operatorParty: string } })?.data?.operatorParty;
        if (party) {
          cachedOperatorParty = party;
          setOperatorParty(party);
        }
      })
      .catch(() => {
        // Fail silently — wallet transfer won't be available
      });
  }, []);

  return { operatorParty };
}
