'use client';

import { useCallback, useEffect } from 'react';
import {
  useSession,
  useConnect,
  useDisconnect,
  useSignTransaction,
  useWallets,
} from '@partylayer/react';
import type { WalletId } from '@partylayer/sdk';
import { walletApi } from '@/lib/api/wallet';
import { useWalletStore } from '@/stores/useWalletStore';
import { useAuthStore } from '@/stores/useAuthStore';
import type { WalletConnection, TransactionResult, SubmitTransactionRequest } from '@dualis/shared';

interface UsePartyLayerReturn {
  // Connection
  connect: (walletId?: string) => Promise<{ partyId: string; address: string }>;
  disconnect: () => Promise<void>;
  isConnected: boolean;
  isConnecting: boolean;
  party: string | null;
  walletAddress: string | null;

  // PartyLayer session data
  session: ReturnType<typeof useSession>;
  wallets: ReturnType<typeof useWallets>;

  // Transaction (routes through our backend)
  signTransaction: (command: string) => Promise<{ txHash: string }>;
  submitTransaction: (params: SubmitTransactionRequest) => Promise<TransactionResult>;
  signAndSubmit: (txLogId: string, signature: string) => Promise<TransactionResult>;

  // Backend wallet connections
  connections: WalletConnection[];
  refreshConnections: () => Promise<void>;
}

/**
 * PartyLayer hook — integrates @partylayer/sdk with our backend wallet API.
 *
 * Uses PartyLayer for real wallet connectivity (5 Canton wallets: Console,
 * Loop, Cantor8, Nightly, Bron) and syncs session data with our Zustand
 * store + backend wallet service.
 */
