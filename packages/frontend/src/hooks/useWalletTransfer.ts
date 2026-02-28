'use client';

import { useCallback } from 'react';
import { useSignTransaction, useSession } from '@partylayer/react';
import { useWalletStore } from '@/stores/useWalletStore';

export interface WalletTransferParams {
  to: string;
  token: string;
  amount: string;
  memo?: string;
}

/**
 * Hook for real CC/CBTC/USDCx transfers via Console Wallet popup.
 *
 * Uses PartyLayer's signTransaction which delegates to the wallet adapter's
 * submitCommands() — for Console Wallet this opens the extension popup and
 * executes a real Splice/Canton token transfer.
 */
export function useWalletTransfer() {
  const { signTransaction: plSignTx } = useSignTransaction();
  const session = useSession();
  const storeParty = useWalletStore((s) => s.party);

  const transfer = useCallback(async (params: WalletTransferParams): Promise<{ txHash: string }> => {
    const walletParty = (session ? String(session.partyId) : storeParty) || undefined;
    if (!walletParty) {
      throw new Error('No wallet connected. Please connect your wallet first.');
    }

    const signSendRequest = {
      from: walletParty,
      to: params.to,
      token: params.token,
      amount: params.amount,
      expireDate: new Date(Date.now() + 5 * 60_000).toISOString(),
      memo: params.memo,
      waitForFinalization: 5000,
    };

    const result = await plSignTx({ tx: signSendRequest });

    if (!result) {
      throw new Error('Transfer was cancelled by user');
    }

    return { txHash: String(result.transactionHash) };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plSignTx, session?.sessionId, storeParty]);

  return { transfer };
}
