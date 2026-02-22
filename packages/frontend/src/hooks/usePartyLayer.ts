'use client';

import { useState, useCallback, useEffect } from 'react';
import { authApi } from '@/lib/api/auth';
import { walletApi } from '@/lib/api/wallet';
import { useWalletStore } from '@/stores/useWalletStore';
import { useAuthStore } from '@/stores/useAuthStore';
import type { WalletConnection, TransactionResult, SubmitTransactionRequest } from '@dualis/shared';

interface UsePartyLayerReturn {
  // Backward-compatible interface
  connect: (walletType: string) => Promise<{ partyId: string; address: string }>;
  disconnect: () => void;
  signTransaction: (command: string) => Promise<{ txHash: string }>;
  isConnected: boolean;
  isConnecting: boolean;
  party: string | null;
  walletAddress: string | null;

  // Extended interface
  connections: WalletConnection[];
  activeConnection: WalletConnection | null;
  submitTransaction: (params: SubmitTransactionRequest) => Promise<TransactionResult>;
  signAndSubmit: (txLogId: string, signature: string) => Promise<TransactionResult>;
  refreshConnections: () => Promise<void>;
}

/**
 * PartyLayer hook — real implementation calling wallet API.
 * Backward compatible with the old mock interface.
 */
export function usePartyLayer(): UsePartyLayerReturn {
  const store = useWalletStore();
  const authStore = useAuthStore();
  const [connections, setConnections] = useState<WalletConnection[]>([]);
  const [activeConnection, setActiveConnection] = useState<WalletConnection | null>(null);

  const refreshConnections = useCallback(async () => {
    if (!authStore.isAuthenticated) return;
    try {
      const { data } = await walletApi.getConnections();
      setConnections(data);
      store.setConnections(data);

      const primary = data.find((c) => c.isPrimary) ?? data[0] ?? null;
      setActiveConnection(primary);
      if (primary) {
        store.setActiveConnectionId(primary.connectionId);
      }
    } catch {
      // Silently fail — user may not have wallet connections yet
    }
  }, [authStore.isAuthenticated, store]);

  // Load connections on mount when authenticated
  useEffect(() => {
    if (authStore.isAuthenticated) {
      refreshConnections();
    }
  }, [authStore.isAuthenticated, refreshConnections]);

  const connect = useCallback(async (walletType: string): Promise<{ partyId: string; address: string }> => {
    store.setConnecting(true);

    try {
      // Step 1: Generate a mock address for the connection flow
      // In production, this would come from the browser wallet (MetaMask, etc.)
      const mockAddress = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

      // Step 2: Get a nonce from the auth API
      const { data: nonceData } = await authApi.getWalletNonce(mockAddress);

      // Step 3: Create a mock signature (in production, wallet would sign)
      const mockSignature = `0x${Array.from({ length: 130 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

      // Step 4: Connect wallet via API
      const { data: connection } = await walletApi.connect({
        walletAddress: mockAddress,
        walletType: walletType as 'metamask' | 'walletconnect' | 'ledger' | 'custodial' | 'canton-native',
        signature: mockSignature,
        nonce: nonceData.nonce,
      });

      // Step 5: Update stores
      const partyId = authStore.user?.partyId ?? `party::${mockAddress.slice(0, 12)}`;
      store.setConnected(partyId, connection.walletAddress, walletType);
      store.addConnection(connection);
      store.setActiveConnectionId(connection.connectionId);

      setConnections((prev) => [...prev, connection]);
      setActiveConnection(connection);

      return { partyId, address: connection.walletAddress };
    } catch (err) {
      store.setConnecting(false);
      throw err;
    }
  }, [store, authStore.user]);

  const disconnect = useCallback(async () => {
    if (activeConnection) {
      try {
        await walletApi.disconnect(activeConnection.connectionId);
        store.removeConnection(activeConnection.connectionId);
        setConnections((prev) => prev.filter((c) => c.connectionId !== activeConnection.connectionId));
      } catch {
        // Continue with local disconnect even if API fails
      }
    }

    store.disconnect();
    setActiveConnection(null);
  }, [activeConnection, store]);

  const signTransaction = useCallback(async (command: string): Promise<{ txHash: string }> => {
    const result = await walletApi.submitTransaction({
      templateId: 'Dualis.Generic:Command',
      choiceName: 'Execute',
      argument: { command },
    });
    return { txHash: result.data.txHash ?? result.data.transactionLogId };
  }, []);

  const submitTransaction = useCallback(async (params: SubmitTransactionRequest): Promise<TransactionResult> => {
    const { data } = await walletApi.submitTransaction(params);
    return data;
  }, []);

  const signAndSubmit = useCallback(async (txLogId: string, signature: string): Promise<TransactionResult> => {
    const { data } = await walletApi.signTransaction(txLogId, signature);
    return data;
  }, []);

  return {
    connect,
    disconnect,
    signTransaction,
    isConnected: store.isConnected,
    isConnecting: store.isConnecting,
    party: store.party,
    walletAddress: store.walletAddress,
    connections,
    activeConnection,
    submitTransaction,
    signAndSubmit,
    refreshConnections,
  };
}
