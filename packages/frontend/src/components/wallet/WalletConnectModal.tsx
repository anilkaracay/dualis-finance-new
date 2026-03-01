'use client';

import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useWallets, useConnect } from '@partylayer/react';
import type { WalletId } from '@partylayer/sdk';
import { X, Loader2, Wallet } from 'lucide-react';
import { getWalletIcon } from '@/lib/wallet-logos';

interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: (connection: { partyId: string; address: string }) => void;
}

/**
 * Custom wallet connection modal with proper wallet logos.
 * Replaces PartyLayer's WalletModal which doesn't reliably load icons.
 */
function WalletConnectModal({ open, onOpenChange, onConnected }: WalletConnectModalProps) {
  const { wallets } = useWallets();
  const { connect, isConnecting: plConnecting } = useConnect();
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connecting = plConnecting || connectingId !== null;

  const handleSelect = useCallback(async (walletId: string) => {
    setConnectingId(walletId);
    setError(null);
    try {
      const session = await connect({ walletId: walletId as WalletId });
      if (session) {
        onConnected?.({ partyId: String(session.partyId), address: String(session.partyId) });
        onOpenChange(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setConnectingId(null);
    }
  }, [connect, onConnected, onOpenChange]);

  if (!open) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => { if (!connecting) onOpenChange(false); }}
    >
      <div
        className="relative w-full max-w-sm mx-4 bg-bg-secondary border border-border-default rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="font-display text-lg text-text-primary">Connect Wallet</h2>
          <button
            onClick={() => { if (!connecting) onOpenChange(false); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-hover transition-colors text-text-tertiary hover:text-text-primary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wallet list */}
        <div className="px-6 pb-4 space-y-2">
          {wallets.length === 0 ? (
            <div className="py-8 text-center text-text-tertiary text-sm">
              <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin text-accent-teal" />
              Loading wallets...
            </div>
          ) : (
            wallets.map((w) => {
              const iconUrl = getWalletIcon(String(w.walletId), w.icons?.sm);
              return (
                <button
                  key={w.walletId}
                  onClick={() => handleSelect(String(w.walletId))}
                  disabled={connecting}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border-default/60 hover:border-accent-teal/30 bg-bg-elevated/50 hover:bg-bg-elevated transition-all duration-200 disabled:opacity-50 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-bg-tertiary border border-border-default flex items-center justify-center overflow-hidden flex-shrink-0">
                    {iconUrl ? (
                      <img src={iconUrl} alt={w.name} className="w-7 h-7 rounded object-contain" />
                    ) : (
                      <Wallet className="w-5 h-5 text-accent-teal" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-text-primary group-hover:text-accent-teal transition-colors">
                      {w.name}
                    </p>
                    <p className="text-[11px] text-text-disabled">
                      {w.category || 'Canton Wallet'}
                    </p>
                  </div>
                  {connectingId === String(w.walletId) ? (
                    <Loader2 className="w-4 h-4 text-accent-teal animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 text-text-disabled group-hover:text-accent-teal transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-6 pb-3">
            <p className="text-xs text-negative text-center">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 pb-5">
          <p className="text-[11px] text-text-disabled text-center">
            CIP-0103 compliant wallets on Canton Network
          </p>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modal, document.body);
  }
  return modal;
}

export { WalletConnectModal, type WalletConnectModalProps };
