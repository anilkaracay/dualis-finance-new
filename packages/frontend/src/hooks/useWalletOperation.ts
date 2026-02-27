'use client';

import { useCallback, useState } from 'react';
import { useSignTransaction, useSession } from '@partylayer/react';
import { walletApi } from '@/lib/api/wallet';
import { apiClient, parseError } from '@/lib/api/client';
import { useWalletStore } from '@/stores/useWalletStore';
import type { TransactionResult } from '@dualis/shared';

export type WalletOpStatus = 'idle' | 'preparing' | 'signing' | 'submitting' | 'success' | 'failed';

/**
 * Reusable two-phase wallet-sign hook for compound DeFi operations
 * (Borrow, Repay, Add Collateral).
 *
 * Phase 1: POST to existing API endpoint with routingMode: 'wallet-sign'
 *          → Backend validates, prepares signing payload
 * Phase 2: Frontend opens wallet popup → user signs → signature submitted back
 *
 * Works with ANY wallet connected via PartyLayer (wallet-agnostic).
 */
export function useWalletOperation<TResponse = unknown>() {
  const { signTransaction: plSignTx } = useSignTransaction();
  const session = useSession();
  const storeParty = useWalletStore((s) => s.party);
  const [status, setStatus] = useState<WalletOpStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TResponse | null>(null);

  const execute = useCallback(async (
    apiUrl: string,
    body: Record<string, unknown>,
  ): Promise<TResponse | TransactionResult> => {
    setStatus('preparing');
    setError(null);

    try {
      // Inject the connected wallet's party so backend uses it as actAs in signing payloads
      const walletParty = (session ? String(session.partyId) : storeParty) || undefined;
      // Step 1: POST to existing endpoint with wallet-sign routing
      const { data: result } = await apiClient.post<{ data: TResponse | TransactionResult }>(
        apiUrl,
        { ...body, routingMode: 'wallet-sign', walletParty },
      );

      const responseData = result.data;

      // Step 2: Check if wallet signing is needed
      const txResult = responseData as TransactionResult;
      if (txResult.requiresWalletSign && txResult.signingPayload) {
        setStatus('signing');

        // Open wallet popup via PartyLayer — works with any connected wallet
        const signed = await plSignTx({
          tx: {
            templateId: txResult.transactionLogId, // PartyLayer needs some identifier
            choiceName: 'WalletSign',
            signingPayload: txResult.signingPayload,
          },
        });

        if (!signed) {
          throw new Error('Transaction signing was cancelled');
        }

        // Step 3: Submit the wallet signature back to the backend
        setStatus('submitting');
        const { data: finalResult } = await walletApi.signTransaction(
          txResult.transactionLogId,
          String(signed.transactionHash),
        );
        setData(finalResult as unknown as TResponse);
        setStatus('success');
        return finalResult;
      }

      // Direct result (proxy mode or mock mode — no wallet sign needed)
      setData(responseData as TResponse);
      setStatus('success');
      return responseData;
    } catch (err) {
      const msg = parseError(err);
      setError(msg);
      setStatus('failed');
      throw err;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plSignTx, session?.sessionId, storeParty]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setData(null);
  }, []);

  return {
    execute,
    status,
    error,
    data,
    reset,
    isLoading: status !== 'idle' && status !== 'success' && status !== 'failed',
  };
}
