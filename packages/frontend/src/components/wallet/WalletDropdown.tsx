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
import { useWalletStore } from '@/stores/useWalletStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Copy, ExternalLink, LogOut, Settings, ArrowLeftRight } from 'lucide-react';

interface WalletDropdownProps {
  className?: string;
  onSettingsClick?: () => void;
}

function WalletDropdown({ className, onSettingsClick }: WalletDropdownProps) {
  const { isConnected, walletAddress, party, creditTier, connections, disconnect } = useWalletStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (walletAddress) {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected) {
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
            <WalletAvatar address={walletAddress ?? ''} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm text-text-primary truncate">{walletAddress}</p>
              {party && <PartyIdDisplay partyId={party} className="mt-0.5" />}
            </div>
          </div>
          {creditTier && (
            <div className="mt-3">
              <CreditTierBadge tier={creditTier} size="md" />
            </div>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-2 text-text-tertiary" />
          {copied ? 'Copied!' : 'Copy Address'}
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
        <DropdownMenuItem destructive onClick={() => {
          disconnect();
          useAuthStore.getState().logout();
        }}>
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect & Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { WalletDropdown, type WalletDropdownProps };
