'use client';

import { useState, useCallback } from 'react';
import { walletApi } from '@/lib/api/wallet';
import { parseError } from '@/lib/api/client';
import type { TransactionResult, SubmitTransactionRequest } from '@dualis/shared';

type TxStatus = 'idle' | 'submitting' | 'pending-signature' | 'submitted' | 'confirmed' | 'failed';

/**
 * Hook for transaction submission with proxy/wallet-sign routing.
 */
export function useTransaction() {
  const [pendingTx, setPendingTx] = useState<TransactionResult | null>(null);
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (params: SubmitTransactionRequest): Promise<TransactionResult> => {
    setTxStatus('submitting');
    setError(null);

    try {
      const { data } = await walletApi.submitTransaction(params);
      setPendingTx(data);

      if (data.requiresWalletSign) {
        setTxStatus('pending-signature');
      } else {
        setTxStatus('submitted');
      }

      return data;
    } catch (err) {
      const msg = parseError(err);
      setError(msg);
      setTxStatus('failed');
      throw err;
    }
  }, []);

  const signAndSubmit = useCallback(async (signature: string): Promise<TransactionResult> => {
    if (!pendingTx) {
      throw new Error('No pending transaction to sign');
    }

    setTxStatus('submitting');
    setError(null);

    try {
      const { data } = await walletApi.signTransaction(pendingTx.transactionLogId, signature);
      setPendingTx(data);
      setTxStatus('submitted');
      return data;
    } catch (err) {
      const msg = parseError(err);
      setError(msg);
      setTxStatus('failed');
      throw err;
    }
  }, [pendingTx]);

  const pollStatus = useCallback(async (transactionLogId: string): Promise<void> => {
    try {
      const { data } = await walletApi.getTransactionStatus(transactionLogId);
      if (data.status === 'confirmed') {
        setTxStatus('confirmed');
      } else if (data.status === 'failed') {
        setTxStatus('failed');
        setError(data.errorMessage);
      }
    } catch {
      // Polling failure is silent
    }
  }, []);

  const reset = useCallback(() => {
    setPendingTx(null);
    setTxStatus('idle');
    setError(null);
  }, []);

  return {
    submit,
    signAndSubmit,
    pollStatus,
    pendingTx,
    txStatus,
    error,
    isWaitingForSignature: txStatus === 'pending-signature',
    signingPayload: pendingTx?.signingPayload ?? null,
    isSubmitting: txStatus === 'submitting',
    reset,
  };
}
