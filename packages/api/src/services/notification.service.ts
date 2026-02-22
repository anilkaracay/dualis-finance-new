import { createChildLogger } from '../config/logger.js';

const log = createChildLogger('notification-service');

interface Notification {
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  data?: Record<string, unknown>;
}

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  channels: {
    liquidationWarnings: boolean;
    priceAlerts: boolean;
    governanceUpdates: boolean;
    secLendingUpdates: boolean;
    rewardsClaimed: boolean;
  };
  thresholds: {
    healthFactorWarning: number;
    priceChangePercent: number;
  };
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  email: true,
  push: true,
  channels: {
    liquidationWarnings: true,
    priceAlerts: true,
    governanceUpdates: true,
    secLendingUpdates: true,
    rewardsClaimed: false,
  },
  thresholds: {
    healthFactorWarning: 1.5,
    priceChangePercent: 5.0,
  },
};

const preferencesStore = new Map<string, NotificationPreferences>();

export function send(partyId: string, notification: Notification): void {
  log.info(
    {
      partyId,
      type: notification.type,
      severity: notification.severity,
      title: notification.title,
    },
    'Notification sent'
  );
  // In production, this would dispatch to email/push/websocket services
}

export function getPreferences(partyId: string): NotificationPreferences {
  log.debug({ partyId }, 'Getting notification preferences');
  return preferencesStore.get(partyId) ?? { ...DEFAULT_PREFERENCES };
}

export function updatePreferences(
  partyId: string,
  prefs: Partial<NotificationPreferences>
): NotificationPreferences {
  log.info({ partyId }, 'Updating notification preferences');
  const current = preferencesStore.get(partyId) ?? { ...DEFAULT_PREFERENCES };

  const updated: NotificationPreferences = {
    email: prefs.email ?? current.email,
    push: prefs.push ?? current.push,
    channels: {
      ...current.channels,
      ...prefs.channels,
    },
    thresholds: {
      ...current.thresholds,
      ...prefs.thresholds,
    },
  };

  preferencesStore.set(partyId, updated);
  return updated;
}
