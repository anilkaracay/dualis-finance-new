'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { WalletAvatar } from './WalletAvatar';
import { usePartyLayer } from '@/hooks/usePartyLayer';
import { Wallet, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

type ModalStep = 'select' | 'connecting' | 'success' | 'error';

const WALLET_OPTIONS = [
  { type: 'metamask', label: 'MetaMask', desc: 'Browser extension wallet' },
  { type: 'walletconnect', label: 'WalletConnect', desc: 'Mobile wallet QR' },
  { type: 'ledger', label: 'Ledger', desc: 'Hardware wallet' },
  { type: 'canton-native', label: 'Canton Native', desc: 'CIP-0103 wallet' },
] as const;

interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: (connection: { partyId: string; address: string }) => void;
}

function WalletConnectModal({ open, onOpenChange, onConnected }: WalletConnectModalProps) {
  const { connect } = usePartyLayer();
  const [step, setStep] = useState<ModalStep>('select');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (walletType: string) => {
    setSelectedType(walletType);
    setStep('connecting');
    setError(null);

    try {
      const result = await connect(walletType);
      setConnectedAddress(result.address);
      setStep('success');
      onConnected?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setStep('error');
    }
  };

  const handleClose = () => {
    setStep('select');
    setSelectedType(null);
    setConnectedAddress(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>
            {step === 'select' && 'Connect Wallet'}
            {step === 'connecting' && 'Connecting...'}
            {step === 'success' && 'Connected'}
            {step === 'error' && 'Connection Failed'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select' && 'Select a wallet to connect to Dualis Finance'}
            {step === 'connecting' && 'Please confirm in your wallet'}
            {step === 'success' && 'Your wallet has been connected successfully'}
            {step === 'error' && 'There was a problem connecting your wallet'}
          </DialogDescription>
        </DialogHeader>

        {step === 'select' && (
          <div className="flex flex-col gap-2 mt-2">
            {WALLET_OPTIONS.map((option) => (
              <button
                key={option.type}
                onClick={() => handleSelect(option.type)}
                className="flex items-center justify-between w-full p-3 rounded-lg border border-border-default hover:border-border-hover hover:bg-bg-hover transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-bg-tertiary flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{option.label}</p>
                    <p className="text-xs text-text-tertiary">{option.desc}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-text-tertiary" />
              </button>
            ))}
          </div>
        )}

        {step === 'connecting' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Spinner size="lg" />
            <p className="text-sm text-text-secondary">
              Connecting to {WALLET_OPTIONS.find((o) => o.type === selectedType)?.label ?? 'wallet'}...
            </p>
          </div>
        )}

        {step === 'success' && connectedAddress && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="h-12 w-12 rounded-full bg-positive/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-positive" />
            </div>
            <div className="flex items-center gap-2">
              <WalletAvatar address={connectedAddress} size="md" />
              <span className="font-mono text-sm text-text-primary">
                {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
              </span>
            </div>
            <Button variant="primary" size="sm" onClick={handleClose}>
              Done
            </Button>
          </div>
        )}

        {step === 'error' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="h-12 w-12 rounded-full bg-negative/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-negative" />
            </div>
            <p className="text-sm text-text-secondary text-center">{error}</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setStep('select')}>
                Try Another
              </Button>
              <Button variant="primary" size="sm" onClick={() => selectedType && handleSelect(selectedType)}>
                Retry
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { WalletConnectModal, type WalletConnectModalProps };
