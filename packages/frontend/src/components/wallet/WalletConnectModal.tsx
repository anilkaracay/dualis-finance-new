'use client';

import { createPortal } from 'react-dom';
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
 *
 * Uses React Portal to render at document.body — prevents backdrop-filter
 * on ancestor elements (e.g. Topbar) from breaking position:fixed centering.
 */
function WalletConnectModal({ open, onOpenChange, onConnected }: WalletConnectModalProps) {
  const modal = (
    <WalletModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      onConnect={(sessionId) => {
        onConnected?.({ partyId: String(sessionId), address: String(sessionId) });
        onOpenChange(false);
      }}
    />
  );

  // Portal to document.body to escape ancestor stacking contexts
  if (typeof document !== 'undefined') {
    return createPortal(modal, document.body);
  }

  return modal;
}

export { WalletConnectModal, type WalletConnectModalProps };
