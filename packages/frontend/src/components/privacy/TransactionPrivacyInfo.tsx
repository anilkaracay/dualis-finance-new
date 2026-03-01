'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Shield, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { PrivacyLevel, DisclosureRule } from '@dualis/shared';

interface TransactionPrivacyInfoProps {
  transactionType: 'deposit' | 'withdraw' | 'borrow' | 'repay';
  privacyLevel: PrivacyLevel;
  disclosureRules: DisclosureRule[];
}

const TX_PRIVACY_INFO: Record<string, {
  contract: string;
  signatories: string[];
  description: string;
  relatedScopes: string[];
}> = {
  deposit: {
    contract: 'SupplyPosition',
    signatories: ['You (depositor)', 'Dualis Protocol (operator)'],
    description: 'A deposit creates a SupplyPosition contract.',
    relatedScopes: ['Positions', 'Transactions'],
  },
  withdraw: {
    contract: 'SupplyPosition',
    signatories: ['You (depositor)', 'Dualis Protocol (operator)'],
    description: 'A withdrawal updates the existing SupplyPosition contract.',
    relatedScopes: ['Positions', 'Transactions'],
  },
  borrow: {
    contract: 'BorrowPosition + CollateralVault',
    signatories: ['You (borrower)', 'Dualis Protocol (operator)'],
    description: 'A borrow creates a BorrowPosition and CollateralVault contract.',
    relatedScopes: ['Positions', 'Transactions', 'CreditScore'],
  },
  repay: {
    contract: 'BorrowPosition',
    signatories: ['You (borrower)', 'Dualis Protocol (operator)'],
    description: 'A repayment updates the existing BorrowPosition contract.',
    relatedScopes: ['Positions', 'Transactions'],
  },
};

function TransactionPrivacyInfo({ transactionType, privacyLevel, disclosureRules }: TransactionPrivacyInfoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const info = TX_PRIVACY_INFO[transactionType];
  if (!info) return null;

  // Find disclosure rules that apply to this transaction's scopes
  const now = new Date();
  const applicableRules = disclosureRules.filter(
    (r) =>
      r.isActive &&
      (r.expiresAt === null || new Date(r.expiresAt) > now) &&
      (r.dataScope === 'All' || info.relatedScopes.includes(r.dataScope)),
  );

  return (
    <div className="border border-border-subtle rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-text-secondary hover:bg-bg-hover/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-accent-teal" />
          <span>Privacy Info</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-3.5 w-3.5 text-text-tertiary" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-text-tertiary" />
        )}
      </button>

      {isOpen && (
        <div className="px-3 pb-3 space-y-3 border-t border-border-subtle">
          {/* Description */}
          <p className="text-[11px] text-text-tertiary pt-2">{info.description}</p>

          {/* Who can see */}
          <div>
            <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Parties Who Can See This Transaction
            </div>
            <div className="space-y-1">
              {info.signatories.map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <Eye className="h-3 w-3 text-positive" />
                  <span className="text-[11px] text-text-primary">{s}</span>
                  <span className="text-[9px] text-text-tertiary">(signatory)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Disclosure rules that apply */}
          {applicableRules.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Additional Sharing via Disclosure Rules
              </div>
              <div className="space-y-1">
                {applicableRules.map((r) => (
                  <div key={r.id} className="flex items-center gap-2">
                    <EyeOff className="h-3 w-3 text-warning" />
                    <span className="text-[11px] text-text-primary">{r.displayName}</span>
                    <span className="text-[9px] text-accent-teal bg-accent-teal/10 px-1 rounded">{r.dataScope}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Privacy level indicator */}
          <div className={cn(
            'flex items-center gap-2 p-2 rounded-md text-[10px]',
            privacyLevel === 'Public' ? 'bg-positive/5 text-positive' :
            privacyLevel === 'Selective' ? 'bg-warning/5 text-warning' :
            'bg-negative/5 text-negative',
          )}>
            <Shield className="h-3 w-3" />
            <span>
              Privacy Level: <strong>{
                privacyLevel === 'Public' ? 'Standard' :
                privacyLevel === 'Selective' ? 'Enhanced' : 'Maximum'
              }</strong>
              {privacyLevel !== 'Public' && ' — Canton sub-transaction privacy active'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export { TransactionPrivacyInfo, type TransactionPrivacyInfoProps };
