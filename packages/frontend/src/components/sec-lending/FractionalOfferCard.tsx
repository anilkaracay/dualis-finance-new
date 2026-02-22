'use client';

import { cn } from '@/lib/utils/cn';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Coins, RotateCcw } from 'lucide-react';

/* ─── Types ─── */

interface FractionalOffer {
  offerId: string;
  lender: string;
  security: { symbol: string; amount: number; type: string };
  totalAmount: number;
  remainingAmount: number;
  minFillAmount: number;
  feeRate: number;
  fills: Array<{ filledBy: string; amount: number; filledAt: string }>;
  isActive: boolean;
  createdAt: string;
}

interface FractionalOfferCardProps {
  offer: FractionalOffer;
  onAccept?: (offerId: string) => void;
  className?: string;
}

/* ─── Helpers ─── */

function formatAmount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

/* ─── Component ─── */

function FractionalOfferCard({ offer, onAccept, className }: FractionalOfferCardProps) {
  const fillPercent = ((offer.totalAmount - offer.remainingAmount) / offer.totalAmount) * 100;
  const isRecallable = offer.security.type === 'recallable';

  return (
    <Card
      variant="default"
      padding="md"
      hoverable
      className={cn('flex flex-col gap-4', className)}
    >
      {/* Security Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-teal/10">
            <Coins className="h-4.5 w-4.5 text-accent-teal" />
          </div>
          <div>
            <span className="text-sm font-semibold text-text-primary">
              {offer.security.symbol}
            </span>
            <span className="ml-2 text-xs text-text-tertiary">{offer.security.type}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isRecallable && (
            <Badge variant="warning" size="sm">
              <RotateCcw className="mr-1 h-3 w-3" />
              Recallable
            </Badge>
          )}
          <Badge variant={offer.isActive ? 'success' : 'default'} size="sm">
            {offer.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      {/* Amount Progress Bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">
            Remaining: <span className="font-mono-nums text-text-primary">{formatAmount(offer.remainingAmount)}</span>
          </span>
          <span className="text-text-tertiary">
            of {formatAmount(offer.totalAmount)}
          </span>
        </div>
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-bg-hover">
          <div
            className="h-full rounded-full bg-accent-teal transition-all duration-500 ease-out"
            style={{ width: `${fillPercent}%` }}
          />
        </div>
        <span className="text-[10px] text-text-tertiary">
          {fillPercent.toFixed(1)}% filled ({offer.fills.length} fill{offer.fills.length !== 1 ? 's' : ''})
        </span>
      </div>

      {/* Fee & Min Amount */}
      <div className="flex items-center justify-between rounded-md bg-bg-primary px-3 py-2">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-text-tertiary">Fee Rate</span>
          <span className="text-sm font-semibold font-mono-nums text-accent-gold">
            {offer.feeRate} bps
          </span>
        </div>
        <div className="h-6 w-px bg-border-default" />
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-wider text-text-tertiary">Min Accept</span>
          <span className="text-sm font-medium font-mono-nums text-text-primary">
            {formatAmount(offer.minFillAmount)}
          </span>
        </div>
      </div>

      {/* Lender */}
      <div className="flex items-center justify-between text-xs text-text-tertiary">
        <span>
          Lender: <span className="font-mono text-text-secondary">{offer.lender.slice(0, 8)}...{offer.lender.slice(-4)}</span>
        </span>
        <span>{new Date(offer.createdAt).toLocaleDateString()}</span>
      </div>

      {/* Accept Button */}
      <Button
        variant="primary"
        size="md"
        className="w-full"
        disabled={!offer.isActive || offer.remainingAmount <= 0}
        onClick={() => onAccept?.(offer.offerId)}
      >
        Accept Offer
      </Button>
    </Card>
  );
}

export { FractionalOfferCard, type FractionalOfferCardProps, type FractionalOffer };
