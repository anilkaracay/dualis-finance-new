'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Shield, ShieldCheck, ShieldAlert, Clock, Users, FileCheck } from 'lucide-react';
import type { PrivacyConfig, PrivacyAuditEntry, DataScope } from '@dualis/shared';

interface PrivacyDashboardProps {
  config: PrivacyConfig;
  auditLog: PrivacyAuditEntry[];
}

const LEVEL_META: Record<string, { icon: React.ElementType; label: string; color: string; description: string }> = {
  Public: {
    icon: Shield,
    label: 'Standard Privacy',
    color: 'text-positive',
    description: 'All data visible to counterparties and the protocol. Anonymous identity is used.',
  },
  Selective: {
    icon: ShieldCheck,
    label: 'Enhanced Privacy',
    color: 'text-warning',
    description: 'Data visible only to direct counterparties. Selective sharing via disclosure rules.',
  },
  Maximum: {
    icon: ShieldAlert,
    label: 'Maximum Privacy',
    color: 'text-negative',
    description: 'Minimum data exposure. Sharing only through explicit disclosure rules.',
  },
};

const SCOPE_LABELS: Record<DataScope, string> = {
  Positions: 'Positions',
  Transactions: 'Transactions',
  CreditScore: 'Credit Score',
  SecLendingDeals: 'Securities',
  All: 'All Data',
};

function PrivacyDashboard({ config, auditLog }: PrivacyDashboardProps) {
  const meta = (LEVEL_META[config.privacyLevel] ?? LEVEL_META.Public)!;
  const Icon = meta.icon;

  const activeRules = config.disclosureRules.filter((r) => r.isActive);
  const nextExpiry = activeRules
    .filter((r) => r.expiresAt)
    .sort((a, b) => new Date(a.expiresAt!).getTime() - new Date(b.expiresAt!).getTime())[0];

  const grantedCount = auditLog.filter((e) => e.granted).length;
  const deniedCount = auditLog.filter((e) => !e.granted).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Active Level */}
      <Card variant="default" padding="md" className="col-span-1 md:col-span-2">
        <div className="flex items-start gap-4">
          <div className={`flex items-center justify-center w-14 h-14 rounded-xl bg-bg-secondary ${meta.color}`}>
            <Icon className="h-7 w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-text-primary">{meta.label}</h3>
            <p className="text-sm text-text-secondary mt-1">{meta.description}</p>
            <p className="text-xs text-text-tertiary mt-2">
              Last updated: {new Date(config.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </Card>

      {/* Active Rules */}
      <Card variant="default" padding="md">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent-teal/10">
            <Users className="h-4 w-4 text-accent-teal" />
          </div>
          <span className="text-sm font-medium text-text-secondary">Active Rules</span>
        </div>
        <p className="text-2xl font-bold text-text-primary">{activeRules.length}</p>
        {nextExpiry && (
          <div className="flex items-center gap-1 mt-2">
            <Clock className="h-3 w-3 text-text-tertiary" />
            <span className="text-xs text-text-tertiary">
              Next expiry: {new Date(nextExpiry.expiresAt!).toLocaleDateString('en-US')}
            </span>
          </div>
        )}
      </Card>

      {/* Access Stats */}
      <Card variant="default" padding="md">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent-gold/10">
            <FileCheck className="h-4 w-4 text-accent-gold" />
          </div>
          <span className="text-sm font-medium text-text-secondary">Access Audit</span>
        </div>
        <div className="flex items-baseline gap-3">
          <div>
            <span className="text-2xl font-bold text-positive">{grantedCount}</span>
            <span className="text-xs text-text-tertiary ml-1">granted</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-negative">{deniedCount}</span>
            <span className="text-xs text-text-tertiary ml-1">denied</span>
          </div>
        </div>
      </Card>

      {/* Visibility Matrix — full width */}
      {activeRules.length > 0 && (
        <Card variant="default" padding="md" className="col-span-1 md:col-span-2 lg:col-span-4">
          <h4 className="text-sm font-semibold text-text-primary mb-3">Data Visibility Matrix</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left py-2 pr-4 text-text-tertiary font-medium">Party</th>
                  {(Object.keys(SCOPE_LABELS) as DataScope[]).map((scope) => (
                    <th key={scope} className="text-center py-2 px-2 text-text-tertiary font-medium">
                      {SCOPE_LABELS[scope]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeRules.map((rule) => (
                  <tr key={rule.id} className="border-b border-border-subtle/50">
                    <td className="py-2 pr-4">
                      <div>
                        <span className="text-text-primary font-medium">{rule.displayName}</span>
                        <span className="block text-text-tertiary text-[10px] truncate max-w-[200px]">{rule.discloseTo}</span>
                      </div>
                    </td>
                    {(Object.keys(SCOPE_LABELS) as DataScope[]).map((scope) => {
                      const hasAccess = rule.dataScope === 'All' || rule.dataScope === scope;
                      return (
                        <td key={scope} className="text-center py-2 px-2">
                          {hasAccess ? (
                            <Badge variant="success" size="sm">✓</Badge>
                          ) : (
                            <span className="text-text-disabled">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export { PrivacyDashboard, type PrivacyDashboardProps };
