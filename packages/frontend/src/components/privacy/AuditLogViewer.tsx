'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import type { PrivacyAuditEntry, DataScope } from '@dualis/shared';

interface AuditLogViewerProps {
  /** Audit log entries */
  entries: PrivacyAuditEntry[];
  /** Show loading state */
  loading?: boolean;
}

type GrantedFilter = 'all' | 'granted' | 'denied';

const DATA_SCOPE_OPTIONS: { value: DataScope | 'all'; label: string }[] = [
  { value: 'all', label: 'Tüm Kapsamlar' },
  { value: 'Positions', label: 'Positions' },
  { value: 'Transactions', label: 'Transactions' },
  { value: 'CreditScore', label: 'Credit Score' },
  { value: 'SecLendingDeals', label: 'Sec Lending Deals' },
  { value: 'All', label: 'All' },
];

const GRANTED_OPTIONS: { value: GrantedFilter; label: string }[] = [
  { value: 'all', label: 'Tümü' },
  { value: 'granted', label: 'Onaylanan' },
  { value: 'denied', label: 'Reddedilen' },
];

const SCOPE_BADGE_VARIANT: Record<DataScope, 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
  Positions: 'info',
  Transactions: 'default',
  CreditScore: 'warning',
  SecLendingDeals: 'success',
  All: 'danger',
};

function formatTimestamp(timestamp: string): string {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(timestamp));
  } catch {
    return timestamp;
  }
}

function AuditLogViewer({ entries, loading = false }: AuditLogViewerProps) {
  const [scopeFilter, setScopeFilter] = useState<DataScope | 'all'>('all');
  const [grantedFilter, setGrantedFilter] = useState<GrantedFilter>('all');

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (scopeFilter !== 'all' && entry.dataScope !== scopeFilter) return false;
      if (grantedFilter === 'granted' && !entry.granted) return false;
      if (grantedFilter === 'denied' && entry.granted) return false;
      return true;
    });
  }, [entries, scopeFilter, grantedFilter]);

  const selectClassName = cn(
    'h-8 rounded-md bg-bg-tertiary border border-border-default text-xs text-text-primary',
    'px-2 transition-colors duration-100 focus-ring focus:border-border-focus',
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Filters and count */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value as DataScope | 'all')}
            className={selectClassName}
            aria-label="Filter by data scope"
          >
            {DATA_SCOPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={grantedFilter}
            onChange={(e) => setGrantedFilter(e.target.value as GrantedFilter)}
            className={selectClassName}
            aria-label="Filter by result"
          >
            {GRANTED_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-text-tertiary">
          {filteredEntries.length} entries
        </span>
      </div>

      {/* Audit log table */}
      <div className="overflow-auto rounded-lg border border-border-default">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-transparent backdrop-blur-sm bg-bg-primary/80">
              {['Zaman', 'Talep Eden', 'Kapsam', 'Sonuç', 'Açıklama'].map((header) => (
                <th
                  key={header}
                  className={cn(
                    'h-11 px-4 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary',
                    'border-b border-border-default',
                  )}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="h-10">
                  <td className="px-4"><Skeleton variant="rect" height={14} width={150} /></td>
                  <td className="px-4"><Skeleton variant="rect" height={14} width={120} /></td>
                  <td className="px-4"><Skeleton variant="rect" height={20} width={80} /></td>
                  <td className="px-4"><Skeleton variant="rect" height={20} width={70} /></td>
                  <td className="px-4"><Skeleton variant="rect" height={14} width="70%" /></td>
                </tr>
              ))
            ) : filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <p className="text-sm text-text-tertiary">Denetim kaydı bulunmuyor.</p>
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry, index) => (
                <tr
                  key={`${entry.timestamp}-${entry.requesterParty}-${index}`}
                  className={cn(
                    'h-10 border-b border-border-subtle last:border-0 transition-colors',
                    entry.granted
                      ? 'bg-positive/[0.04] hover:bg-positive/[0.08]'
                      : 'bg-negative/[0.04] hover:bg-negative/[0.08]',
                  )}
                >
                  <td className="px-4">
                    <span className="text-xs text-text-secondary font-mono">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </td>
                  <td className="px-4">
                    <span className="text-sm text-text-primary font-medium">
                      {entry.requesterParty}
                    </span>
                  </td>
                  <td className="px-4">
                    <Badge variant={SCOPE_BADGE_VARIANT[entry.dataScope]} size="sm">
                      {entry.dataScope}
                    </Badge>
                  </td>
                  <td className="px-4">
                    <Badge variant={entry.granted ? 'success' : 'danger'} size="sm">
                      {entry.granted ? 'Onaylandı' : 'Reddedildi'}
                    </Badge>
                  </td>
                  <td className="px-4">
                    <span className="text-xs text-text-tertiary truncate max-w-[250px] block">
                      {entry.reason ?? '-'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { AuditLogViewer, type AuditLogViewerProps };
