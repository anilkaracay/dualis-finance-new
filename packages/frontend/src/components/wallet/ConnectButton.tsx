'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { WalletAvatar } from './WalletAvatar';
import { WalletConnectModal } from './WalletConnectModal';
import { useSession } from '@partylayer/react';
import { usePartyLayer } from '@/hooks/usePartyLayer';
import { useWalletStore } from '@/stores/useWalletStore';
import { Wallet } from 'lucide-react';

interface ConnectButtonProps {
  className?: string | undefined;
  onConnectedClick?: (() => void) | undefined;
}

function truncateId(id: string): string {
  if (id.length <= 16) return id;
  return `${id.slice(0, 8)}...${id.slice(-6)}`;
}

function ConnectButton({ className, onConnectedClick }: ConnectButtonProps) {
  const session = useSession();
  const walletStore = useWalletStore();
  const { isConnecting } = usePartyLayer();
  const [showModal, setShowModal] = useState(false);

  // Use PartyLayer session if available, otherwise fall back to persisted wallet store
  const connectedPartyId = session
    ? String(session.partyId)
    : walletStore.isConnected && walletStore.party
      ? walletStore.party
      : null;

  if (isConnecting) {
    return (
      <Button variant="secondary" size="sm" disabled className={className}>
        <Spinner size="sm" />
        Connecting...
      </Button>
    );
  }

  if (connectedPartyId) {
    return (
      <button
        onClick={onConnectedClick}
        className={cn(
          'flex items-center gap-2 h-8 px-3 rounded-sm bg-bg-tertiary border border-border-default text-sm text-text-primary hover:bg-bg-hover transition-colors',
          className
        )}
      >
        <WalletAvatar address={connectedPartyId} size="sm" />
        <span className="font-mono text-xs">{truncateId(connectedPartyId)}</span>
      </button>
    );
  }

  return (
    <>
      <Button variant="primary" size="sm" icon={<Wallet className="h-4 w-4" />} onClick={() => setShowModal(true)} className={className}>
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
