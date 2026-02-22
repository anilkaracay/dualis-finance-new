'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { WalletAvatar } from './WalletAvatar';
import { WalletConnectModal } from './WalletConnectModal';
import { useWalletStore } from '@/stores/useWalletStore';
import { Wallet } from 'lucide-react';

interface ConnectButtonProps {
  className?: string | undefined;
  onConnectedClick?: (() => void) | undefined;
}

function formatAddr(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function ConnectButton({ className, onConnectedClick }: ConnectButtonProps) {
  const { isConnected, isConnecting, walletAddress } = useWalletStore();
  const [showModal, setShowModal] = useState(false);

  const handleConnect = () => {
    setShowModal(true);
  };

  if (isConnecting) {
    return (
      <Button variant="secondary" size="sm" disabled className={className}>
        <Spinner size="sm" />
        Connecting...
      </Button>
    );
  }

  if (isConnected && walletAddress) {
    return (
      <button
        onClick={onConnectedClick}
        className={cn(
          'flex items-center gap-2 h-8 px-3 rounded-sm bg-bg-tertiary border border-border-default text-sm text-text-primary hover:bg-bg-hover transition-colors',
          className
        )}
      >
        <WalletAvatar address={walletAddress} size="sm" />
        <span className="font-mono text-xs">{formatAddr(walletAddress)}</span>
      </button>
    );
  }

  return (
    <>
      <Button variant="primary" size="sm" icon={<Wallet className="h-4 w-4" />} onClick={handleConnect} className={className}>
        Connect Wallet
      </Button>
      <WalletConnectModal
        open={showModal}
        onOpenChange={setShowModal}
        onConnected={() => setShowModal(false)}
      />
    </>
  );
}

export { ConnectButton, type ConnectButtonProps };
