'use client';

import { useCallback, useState } from 'react';
import { useSignTransaction, useSession } from '@partylayer/react';
import { walletApi } from '@/lib/api/wallet';
import { apiClient, parseError } from '@/lib/api/client';
import { useWalletStore } from '@/stores/useWalletStore';
import { useWalletTransfer, type WalletTransferParams } from '@/hooks/useWalletTransfer';
import type { TransactionResult } from '@dualis/shared';

export type WalletOpStatus = 'idle' | 'preparing' | 'signing' | 'submitting' | 'success' | 'failed';

/**
 * Reusable hook for compound DeFi operations (Borrow, Repay, Add Collateral).
 *
 * Submits to backend API which routes the transaction via proxy mode
 * (backend operator executes DAML choice on Canton). Wallet-sign fallback
 * is retained for future CIP-0103 prepareExecute support.
 *
 * Works with ANY wallet connected via PartyLayer (wallet-agnostic).
 */
export function useWalletOperation<TResponse = unknown>() {
  const { signTransaction: plSignTx } = useSignTransaction();
  const session = useSession();
  const storeParty = useWalletStore((s) => s.party);
  const { transfer: walletTransfer } = useWalletTransfer();
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
      // Inject the connected wallet's party so backend uses it as actAs
      const walletParty = (session ? String(session.partyId) : storeParty) || undefined;
      // Step 1: POST to existing endpoint — let backend auto-route (proxy for DAML ops)
      // Note: apiClient response interceptor already unwraps { data: T } envelope,
      // so response.data is the actual payload (DepositResponse, TransactionResult, etc.)
      const { data: responseData } = await apiClient.post<TResponse | TransactionResult>(
        apiUrl,
        { ...body, walletParty },
      );

      // Step 2: Check if wallet signing is needed (proxy mode skips this)
      if (
        responseData &&
        typeof responseData === 'object' &&
        'requiresWalletSign' in responseData &&
        (responseData as TransactionResult).requiresWalletSign &&
        (responseData as TransactionResult).signingPayload
      ) {
        const txResult = responseData as TransactionResult;
        setStatus('signing');

        // Open wallet popup via PartyLayer — works with any connected wallet
        const signed = await plSignTx({
          tx: {
            templateId: txResult.transactionLogId,
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
      return responseData as TResponse;
    } catch (err) {
      const msg = parseError(err);
      setError(msg);
      setStatus('failed');
      throw err;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plSignTx, session?.sessionId, storeParty]);

  /**
   * Two-phase wallet transfer flow:
   * 1. Opens Console Wallet popup for real CC/CBTC/USDCx transfer (user → operator)
   * 2. After wallet approval, calls backend API with walletTransferConfirmed=true
   *    so backend updates DAML state without re-transferring tokens.
   *
   * Use for ALL DeFi operations:
   * - Deposit, Repay, Add Collateral: user sends full amount to operator
   * - Withdraw: user sends withdraw amount to operator, backend processes withdrawal
   * - Borrow: user sends collateral amount to operator, backend processes borrow
   */
  const executeWithWalletTransfer = useCallback(async (
    apiUrl: string,
    body: Record<string, unknown>,
    transferParams: WalletTransferParams,
  ): Promise<TResponse | TransactionResult> => {
    setStatus('signing');
    setError(null);

    try {
      // Phase 1: Real CC transfer via Console Wallet popup
      const { txHash } = await walletTransfer(transferParams);

      // Phase 2: Backend DAML state update (skip token bridge since wallet already transferred)
      setStatus('submitting');
      const walletParty = (session ? String(session.partyId) : storeParty) || undefined;
      const { data: responseData } = await apiClient.post<TResponse | TransactionResult>(
        apiUrl,
        {
          ...body,
          walletParty,
          walletTransferConfirmed: true,
          walletTxHash: txHash,
        },
      );

      setData(responseData as TResponse);
      setStatus('success');
      return responseData as TResponse;
    } catch (err) {
      const msg = parseError(err);
      setError(msg);
      setStatus('failed');
      throw err;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletTransfer, session?.sessionId, storeParty]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setData(null);
  }, []);

  return {
    execute,
    executeWithWalletTransfer,
    status,
    error,
    data,
    reset,
    isLoading: status !== 'idle' && status !== 'success' && status !== 'failed',
  };
}
