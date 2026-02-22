'use client';

import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AlertTriangle, CheckCircle2, Calendar, DollarSign, FileText } from 'lucide-react';

/* ─── Types ─── */

interface CorporateAction {
  actionId: string;
  dealId: string;
  actionType: string;
  security: string;
  recordDate: string;
  paymentDate: string;
  amount: number;
  status: string;
}

interface CorporateActionAlertProps {
  action: CorporateAction;
  onProcess?: (actionId: string) => void;
  className?: string;
}

/* ─── Helpers ─── */

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getActionTypeLabel(actionType: string): string {
  switch (actionType) {
    case 'Dividend':
      return 'Dividend';
    case 'CouponPayment':
      return 'Coupon Payment';
    default:
      return actionType;
  }
}

/* ─── Component ─── */

function CorporateActionAlert({ action, onProcess, className }: CorporateActionAlertProps) {
  const isPending = action.status === 'pending';
  const isProcessed = action.status === 'processed';

  const borderColor = isPending
    ? 'border-warning/40'
    : isProcessed
      ? 'border-positive/40'
      : 'border-border-default';

  const bgColor = isPending
    ? 'bg-warning/5'
    : isProcessed
      ? 'bg-positive/5'
      : 'bg-surface-card';

  const StatusIcon = isPending ? AlertTriangle : CheckCircle2;
  const statusIconColor = isPending ? 'text-warning' : 'text-positive';

  return (
    <div
      className={cn(
        'rounded-lg border-l-4 border px-5 py-4 transition-all duration-200',
        borderColor,
        bgColor,
        'border-t border-r border-b border-t-border-default border-r-border-default border-b-border-default',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Icon + Info */}
        <div className="flex items-start gap-3">
          <div className={cn(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            isPending ? 'bg-warning/10' : 'bg-positive/10'
          )}>
            <StatusIcon className={cn('h-4 w-4', statusIconColor)} />
          </div>

          <div className="flex flex-col gap-2">
            {/* Header row */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text-primary">
                {getActionTypeLabel(action.actionType)}
              </span>
              <Badge
                variant={isPending ? 'warning' : isProcessed ? 'success' : 'default'}
                size="sm"
              >
                {isPending ? 'Pending' : isProcessed ? 'Processed' : action.status}
              </Badge>
            </div>

            {/* Security & Deal */}
            <div className="flex items-center gap-3 text-xs text-text-tertiary">
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span className="font-medium text-text-secondary">{action.security}</span>
              </span>
              <span className="text-text-tertiary">|</span>
              <span>Deal: <span className="font-mono text-text-secondary">{action.dealId}</span></span>
            </div>

            {/* Dates & Amount */}
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="flex items-center gap-1 text-text-tertiary">
                <Calendar className="h-3 w-3" />
                Record: <span className="text-text-secondary">{formatDate(action.recordDate)}</span>
              </span>
              <span className="flex items-center gap-1 text-text-tertiary">
                <Calendar className="h-3 w-3" />
                Payment: <span className="text-text-secondary">{formatDate(action.paymentDate)}</span>
              </span>
              <span className="flex items-center gap-1 text-text-tertiary">
                <DollarSign className="h-3 w-3" />
                Amount: <span className="font-semibold font-mono-nums text-text-primary">{formatAmount(action.amount)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Process Button */}
        {isPending && (
          <Button
            variant="primary"
            size="sm"
            className="shrink-0"
            onClick={() => onProcess?.(action.actionId)}
          >
            Process
          </Button>
        )}
      </div>
    </div>
  );
}

export { CorporateActionAlert, type CorporateActionAlertProps, type CorporateAction };
