'use client';

import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserSupplyPosition {
  contractId: string;
  positionId: string;
  poolId: string;
  asset: { symbol: string; priceUSD: number };
  principal: number;
  currentBalance: number;
  interestEarned: number;
  depositTimestamp: string;
}

export interface UserBorrowPosition {
  contractId: string;
  positionId: string;
  poolId: string;
  borrowedAsset: { symbol: string; type: string; priceUSD: number };
  borrowedAmountPrincipal: number;
  currentDebt: number;
  interestAccrued: number;
  healthFactor: {
    value: number;
    collateralValueUSD: number;
    borrowValueUSD: number;
    weightedLTV: number;
  };
  creditTier: string;
  collateral: Array<{ symbol: string; amount: string; valueUSD: number }>;
  borrowTimestamp: string;
}

export interface UserBalanceSummary {
  supplyPositions: UserSupplyPosition[];
  borrowPositions: UserBorrowPosition[];
  totalSupplyUSD: number;
  totalBorrowUSD: number;
  netWorthUSD: number;
}

interface BalanceState {
  balances: UserBalanceSummary | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
}

interface BalanceActions {
  fetchBalances: () => Promise<void>;
  getSupplyPositionForPool: (poolId: string) => UserSupplyPosition | undefined;
  getBorrowPositionForPool: (poolId: string) => UserBorrowPosition | undefined;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useBalanceStore = create<BalanceState & BalanceActions>()((set, get) => ({
  balances: null,
  isLoading: false,
  error: null,
  lastFetched: null,

  fetchBalances: async () => {
    set({ isLoading: true, error: null });
    try {
      const { apiClient } = await import('@/lib/api/client');
      const response = await apiClient.get<UserBalanceSummary>('/user/balances');
      const data = response.data;

      set({
        balances: data,
        isLoading: false,
        error: null,
        lastFetched: Date.now(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch balances';
      console.warn('[BalanceStore] API failed:', msg);
      set({
        isLoading: false,
        error: msg,
      });
    }
  },

  getSupplyPositionForPool: (poolId: string) => {
    const { balances } = get();
    return balances?.supplyPositions.find(p => p.poolId === poolId);
  },

  getBorrowPositionForPool: (poolId: string) => {
    const { balances } = get();
    return balances?.borrowPositions.find(p => p.poolId === poolId);
  },

  reset: () => set({
    balances: null,
    isLoading: false,
    error: null,
    lastFetched: null,
  }),
}));
