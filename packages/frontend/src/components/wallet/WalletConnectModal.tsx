'use client';

import { WalletModal } from '@partylayer/react';

interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: (connection: { partyId: string; address: string }) => void;
}

/**
 * Wallet connection modal powered by PartyLayer.
 * Displays all 5 supported Canton wallets (Console, Loop, Cantor8, Nightly, Bron)
 * with CIP-0103 native support and registry verification.
 */
function WalletConnectModal({ open, onOpenChange, onConnected }: WalletConnectModalProps) {
  return (
    <WalletModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      onConnect={(sessionId) => {
        onConnected?.({ partyId: String(sessionId), address: String(sessionId) });
        onOpenChange(false);
      }}
    />
  );
}

export { WalletConnectModal, type WalletConnectModalProps };
