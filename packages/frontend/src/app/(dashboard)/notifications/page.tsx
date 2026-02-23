'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Landmark,
  Info,
  Bell,
  CheckCheck,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  useNotificationStore,
  type NotificationItem,
  type NotificationDisplayType,
} from '@/stores/useNotificationStore';
import type { NotificationCategory } from '@dualis/shared';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type CategoryFilter = 'all' | NotificationCategory;
type SeverityFilter = 'all' | 'critical' | 'warning' | 'info';
type ReadFilter = 'all' | 'unread' | 'read';

const CATEGORY_TABS: { label: string; value: CategoryFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Financial', value: 'financial' },
  { label: 'Auth', value: 'auth' },
  { label: 'Compliance', value: 'compliance' },
  { label: 'Governance', value: 'governance' },
  { label: 'System', value: 'system' },
];

const SEVERITY_TABS: { label: string; value: SeverityFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'Warning', value: 'warning' },
  { label: 'Info', value: 'info' },
];

const READ_TABS: { label: string; value: ReadFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'Read', value: 'read' },
];

// ---------------------------------------------------------------------------
// Icon / color maps (matching NotificationPanel)
// ---------------------------------------------------------------------------

const typeIcons: Record<NotificationDisplayType, React.ElementType> = {
  critical: AlertOctagon,
  warning: AlertTriangle,
  success: CheckCircle2,
  governance: Landmark,
  info: Info,
};

const typeColors: Record<NotificationDisplayType, string> = {
  critical: 'text-negative',
  warning: 'text-warning',
  success: 'text-positive',
  governance: 'text-accent-indigo',
  info: 'text-info',
};

const typeBorderColors: Record<NotificationDisplayType, string> = {
  critical: 'border-l-negative',
  warning: 'border-l-warning',
  success: 'border-l-positive',
  governance: 'border-l-accent-indigo',
  info: 'border-l-accent-teal',
};

const typeBgColors: Record<NotificationDisplayType, string> = {
  critical: 'bg-negative/10',
  warning: 'bg-warning/10',
  success: 'bg-positive/10',
  governance: 'bg-accent-indigo/10',
  info: 'bg-info/10',
};

// ---------------------------------------------------------------------------
// Category inference from display type + backend type
// ---------------------------------------------------------------------------

function inferCategory(notif: NotificationItem): NotificationCategory {
  if (notif.backendType) {
    // Financial types
    if (
      notif.backendType.startsWith('HEALTH_FACTOR') ||
      notif.backendType.startsWith('LIQUIDATION') ||
      notif.backendType === 'INTEREST_MILESTONE' ||
      notif.backendType === 'RATE_CHANGE_SIGNIFICANT' ||
      notif.backendType === 'SUPPLY_CAP_APPROACHING' ||
      notif.backendType === 'BORROW_CAP_APPROACHING'
    ) {
      return 'financial';
    }
    // Auth
    if (
      notif.backendType === 'NEW_LOGIN_DEVICE' ||
      notif.backendType === 'PASSWORD_CHANGED' ||
      notif.backendType === 'WALLET_LINKED' ||
      notif.backendType === 'WALLET_UNLINKED'
    ) {
      return 'auth';
    }
    // Compliance
    if (
      notif.backendType.startsWith('KYB') ||
      notif.backendType.startsWith('DOCUMENT_EXPIRY')
    ) {
      return 'compliance';
    }
    // Governance
    if (
      notif.backendType.startsWith('PROPOSAL') ||
      notif.backendType === 'VOTE_DEADLINE_24H'
    ) {
      return 'governance';
    }
    // System
    return 'system';
  }

  // Fallback based on display type
  if (notif.type === 'governance') return 'governance';
  if (notif.type === 'critical') return 'system';
  return 'financial';
}

function inferSeverity(notif: NotificationItem): 'info' | 'warning' | 'critical' {
  if (notif.severity) return notif.severity;
  if (notif.type === 'critical') return 'critical';
  if (notif.type === 'warning') return 'warning';
  return 'info';
}

// ---------------------------------------------------------------------------
// Relative time formatter
// ---------------------------------------------------------------------------