export function usePartyLayer(): UsePartyLayerReturn {
  const store = useWalletStore();
  const authStore = useAuthStore();

  // PartyLayer native hooks
  const session = useSession();
  const walletsResult = useWallets();
  const { connect: plConnect, isConnecting } = useConnect();
  const { disconnect: plDisconnect } = useDisconnect();
  const { signTransaction: plSignTx } = useSignTransaction();

  // Sync PartyLayer session → Zustand store
  // Only update store when PartyLayer session changes — do NOT clear
  // persisted wallet state just because PartyLayer hasn't restored yet.
  // The wallet store persists connection state across page navigations.
  useEffect(() => {
    if (session) {
      const partyId = String(session.partyId);
      const walletId = String(session.walletId);
      store.setConnected(partyId, walletId, walletId);
    }
    // Note: We intentionally do NOT call store.disconnect() when session is null.
    // PartyLayer session is volatile (lost on navigation), but the wallet store
    // persists state for users who authenticated via wallet.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.sessionId]);

  // Restore wallet state from auth user when authenticated via wallet
  // This covers the case where user logs in via wallet on /auth/login
  // and navigates to the dashboard — PartyLayer session is volatile but
  // the auth store persists the user's walletAddress and partyId.
  useEffect(() => {
    if (
      authStore.isAuthenticated &&
      authStore.user?.walletAddress &&
      authStore.user?.partyId &&
      authStore.user?.authProvider === 'wallet' &&
      !store.isConnected
    ) {
      store.setConnected(
        authStore.user.partyId,
        authStore.user.walletAddress,
        'canton-native',
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStore.isAuthenticated, authStore.user?.walletAddress]);

  // Sync backend wallet connections when authenticated
  const refreshConnections = useCallback(async () => {
    if (!authStore.isAuthenticated) return;
    try {
      const { data } = await walletApi.getConnections();
      store.setConnections(data);
      const primary = data.find((c) => c.isPrimary) ?? data[0] ?? null;
      if (primary) store.setActiveConnectionId(primary.connectionId);
    } catch {
      // Silently fail — user may not have wallet connections yet
    }
  }, [authStore.isAuthenticated, store]);

  useEffect(() => {
    if (authStore.isAuthenticated) {
      refreshConnections();
    }
  }, [authStore.isAuthenticated, refreshConnections]);

  /**
   * Connect a wallet using PartyLayer's native wallet selection.
   * If walletId is provided, connects directly to that wallet;
   * otherwise opens the WalletModal.
   */
  const connect = useCallback(async (walletId?: string): Promise<{ partyId: string; address: string }> => {
    store.setConnecting(true);

    try {
      // Use PartyLayer's connect — handles wallet popup, CIP-0103 handshake
      const plSession = await plConnect(walletId ? { walletId: walletId as WalletId } : undefined);

      if (!plSession) {
        throw new Error('Wallet connection was cancelled or failed');
      }

      const partyId = String(plSession.partyId);
      const address = String(plSession.walletId);

      // Sync to our backend: register the wallet connection
      if (authStore.isAuthenticated) {
        try {
          await walletApi.connect({
            walletAddress: address,
            walletType: 'canton-native',
            signature: partyId, // PartyLayer session proves identity
            nonce: String(plSession.sessionId),
          });
          await refreshConnections();
        } catch {
          // Backend sync can fail without breaking wallet connection
        }
      }

      store.setConnected(partyId, address, String(plSession.walletId));
      return { partyId, address };
    } catch (err) {
      store.setConnecting(false);
      throw err;
    }
  }, [plConnect, store, authStore.isAuthenticated, refreshConnections]);

  /**
   * Disconnect using PartyLayer's native disconnect.
   */
  const disconnect = useCallback(async () => {
    // Disconnect from PartyLayer
    await plDisconnect();

    // Notify backend
    const activeId = store.activeConnectionId;
    if (activeId) {
      try {
        await walletApi.disconnect(activeId);
      } catch {
        // Continue even if backend fails
      }
    }

    store.disconnect();
  }, [plDisconnect, store]);

  /**
   * Sign a transaction using PartyLayer's wallet signing,
   * then submit through our backend transaction router.
   */
  const signTransaction = useCallback(async (command: string): Promise<{ txHash: string }> => {
    // Build a Canton transaction object and sign via PartyLayer wallet
    const tx = {
      templateId: 'Dualis.Generic:Command',
      choiceId: 'Execute',
      argument: { command },
    };

    const signed = await plSignTx({ tx });

    if (!signed) {
      throw new Error('Transaction signing was cancelled');
    }

    return { txHash: String(signed.transactionHash) };
  }, [plSignTx]);

  /**
   * Submit a transaction through our backend routing engine.
   * For wallet-sign mode, uses PartyLayer to sign the payload.
   */
  const submitTransaction = useCallback(async (params: SubmitTransactionRequest): Promise<TransactionResult> => {
    // Inject the connected wallet's party so backend uses it as actAs in signing payloads
    const walletParty = params.walletParty || (session ? String(session.partyId) : store.party) || undefined;
    // Route through our backend first (determines proxy vs wallet-sign)
    const { data: result } = await walletApi.submitTransaction({
      ...params,
      ...(walletParty ? { walletParty } : {}),
    });

    // If backend says we need a wallet signature, use PartyLayer to sign
    if (result.requiresWalletSign && result.signingPayload) {
      const signed = await plSignTx({
        tx: {
          templateId: params.templateId,
          choiceName: params.choiceName,
          argument: params.argument,
          signingPayload: result.signingPayload,
        },
      });

      if (!signed) {
        throw new Error('Transaction signing was cancelled');
      }

      // Submit the signed payload back to our backend
      const { data: finalResult } = await walletApi.signTransaction(
        result.transactionLogId,
        String(signed.transactionHash),
      );
      return finalResult;
    }

    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plSignTx, session?.sessionId, store.party]);

  /**
   * Sign and submit a pending transaction (for wallet-sign mode).
   */
  const signAndSubmit = useCallback(async (txLogId: string, signature: string): Promise<TransactionResult> => {
    const { data } = await walletApi.signTransaction(txLogId, signature);
    return data;
  }, []);

  return {
    connect,
    disconnect,
    isConnected: session !== null || store.isConnected,
    isConnecting,
    party: session ? String(session.partyId) : store.party,
    walletAddress: session ? String(session.walletId) : store.walletAddress,
    session,
    wallets: walletsResult,
    signTransaction,
    submitTransaction,
    signAndSubmit,
    connections: store.connections,
    refreshConnections,
  };
}
