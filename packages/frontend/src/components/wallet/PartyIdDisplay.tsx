'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Copy, Check } from 'lucide-react';

interface PartyIdDisplayProps {
  partyId: string;
  className?: string;
}

function PartyIdDisplay({ partyId, className }: PartyIdDisplayProps) {
  const [copied, setCopied] = useState(false);

  const truncated = partyId.length > 20
    ? `${partyId.slice(0, 12)}...${partyId.slice(-6)}`
    : partyId;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(partyId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5 font-mono text-xs text-text-tertiary', className)}>
      <span>{truncated}</span>
      <button
        onClick={handleCopy}
        className="text-text-disabled hover:text-text-secondary transition-colors"
        aria-label="Copy party ID"
      >
        {copied ? <Check className="h-3 w-3 text-positive" /> : <Copy className="h-3 w-3" />}
      </button>
    </span>
  );
}

export { PartyIdDisplay, type PartyIdDisplayProps };
