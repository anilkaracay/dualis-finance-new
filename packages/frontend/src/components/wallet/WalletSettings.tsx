'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { WalletAvatar } from './WalletAvatar';
import { useWallet } from '@/hooks/useWallet';
import { useWalletPreferences } from '@/hooks/useWalletPreferences';
import { walletApi } from '@/lib/api/wallet';
import { Star, Unplug, Settings } from 'lucide-react';
import type { TransactionRoutingMode } from '@dualis/shared';

interface WalletSettingsProps {
  className?: string;
}

const ROUTING_OPTIONS: { value: TransactionRoutingMode; label: string; desc: string }[] = [
  { value: 'auto', label: 'Auto', desc: 'Below threshold: proxy. Above: wallet sign.' },
  { value: 'proxy', label: 'Proxy', desc: 'Server signs all transactions.' },
  { value: 'wallet-sign', label: 'Wallet Sign', desc: 'Confirm every transaction in wallet.' },
];

function WalletSettings({ className }: WalletSettingsProps) {
  const { connections } = useWallet();
  const { preferences, isLoading, update, isUpdating } = useWalletPreferences();
  const [localThreshold, setLocalThreshold] = useState<string>('');

  const handleSetPrimary = async (connectionId: string) => {
    try {
      await walletApi.setPrimary(connectionId);
    } catch {
      // Handled silently
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      await walletApi.disconnect(connectionId);
    } catch {
      // Handled silently
    }
  };

  const handleThresholdSave = () => {
    if (localThreshold && !isNaN(parseFloat(localThreshold))) {
      update({ signingThreshold: localThreshold });
    }
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Connected Wallets */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Connected Wallets
        </h3>
        {connections.length === 0 ? (
          <p className="text-sm text-text-tertiary">No wallets connected.</p>
        ) : (
          <div className="space-y-2">
            {connections.map((conn) => (
              <div
                key={conn.connectionId}
                className="flex items-center justify-between p-3 rounded-lg border border-border-default bg-bg-secondary"
              >
                <div className="flex items-center gap-3">
                  <WalletAvatar address={conn.walletAddress} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-text-primary">
                        {conn.walletAddress.slice(0, 6)}...{conn.walletAddress.slice(-4)}
                      </span>
                      {conn.isPrimary && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent-teal/10 text-accent-teal">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-tertiary">
                      {conn.walletType} · {conn.custodyMode}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!conn.isPrimary && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetPrimary(conn.connectionId)}
                    >
                      <Star className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnect(conn.connectionId)}
                  >
                    <Unplug className="h-3.5 w-3.5 text-negative" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preferences */}
      {preferences && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">Transaction Preferences</h3>
          <div className="space-y-4">
            {/* Routing Mode */}
            <div>
              <label className="text-xs text-text-secondary mb-1.5 block">Routing Mode</label>
              <div className="flex gap-2">
                {ROUTING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => update({ routingMode: opt.value })}
                    disabled={isUpdating}
                    className={cn(
                      'flex-1 p-2.5 rounded-lg border text-left transition-colors',
                      preferences.routingMode === opt.value
                        ? 'border-accent-teal bg-accent-teal/5'
                        : 'border-border-default hover:border-border-hover',
                    )}
                  >
                    <p className="text-xs font-medium text-text-primary">{opt.label}</p>
                    <p className="text-[10px] text-text-tertiary mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Signing Threshold */}
            <div>
              <label className="text-xs text-text-secondary mb-1.5 block">
                Signing Threshold (USD)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  className="flex-1 px-3 py-2 rounded-lg border border-border-default bg-surface-input text-sm text-text-primary placeholder:text-text-disabled focus:border-border-focus focus:outline-none"
                  placeholder={preferences.signingThreshold}
                  value={localThreshold}
                  onChange={(e) => setLocalThreshold(e.target.value)}
                />
                <Button variant="secondary" size="sm" onClick={handleThresholdSave} disabled={isUpdating}>
                  Save
                </Button>
              </div>
              <p className="text-[10px] text-text-tertiary mt-1">
                Transactions above this amount require wallet signature in auto mode.
              </p>
            </div>

            {/* Transaction Confirmation Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-text-primary">Show Transaction Confirmation</p>
                <p className="text-[10px] text-text-tertiary">Show a dialog before submitting transactions</p>
              </div>
              <button
                onClick={() => update({ showTransactionConfirm: !preferences.showTransactionConfirm })}
                disabled={isUpdating}
                className={cn(
                  'relative h-5 w-9 rounded-full transition-colors',
                  preferences.showTransactionConfirm ? 'bg-accent-teal' : 'bg-bg-tertiary',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform',
                    preferences.showTransactionConfirm && 'translate-x-4',
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { WalletSettings, type WalletSettingsProps };