function formatTimestamp(ts: string): string {
  try {
    const date = new Date(ts);
    if (isNaN(date.getTime())) return ts;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString();
  } catch {
    return ts;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, markAsRead, markAllAsRead, unreadCount } =
    useNotificationStore();

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');

  // ---- Filtered list ----
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      if (categoryFilter !== 'all' && inferCategory(notif) !== categoryFilter) {
        return false;
      }
      if (severityFilter !== 'all' && inferSeverity(notif) !== severityFilter) {
        return false;
      }
      if (readFilter === 'unread' && notif.read) return false;
      if (readFilter === 'read' && !notif.read) return false;
      return true;
    });
  }, [notifications, categoryFilter, severityFilter, readFilter]);

  // ---- Handlers ----
  const handleNotificationClick = (notif: NotificationItem) => {
    if (!notif.read) markAsRead(notif.id);
    if (notif.link) router.push(notif.link);
  };

  // ---- Render ----
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
          <p className="text-sm text-text-secondary mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'You are all caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-accent-teal text-white text-sm font-medium hover:bg-accent-teal/90 transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border-default bg-bg-secondary p-4 space-y-4">
        <div className="flex items-center gap-2 text-text-secondary">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filters</span>
        </div>

        {/* Category Tabs */}
        <div>
          <p className="text-xs text-text-tertiary mb-2 uppercase tracking-wide font-medium">
            Category
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setCategoryFilter(tab.value)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  categoryFilter === tab.value
                    ? 'bg-accent-teal text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Severity Tabs */}
        <div>
          <p className="text-xs text-text-tertiary mb-2 uppercase tracking-wide font-medium">
            Severity
          </p>
          <div className="flex flex-wrap gap-2">
            {SEVERITY_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSeverityFilter(tab.value)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  severityFilter === tab.value
                    ? 'bg-accent-teal text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Read Status Tabs */}
        <div>
          <p className="text-xs text-text-tertiary mb-2 uppercase tracking-wide font-medium">
            Status
          </p>
          <div className="flex flex-wrap gap-2">
            {READ_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setReadFilter(tab.value)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  readFilter === tab.value
                    ? 'bg-accent-teal text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results summary */}
      <p className="text-sm text-text-tertiary">
        Showing {filteredNotifications.length} notification
        {filteredNotifications.length !== 1 ? 's' : ''}
      </p>

      {/* Notification List */}
      {filteredNotifications.length === 0 ? (
        <div className="rounded-lg border border-border-default bg-bg-secondary p-12 flex flex-col items-center justify-center text-text-tertiary">
          <Bell className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium text-text-secondary mb-1">
            No notifications
          </p>
          <p className="text-sm">
            {categoryFilter !== 'all' || severityFilter !== 'all' || readFilter !== 'all'
              ? 'Try adjusting your filters to see more results.'
              : 'When you receive notifications, they will appear here.'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border-default bg-bg-secondary overflow-hidden divide-y divide-border-subtle">
          {filteredNotifications.map((notif) => {
            const Icon = typeIcons[notif.type] ?? Info;
            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={cn(
                  'flex gap-4 px-5 py-4 cursor-pointer hover:bg-bg-hover transition-colors',
                  !notif.read && `border-l-2 ${typeBorderColors[notif.type] ?? 'border-l-accent-teal'}`,
                  notif.read && 'border-l-2 border-l-transparent',
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    'flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full',
                    typeBgColors[notif.type] ?? 'bg-info/10',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      typeColors[notif.type] ?? 'text-info',
                    )}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <p
                      className={cn(
                        'text-sm',
                        notif.read
                          ? 'text-text-secondary'
                          : 'text-text-primary font-semibold',
                      )}
                    >
                      {notif.title}
                    </p>
                    <span className="text-xs text-text-disabled whitespace-nowrap flex-shrink-0">
                      {formatTimestamp(notif.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-text-tertiary mt-0.5 line-clamp-2">
                    {notif.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {/* Category badge */}
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-bg-tertiary text-text-secondary capitalize">
                      {inferCategory(notif)}
                    </span>
                    {/* Severity badge */}
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize',
                        inferSeverity(notif) === 'critical' && 'bg-negative/10 text-negative',
                        inferSeverity(notif) === 'warning' && 'bg-warning/10 text-warning',
                        inferSeverity(notif) === 'info' && 'bg-info/10 text-info',
                      )}
                    >
                      {inferSeverity(notif)}
                    </span>
                    {/* Unread dot */}
                    {!notif.read && (
                      <span className="h-2 w-2 rounded-full bg-accent-teal" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
