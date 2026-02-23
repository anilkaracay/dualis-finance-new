'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/Dropdown';
import { WalletAvatar } from './WalletAvatar';
import { PartyIdDisplay } from './PartyIdDisplay';
import { CreditTierBadge } from '@/components/data-display/CreditTierBadge';
import { ConnectButton } from './ConnectButton';
import { useSession, useDisconnect } from '@partylayer/react';
import { useWalletStore } from '@/stores/useWalletStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Copy, ExternalLink, LogOut, Settings, ArrowLeftRight } from 'lucide-react';

interface WalletDropdownProps {
  className?: string;
  onSettingsClick?: () => void;
}

function WalletDropdown({ className, onSettingsClick }: WalletDropdownProps) {
  const session = useSession();
  const { disconnect: plDisconnect } = useDisconnect();
  const { creditTier, connections } = useWalletStore();
  const [copied, setCopied] = useState(false);

  const partyId = session ? String(session.partyId) : null;
  const walletId = session ? String(session.walletId) : null;

  const handleCopy = async () => {
    if (partyId) {
      await navigator.clipboard.writeText(partyId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = async () => {
    await plDisconnect();
    useWalletStore.getState().disconnect();
    useAuthStore.getState().logout();
  };

  if (!session) {
    return <ConnectButton className={className} />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div>
          <ConnectButton className={className} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px]">
        <div className="px-3 py-3">
          <div className="flex items-center gap-3">
            <WalletAvatar address={partyId ?? ''} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm text-text-primary truncate">{walletId}</p>
              {partyId && <PartyIdDisplay partyId={partyId} className="mt-0.5" />}
            </div>
          </div>
          {session.network && (
            <p className="mt-1 text-[10px] text-text-tertiary uppercase tracking-wide">{String(session.network)}</p>
          )}
          {creditTier && (
            <div className="mt-3">
              <CreditTierBadge tier={creditTier} size="md" />
            </div>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-2 text-text-tertiary" />
          {copied ? 'Copied!' : 'Copy Party ID'}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <ExternalLink className="h-4 w-4 mr-2 text-text-tertiary" />
          View on Explorer
        </DropdownMenuItem>
        {connections.length > 1 && (
          <DropdownMenuItem>
            <ArrowLeftRight className="h-4 w-4 mr-2 text-text-tertiary" />
            Switch Wallet
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onSettingsClick}>
          <Settings className="h-4 w-4 mr-2 text-text-tertiary" />
          Wallet Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onClick={handleDisconnect}>
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect & Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { WalletDropdown, type WalletDropdownProps };
