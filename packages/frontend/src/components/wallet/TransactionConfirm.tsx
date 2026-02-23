'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { TransactionToast } from './TransactionToast';
import { ShieldCheck, FileText } from 'lucide-react';
import type { TransactionResult } from '@dualis/shared';
import { useSignTransaction } from '@partylayer/react';

interface TransactionConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionResult | null;
  onSign: (signature: string) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

function TransactionConfirm({
  open,
  onOpenChange,
  transaction,
  onSign,
  onCancel,
  isSubmitting,
}: TransactionConfirmProps) {
  const { signTransaction: plSignTx } = useSignTransaction();

  const handleSign = async () => {
    if (!transaction?.signingPayload) return;

    // Sign via PartyLayer wallet (Console, Loop, Cantor8, Nightly, Bron)
    const signed = await plSignTx({ tx: { signingPayload: transaction.signingPayload } });
    if (!signed) return;
    onSign(String(signed.transactionHash));
  };

  const truncatePayload = (payload: string | undefined) => {
    if (!payload) return '—';
    if (payload.length <= 32) return payload;
    return `${payload.slice(0, 16)}...${payload.slice(-16)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Confirm Transaction</DialogTitle>
          <DialogDescription>
            This transaction requires your wallet signature
          </DialogDescription>
        </DialogHeader>

        {transaction && (
          <div className="space-y-4 mt-2">
            <div className="p-4 rounded-lg bg-bg-tertiary border border-border-default space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-text-tertiary" />
                <span className="text-text-secondary">Transaction ID</span>
                <span className="ml-auto font-mono text-text-primary text-xs">
                  {transaction.transactionLogId}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-text-tertiary" />
                <span className="text-text-secondary">Routing</span>
                <span className="ml-auto text-text-primary">{transaction.routingMode}</span>
              </div>
              {transaction.signingPayload && (
                <div className="pt-2 border-t border-border-default">
                  <p className="text-xs text-text-tertiary mb-1">Signing Payload</p>
                  <p className="font-mono text-xs text-text-secondary break-all">
                    {truncatePayload(transaction.signingPayload)}
                  </p>
                </div>
              )}
            </div>

            {transaction.status === 'submitted' && (
              <TransactionToast
                status="success"
                {...(transaction.txHash ? { txHash: transaction.txHash } : {})}
                message="Transaction submitted successfully"
              />
            )}

            {transaction.status === 'failed' && (
              <TransactionToast
                status="error"
                message="Transaction failed"
              />
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSign}
            disabled={isSubmitting || transaction?.status !== 'pending'}
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" />
                Signing...
              </>
            ) : (
              'Confirm in Wallet'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { TransactionConfirm, type TransactionConfirmProps };
