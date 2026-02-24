'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { X, AlertTriangle, CheckCircle2, Landmark, Info, AlertOctagon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { NotificationDisplayType } from '@/stores/useNotificationStore';

interface Notification {
  id: string;
  type: NotificationDisplayType;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAllRead?: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

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
    return date.toLocaleDateString();
  } catch {
    return ts;
  }
}

function NotificationPanel({ open, onClose, notifications, onMarkAllRead, onNotificationClick }: NotificationPanelProps) {
  const router = useRouter();

  const handleClick = (notif: Notification) => {
    onNotificationClick?.(notif);
    if (notif.link) {
      router.push(notif.link);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-[380px] flex-col bg-bg-secondary/95 backdrop-blur-xl border-l border-border-subtle shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-border-subtle">
              <h2 className="text-lg font-semibold text-text-primary">Notifications</h2>
              <div className="flex items-center gap-2">
                {onMarkAllRead && notifications.some((n) => !n.read) && (
                  <Button variant="ghost" size="sm" onClick={onMarkAllRead}>
                    Mark all read
                  </Button>
                )}
                <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
                  <Info className="h-8 w-8 mb-2" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const Icon = typeIcons[notif.type] ?? Info;
                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleClick(notif)}
                      className={cn(
                        'flex gap-3 px-4 py-3.5 border-b border-border-subtle/50 cursor-pointer hover:bg-surface-selected transition-all duration-150 animate-slide-in-right',
                        !notif.read && `border-l-[3px] ${typeBorderColors[notif.type] ?? 'border-l-accent-teal'}`,
                      )}
                    >
                      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', typeColors[notif.type] ?? 'text-info')} />
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm', notif.read ? 'text-text-secondary' : 'text-text-primary font-medium')}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-text-tertiary mt-0.5 line-clamp-2">{notif.description}</p>
                        <p className="text-xs text-text-disabled mt-1">{formatTimestamp(notif.timestamp)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-border-subtle px-4 py-3">
                <button
                  onClick={() => { router.push('/notifications'); onClose(); }}
                  className="w-full text-center text-sm text-accent-teal hover:text-accent-teal/80 transition-colors font-medium"
                >
                  View all notifications
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export { NotificationPanel, type NotificationPanelProps, type Notification };
