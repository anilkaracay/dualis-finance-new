'use client';

import { cn } from '@/lib/utils/cn';
import { Shield, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';
import type { PrivacyConfig, DataScope } from '@dualis/shared';

interface PrivacyFlowDiagramProps {
  config: PrivacyConfig;
}

const SCOPE_LABELS: Record<DataScope, string> = {
  Positions: 'Positions',
  Transactions: 'Transactions',
  CreditScore: 'Credit Score',
  SecLendingDeals: 'Securities',
  All: 'All Data',
};

function PrivacyFlowDiagram({ config }: PrivacyFlowDiagramProps) {
  const activeRules = config.disclosureRules.filter((r) => r.isActive);
  const isPublic = config.privacyLevel === 'Public';
  const isMaximum = config.privacyLevel === 'Maximum';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="h-4 w-4 text-accent-teal" />
        <h4 className="text-sm font-semibold text-text-primary">Data Flow Diagram</h4>
      </div>

      {/* Main flow */}
      <div className="relative">
        {/* Source: User */}
        <div className="flex flex-col sm:flex-row items-stretch gap-4">
          {/* User Node */}
          <div className="flex-shrink-0 w-full sm:w-48">
            <div className="p-3 rounded-xl border-2 border-accent-teal/40 bg-accent-teal/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent-teal/15 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-accent-teal" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-text-primary">Your Data</div>
                  <div className="text-[10px] text-text-tertiary">Positions, transactions, score</div>
                </div>
              </div>
            </div>
          </div>

          {/* Flows */}
          <div className="flex-1 space-y-2">
            {/* Protocol flow — always active */}
            <FlowRow
              label="Dualis Protocol"
              sublabel="Transaction engine (signatory)"
              active={true}
              description="Always visible — required for transaction execution"
            />

            {/* Public flow */}
            <FlowRow
              label="Other Users"
              sublabel="Pool aggregates"
              active={isPublic}
              description={isPublic ? 'Visible in Standard mode' : 'Blocked — only aggregate data'}
            />

            {/* Disclosure rule flows */}
            {activeRules.map((rule) => (
              <FlowRow
                key={rule.id}
                label={rule.displayName}
                sublabel={rule.discloseTo}
                active={true}
                scope={SCOPE_LABELS[rule.dataScope]}
                description={`Disclosure rule: ${rule.purpose}`}
              />
            ))}

            {/* Blocked example */}
            {!isPublic && activeRules.length === 0 && (
              <FlowRow
                label="Third Parties"
                sublabel="Regulators, auditors"
                active={false}
                description={isMaximum ? 'Maximum privacy — no rules defined' : 'No disclosure rules yet'}
              />
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-text-tertiary pt-2 border-t border-border-subtle">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-positive" />
          <span>Active data flow</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-negative/50" />
          <span>Blocked flow</span>
        </div>
        <div className="flex items-center gap-1">
          <Shield className="h-3 w-3 text-accent-teal" />
          <span>Canton encryption</span>
        </div>
      </div>
    </div>
  );
}

function FlowRow({
  label,
  sublabel,
  active,
  scope,
}: {
  label: string;
  sublabel: string;
  active: boolean;
  scope?: string;
  description: string;
}) {
  return (
    <div className={cn(
      'flex items-center gap-3 p-2.5 rounded-lg border transition-colors',
      active
        ? 'border-positive/20 bg-positive/[0.03]'
        : 'border-negative/15 bg-negative/[0.02] opacity-60',
    )}>
      {/* Arrow / connection */}
      <div className="flex items-center gap-1 shrink-0">
        <div className={cn('w-8 h-px', active ? 'bg-positive/40' : 'bg-negative/20')} />
        <ArrowRight className={cn('h-3 w-3', active ? 'text-positive/60' : 'text-negative/30')} />
      </div>

      {/* Icon */}
      <div className={cn(
        'flex items-center justify-center w-7 h-7 rounded-md shrink-0',
        active ? 'bg-positive/10' : 'bg-negative/10',
      )}>
        {active ? (
          <Eye className="h-3.5 w-3.5 text-positive" />
        ) : (
          <EyeOff className="h-3.5 w-3.5 text-negative/60" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-primary truncate">{label}</span>
          {scope && (
            <span className="text-[9px] font-medium text-accent-teal bg-accent-teal/10 px-1.5 py-0.5 rounded-full shrink-0">{scope}</span>
          )}
        </div>
        <div className="text-[10px] text-text-tertiary truncate">{sublabel}</div>
      </div>

      {/* Status */}
      <div className={cn(
        'text-[10px] font-medium shrink-0 px-2 py-0.5 rounded-full',
        active ? 'text-positive bg-positive/10' : 'text-negative/60 bg-negative/10',
      )}>
        {active ? 'Active' : 'Blocked'}
      </div>
    </div>
  );
}

export { PrivacyFlowDiagram, type PrivacyFlowDiagramProps };
