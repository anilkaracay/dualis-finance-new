'use client';

import { useState, useCallback } from 'react';

function generateMockPartyId(): string {
  const chars = 'abcdef0123456789';
  let id = 'party::';
  for (let i = 0; i < 16; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function generateMockAddress(): string {
  const chars = '0123456789abcdef';
  let addr = '0x';
  for (let i = 0; i < 40; i++) {
    addr += chars[Math.floor(Math.random() * chars.length)];
  }
  return addr;
}

interface UsePartyLayerReturn {
  connect: (walletType: string) => Promise<{ partyId: string; address: string }>;
  disconnect: () => void;
  signTransaction: (command: string) => Promise<{ txHash: string }>;
  isConnected: boolean;
  isConnecting: boolean;
  party: string | null;
  walletAddress: string | null;
}

/** Mock PartyLayer hook — will be replaced with real PartyLayer SDK */
export function usePartyLayer(): UsePartyLayerReturn {
  const [party, setParty] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async (_walletType: string): Promise<{ partyId: string; address: string }> => {
    setIsConnecting(true);
    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const partyId = generateMockPartyId();
    const address = generateMockAddress();
    setParty(partyId);
    setWalletAddress(address);
    setIsConnecting(false);
    return { partyId, address };
  }, []);

  const disconnect = useCallback(() => {
    setParty(null);
    setWalletAddress(null);
  }, []);

  const signTransaction = useCallback(async (_command: string): Promise<{ txHash: string }> => {
    // Simulate transaction signing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const txHash = `tx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    return { txHash };
  }, []);

  return {
    connect,
    disconnect,
    signTransaction,
    isConnected: party !== null,
    isConnecting,
    party,
    walletAddress,
  };
}
