'use client';

import { cn } from '@/lib/utils/cn';

type AdminStatus = 'active' | 'paused' | 'archived' | 'pending' | 'approved' | 'rejected' | 'expired' | 'suspended' | 'blacklisted' | 'healthy' | 'degraded' | 'critical' | 'ok' | 'tripped';

const STATUS_STYLES: Record<AdminStatus, string> = {
  active: 'bg-positive/10 text-positive',
  healthy: 'bg-positive/10 text-positive',
  ok: 'bg-positive/10 text-positive',
  approved: 'bg-positive/10 text-positive',
  paused: 'bg-warning/10 text-warning',
  pending: 'bg-info/10 text-info',
  degraded: 'bg-warning/10 text-warning',
  expired: 'bg-warning/10 text-warning',
  suspended: 'bg-warning/10 text-warning',
  archived: 'bg-text-tertiary/10 text-text-tertiary',
  rejected: 'bg-negative/10 text-negative',
  blacklisted: 'bg-negative/10 text-negative',
  critical: 'bg-negative/10 text-negative',
  tripped: 'bg-negative/10 text-negative',
};

interface AdminStatusBadgeProps {
  status: AdminStatus | string;
  size?: 'sm' | 'md';
  className?: string;
}

export function AdminStatusBadge({ status, size = 'sm', className }: AdminStatusBadgeProps) {
  const style = STATUS_STYLES[status as AdminStatus] ?? 'bg-text-tertiary/10 text-text-tertiary';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm font-semibold capitalize',
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1',
        style,
        className,
      )}
    >
      {status}
    </span>
  );
}
