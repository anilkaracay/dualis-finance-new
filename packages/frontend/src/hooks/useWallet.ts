'use client';

import { usePartyLayer } from './usePartyLayer';
import { useWalletStore } from '@/stores/useWalletStore';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * High-level convenience hook for wallet state.
 * Composes usePartyLayer + useWalletStore + useAuthStore.
 */
export function useWallet() {
  const partyLayer = usePartyLayer();
  const walletStore = useWalletStore();
  const authStore = useAuthStore();

  return {
    // Connection state
    isConnected: walletStore.isConnected,
    isConnecting: walletStore.isConnecting,
    walletAddress: walletStore.walletAddress,
    walletType: walletStore.walletType,
    partyId: walletStore.party ?? authStore.user?.partyId ?? null,
    creditTier: walletStore.creditTier,

    // Multi-wallet
    connections: walletStore.connections,
    activeConnectionId: walletStore.activeConnectionId,

    // Actions
    connect: partyLayer.connect,
    disconnect: partyLayer.disconnect,
    refreshConnections: partyLayer.refreshConnections,
  };
}
