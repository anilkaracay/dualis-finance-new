'use client';

import { create } from 'zustand';
import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WalletTokenBalance {
  symbol: string;
  amount: number;
  valueUSD: number;
}

interface TokenBalanceState {
  balances: WalletTokenBalance[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
}

interface TokenBalanceActions {
  fetchTokenBalances: () => Promise<void>;
  getBalanceForSymbol: (symbol: string) => number;
  requestFaucet: () => Promise<void>;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useTokenBalanceStore = create<TokenBalanceState & TokenBalanceActions>()(
  (set, get) => ({
    balances: [],
    isLoading: false,
    error: null,
    lastFetched: null,

    fetchTokenBalances: async () => {
      // Skip if fetched within last 15 seconds
      const { lastFetched } = get();
      if (lastFetched && Date.now() - lastFetched < 15_000) return;

      set({ isLoading: true, error: null });
      try {
        const response = await apiClient.get(ENDPOINTS.USER_TOKEN_BALANCES);
        const raw = response.data;
        const balances: WalletTokenBalance[] = Array.isArray(raw) ? raw : [];
        set({ balances, isLoading: false, lastFetched: Date.now() });
      } catch (err) {
        set({
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch token balances',
        });
      }
    },

    getBalanceForSymbol: (symbol: string): number => {
      const found = get().balances.find((b) => b.symbol === symbol);
      return found?.amount ?? 0;
    },

    requestFaucet: async () => {
      try {
        await apiClient.post(ENDPOINTS.USER_FAUCET);
        // Force re-fetch after faucet
        set({ lastFetched: null });
        await get().fetchTokenBalances();
      } catch (err) {
        set({
          error: err instanceof Error ? err.message : 'Faucet request failed',
        });
      }
    },

    reset: () => set({ balances: [], isLoading: false, error: null, lastFetched: null }),
  }),
);
