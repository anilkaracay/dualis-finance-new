'use client';

import { cn } from '@/lib/utils/cn';
import { Spinner } from '@/components/ui/Spinner';
import { CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type TxStatus = 'pending' | 'success' | 'error';

interface TransactionToastProps {
  status: TxStatus;
  txHash?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

function TransactionToast({ status, txHash, message, onRetry, className }: TransactionToastProps) {
  const truncatedHash = txHash && txHash.length > 16
    ? `${txHash.slice(0, 8)}...${txHash.slice(-6)}`
    : txHash;

  return (
    <div className={cn('flex items-start gap-3', className)}>
      {status === 'pending' && <Spinner size="sm" className="text-info mt-0.5" />}
      {status === 'success' && <CheckCircle2 className="h-5 w-5 text-positive shrink-0" />}
      {status === 'error' && <XCircle className="h-5 w-5 text-negative shrink-0" />}

      <div className="flex-1">
        <p className="text-sm font-medium text-text-primary">
          {status === 'pending' && (message ?? 'Transaction submitted')}
          {status === 'success' && (message ?? 'Transaction confirmed')}
          {status === 'error' && (message ?? 'Transaction failed')}
        </p>

        {txHash && (
          <a
            href={`#tx-${txHash}`}
            className="inline-flex items-center gap-1 text-xs text-accent-teal hover:text-accent-teal-hover mt-1"
          >
            <span className="font-mono">{truncatedHash}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}

        {status === 'error' && onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry} className="mt-2">
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}

export { TransactionToast, type TransactionToastProps, type TxStatus };
