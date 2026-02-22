'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CreditTier } from '@dualis/shared';

interface WalletState {
  party: string | null;
  walletAddress: string | null;
  walletType: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  creditTier: CreditTier | null;
}

interface WalletActions {
  setConnecting: (connecting: boolean) => void;
  setConnected: (party: string, address: string, walletType: string) => void;
  disconnect: () => void;
  setCreditTier: (tier: CreditTier) => void;
}

export const useWalletStore = create<WalletState & WalletActions>()(
  persist(
    (set) => ({
      party: null,
      walletAddress: null,
      walletType: null,
      isConnected: false,
      isConnecting: false,
      creditTier: null,

      setConnecting: (connecting) => set({ isConnecting: connecting }),

      setConnected: (party, address, walletType) =>
        set({
          party,
          walletAddress: address,
          walletType,
          isConnected: true,
          isConnecting: false,
        }),

      disconnect: () =>
        set({
          party: null,
          walletAddress: null,
          walletType: null,
          isConnected: false,
          isConnecting: false,
          creditTier: null,
        }),

      setCreditTier: (tier) => set({ creditTier: tier }),
    }),
    {
      name: 'dualis-wallet',
      partialize: (state) => ({ walletType: state.walletType }),
    }
  )
);
