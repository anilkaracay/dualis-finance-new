'use client';

import { useCallback } from 'react';
import { useSession } from '@partylayer/react';
import { consoleWallet, CoinEnum } from '@console-wallet/dapp-sdk';
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
 * Calls Console Wallet SDK's `submitCommands()` DIRECTLY — bypassing
 * PartyLayer's signTransaction wrapper which swallows errors and returns null.
 *
 * `submitCommands()` opens the Console Wallet browser extension popup,
 * user approves the token transfer, and a real Canton Splice transfer is executed.
 */
export function useWalletTransfer() {
  const session = useSession();
  const storeParty = useWalletStore((s) => s.party);

  const transfer = useCallback(async (params: WalletTransferParams): Promise<{ txHash: string }> => {
    const walletParty = (session ? String(session.partyId) : storeParty) || undefined;
    if (!walletParty) {
      throw new Error('No wallet connected. Please connect your wallet first.');
    }

    // Map string token to CoinEnum
    const tokenEnum = CoinEnum[params.token as keyof typeof CoinEnum];
    if (!tokenEnum) {
      throw new Error(`Unsupported token: ${params.token}. Only CC, CBTC, USDCx are supported.`);
    }

    const signSendRequest = {
      from: walletParty,
      to: params.to,
      token: tokenEnum,
      amount: params.amount,
      expireDate: new Date(Date.now() + 5 * 60_000).toISOString(),
      ...(params.memo ? { memo: params.memo } : {}),
      waitForFinalization: 5000,
    };

    // Call Console Wallet SDK directly — opens browser extension popup
    const result = await consoleWallet.submitCommands(signSendRequest);

    if (!result || result.status === false) {
      throw new Error('Transfer was cancelled by user');
    }

    // Use signature as txHash, or generate one from confirmation data
    const txHash = result.signature
      || (result.confirmationData ? JSON.stringify(result.confirmationData) : `tx_${Date.now()}`);

    return { txHash };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.sessionId, storeParty]);

  return { transfer };
}
