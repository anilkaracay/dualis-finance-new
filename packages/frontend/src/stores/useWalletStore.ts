'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CreditTier, WalletConnection } from '@dualis/shared';

interface WalletState {
  party: string | null;
  walletAddress: string | null;
  walletType: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  creditTier: CreditTier | null;
  // Multi-wallet support
  connections: WalletConnection[];
  activeConnectionId: string | null;
}

interface WalletActions {
  setConnecting: (connecting: boolean) => void;
  setConnected: (party: string, address: string, walletType: string) => void;
  disconnect: () => void;
  setCreditTier: (tier: CreditTier) => void;
  // Multi-wallet support
  setConnections: (connections: WalletConnection[]) => void;
  setActiveConnectionId: (id: string | null) => void;
  addConnection: (connection: WalletConnection) => void;
  removeConnection: (connectionId: string) => void;
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
      connections: [],
      activeConnectionId: null,

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
          activeConnectionId: null,
        }),

      setCreditTier: (tier) => set({ creditTier: tier }),

      setConnections: (connections) => set({ connections }),

      setActiveConnectionId: (id) => set({ activeConnectionId: id }),

      addConnection: (connection) =>
        set((state) => ({
          connections: [...state.connections, connection],
        })),

      removeConnection: (connectionId) =>
        set((state) => ({
          connections: state.connections.filter((c) => c.connectionId !== connectionId),
        })),
    }),
    {
      name: 'dualis-wallet',
      partialize: (state) => ({ walletType: state.walletType }),
    }
  )
);
