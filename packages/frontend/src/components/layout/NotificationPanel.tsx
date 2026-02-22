'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { X, AlertTriangle, CheckCircle2, Landmark, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Notification {
  id: string;
  type: 'warning' | 'success' | 'governance' | 'info';
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

const typeIcons: Record<Notification['type'], React.ElementType> = {
  warning: AlertTriangle,
  success: CheckCircle2,
  governance: Landmark,
  info: Info,
};

const typeColors: Record<Notification['type'], string> = {
  warning: 'text-warning',
  success: 'text-positive',
  governance: 'text-accent-indigo',
  info: 'text-info',
};

function NotificationPanel({ open, onClose, notifications, onMarkAllRead, onNotificationClick }: NotificationPanelProps) {
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
            className="fixed right-0 top-0 z-50 flex h-full w-[360px] flex-col bg-bg-secondary border-l border-border-default shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-border-subtle">
              <h2 className="text-lg font-semibold text-text-primary">Notifications</h2>
              <div className="flex items-center gap-2">
                {onMarkAllRead && (
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
                  const Icon = typeIcons[notif.type];
                  return (
                    <div
                      key={notif.id}
                      onClick={() => onNotificationClick?.(notif)}
                      className={cn(
                        'flex gap-3 px-4 py-3 border-b border-border-subtle cursor-pointer hover:bg-bg-hover transition-colors',
                        !notif.read && 'border-l-2 border-l-accent-teal'
                      )}
                    >
                      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', typeColors[notif.type])} />
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm', notif.read ? 'text-text-secondary' : 'text-text-primary font-medium')}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-text-tertiary mt-0.5 line-clamp-2">{notif.description}</p>
                        <p className="text-xs text-text-disabled mt-1">{notif.timestamp}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export { NotificationPanel, type NotificationPanelProps, type Notification };
