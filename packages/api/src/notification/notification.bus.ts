import type {
  NotificationEvent,
  NotificationChannel,
  UserNotificationPreferences,
} from '@dualis/shared';
import { NOTIFICATION_DEFAULTS } from '@dualis/shared';
import { eq } from 'drizzle-orm';
import { getDb } from '../db/client.js';
import * as schema from '../db/schema.js';
import { createChildLogger } from '../config/logger.js';
import { getRedis } from '../cache/redis.js';
import { checkRateLimit, checkDedup, clearHfDedupOnEscalation } from './ratelimit.js';
import { deliver as deliverInApp } from './channels/inapp.channel.js';
import { getEmailQueue, getWebhookQueue } from './queue.js';
import type { EmailJobData, WebhookJobData } from './queue.js';
import { channelManager } from '../ws/channels.js';

const log = createChildLogger('notification-bus');

// ---------------------------------------------------------------------------
// Preference defaults (when no DB row exists)
// ---------------------------------------------------------------------------

const DEFAULT_PREFERENCES: UserNotificationPreferences = {
  partyId: '',
  channels: { inApp: true, email: true, webhook: false },
  financial: {
    enabled: true,
    hfCautionThreshold: 1.5,
    hfDangerThreshold: 1.2,
    hfCriticalThreshold: 1.05,
    interestMilestones: true,
    rateChanges: true,
  },
  auth: { enabled: true, newLoginAlerts: true },
  governance: { enabled: false },
  digest: { enabled: false, frequency: 'daily', time: '09:00' },
};

// ---------------------------------------------------------------------------
// Preference cache (Redis — 5 min TTL)
// ---------------------------------------------------------------------------

async function loadPreferences(partyId: string): Promise<UserNotificationPreferences> {
  const redis = getRedis();
  const cacheKey = `notif:prefs:${partyId}`;

  // Try cache first
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch { /* cache miss */ }
  }

  // Load from DB
  const db = getDb();
  if (!db) return { ...DEFAULT_PREFERENCES, partyId };

  try {
    const rows = await db
      .select()
      .from(schema.notificationPreferences)
      .where(eq(schema.notificationPreferences.partyId, partyId))
      .limit(1);

    if (rows.length === 0) return { ...DEFAULT_PREFERENCES, partyId };

    const row = rows[0]!;
    const prefs: UserNotificationPreferences = {
      partyId,
      channels: {
        inApp: row.channelInApp,
        email: row.emailEnabled,
        webhook: row.channelWebhook,
      },
      financial: {
        enabled: row.financialEnabled,
        hfCautionThreshold: row.hfCautionThreshold,
        hfDangerThreshold: row.hfDangerThreshold,
        hfCriticalThreshold: row.hfCriticalThreshold,
        interestMilestones: row.interestMilestones,
        rateChanges: row.rateChanges,
      },
      auth: {
        enabled: row.authEnabled,
        newLoginAlerts: row.newLoginAlerts,
      },
      governance: { enabled: row.governanceEnabled },
      digest: {
        enabled: row.digestEnabled,
        frequency: row.digestFrequency as 'daily' | 'weekly',
        time: row.digestTime,
      },
    };

    // Cache for 5 minutes
    if (redis) {
      try {
        await redis.set(cacheKey, JSON.stringify(prefs), 'EX', 300);
      } catch { /* ignore cache write failure */ }
    }

    return prefs;
  } catch (err) {
    log.warn({ err, partyId }, 'Failed to load preferences — using defaults');
    return { ...DEFAULT_PREFERENCES, partyId };
  }
}

// ---------------------------------------------------------------------------
// Channel preference check
// ---------------------------------------------------------------------------

function isCategoryEnabled(prefs: UserNotificationPreferences, category: string): boolean {
  switch (category) {
    case 'financial': return prefs.financial.enabled;
    case 'auth': return prefs.auth.enabled;
    case 'compliance': return prefs.auth.enabled; // auth covers compliance
    case 'governance': return prefs.governance.enabled;
    case 'system': return true; // System notifications always enabled
    default: return true;
  }
}

function filterChannels(
  channels: NotificationChannel[],
  prefs: UserNotificationPreferences,
): NotificationChannel[] {
  return channels.filter((ch) => {
    switch (ch) {
      case 'in_app': return prefs.channels.inApp;
      case 'email': return prefs.channels.email;
      case 'webhook': return prefs.channels.webhook;
      case 'websocket': return true; // WebSocket always on if subscribed
      default: return false;
    }
  });
}

// ---------------------------------------------------------------------------
// Email address lookup
// ---------------------------------------------------------------------------

async function getEmailAddress(partyId: string): Promise<string | null> {
  const db = getDb();
  if (!db) return null;

  try {
    // Try notification preferences first
    const prefRows = await db
      .select({ emailAddress: schema.notificationPreferences.emailAddress })
      .from(schema.notificationPreferences)
      .where(eq(schema.notificationPreferences.partyId, partyId))
      .limit(1);

    if (prefRows.length > 0 && prefRows[0]?.emailAddress) {
      return prefRows[0].emailAddress;
    }

    // Fall back to users table
    const userRows = await db
      .select({ email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.partyId, partyId))
      .limit(1);

    return userRows.length > 0 ? userRows[0]!.email : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Webhook endpoints lookup
// ---------------------------------------------------------------------------

async function getActiveWebhooks(partyId: string, eventType: string): Promise<Array<{
  id: string;
  url: string;
  secret: string;
}>> {
  const db = getDb();
  if (!db) return [];

  try {
    const rows = await db
      .select()
      .from(schema.webhookEndpoints)
      .where(eq(schema.webhookEndpoints.partyId, partyId));

    return rows
      .filter((r) => r.isActive && (r.events as string[]).includes(eventType))
      .map((r) => ({ id: r.id, url: r.url, secret: r.secret }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Template ID mapping
// ---------------------------------------------------------------------------

function getTemplateId(type: string): string {
  if (type.startsWith('HEALTH_FACTOR_')) return 'health-factor-warning';
  if (type === 'LIQUIDATION_EXECUTED') return 'liquidation-executed';
  if (type === 'LIQUIDATION_WARNING') return 'health-factor-warning';
  if (type.startsWith('KYB_')) return 'kyb-status';
  if (type.startsWith('DOCUMENT_EXPIRY_')) return 'document-expiry';
  if (type === 'NEW_LOGIN_DEVICE') return 'new-login';
  if (type === 'RATE_CHANGE_SIGNIFICANT') return 'rate-change';
  if (type === 'PROTOCOL_PAUSED') return 'protocol-paused';
  if (type === 'PROTOCOL_RESUMED') return 'protocol-paused';
  if (type === 'SYSTEM_MAINTENANCE') return 'protocol-paused';
  return 'digest'; // fallback
}

// ---------------------------------------------------------------------------
// NotificationBus — singleton orchestrator
// ---------------------------------------------------------------------------

class NotificationBus {
  /**
   * Emit a single notification event.
   * Checks preferences, rate limits, dedup, then routes to channels.
   */
  async emit(event: NotificationEvent): Promise<void> {
    try {
      const defaults = NOTIFICATION_DEFAULTS[event.type];
      const category = event.category || defaults?.category || 'system';
      const severity = event.severity || defaults?.severity || 'info';
      const requestedChannels = event.channels ?? defaults?.channels ?? ['in_app'];

      // Load user preferences
      const prefs = await loadPreferences(event.partyId);

      // Check if this category is enabled (system events bypass)
      if (category !== 'system' && !isCategoryEnabled(prefs, category)) {
        log.debug({ partyId: event.partyId, type: event.type }, 'Category disabled — skipping');
        return;
      }

      // Filter channels based on preferences
      const channels = filterChannels(requestedChannels, prefs);
      if (channels.length === 0) {
        log.debug({ partyId: event.partyId, type: event.type }, 'No enabled channels — skipping');
        return;
      }

      // Deduplication check
      const dedupKey = event.deduplicationKey ?? `${event.partyId}:${event.type}`;
      const isNew = await checkDedup(dedupKey, event.type);
      if (!isNew) return;

      // HF severity escalation — clear lower-level dedup keys
      if (event.type.startsWith('HEALTH_FACTOR_') && event.data.positionId) {
        await clearHfDedupOnEscalation(
          event.partyId,
          event.data.positionId as string,
          event.type,
        );
      }

      // Route to each channel (isolated — one failure doesn't block others)
      const enrichedEvent = { ...event, category, severity, channels };

      for (const channel of channels) {
        try {
          // Per-channel rate limit
          const allowed = await checkRateLimit(channel, event.partyId, severity);
          if (!allowed) {
            log.debug({ channel, partyId: event.partyId, type: event.type }, 'Rate limited');
            continue;
          }

          await this.deliverToChannel(channel, enrichedEvent);
        } catch (err) {
          log.error({ err, channel, type: event.type, partyId: event.partyId }, 'Channel delivery failed');
        }
      }
    } catch (err) {
      log.error({ err, type: event.type, partyId: event.partyId }, 'NotificationBus.emit failed');
    }
  }

  /**
   * Emit notifications to multiple users (e.g., protocol pause broadcast).
   * Skips preference check for system-critical events.
   */
  async emitBatch(events: NotificationEvent[]): Promise<void> {
    await Promise.allSettled(events.map((e) => this.emit(e)));
  }

  /**
   * Broadcast a notification to ALL users (e.g., protocol pause/resume).
   * This is for critical system events that bypass user preferences.
   */
  async emitBroadcast(event: Omit<NotificationEvent, 'partyId'>): Promise<void> {
    const db = getDb();
    if (!db) {
      log.warn('No DB — cannot broadcast notification');
      return;
    }

    try {
      const users = await db
        .select({ partyId: schema.users.partyId })
        .from(schema.users)
        .where(eq(schema.users.accountStatus, 'active'));

      log.info({ type: event.type, userCount: users.length }, 'Broadcasting notification');

      const events: NotificationEvent[] = users.map((u) => ({
        ...event,
        partyId: u.partyId,
      }));

      // Process in batches of 100
      for (let i = 0; i < events.length; i += 100) {
        const batch = events.slice(i, i + 100);
        await this.emitBatch(batch);
      }
    } catch (err) {
      log.error({ err, type: event.type }, 'Broadcast failed');
    }
  }

  // ---------------------------------------------------------------------------
  // Private: route to specific channel
  // ---------------------------------------------------------------------------

  private async deliverToChannel(
    channel: NotificationChannel,
    event: NotificationEvent,
  ): Promise<void> {
    switch (channel) {
      case 'in_app':
        await deliverInApp(event);
        break;

      case 'websocket':
        // WebSocket is handled by in-app channel (broadcastToParty)
        // If in_app is also in the channel list, skip to avoid double push
        if (!event.channels?.includes('in_app')) {
          channelManager.broadcastToParty(event.partyId, {
            type: 'notification',
            data: {
              type: event.type,
              severity: event.severity,
              title: event.title,
              message: event.message,
              data: event.data,
              createdAt: new Date().toISOString(),
            },
          });
        }
        break;

      case 'email': {
        const emailQueue = getEmailQueue();
        if (!emailQueue) {
          log.debug('Email queue not available — skipping');
          break;
        }

        const toAddress = await getEmailAddress(event.partyId);
        if (!toAddress) {
          log.debug({ partyId: event.partyId }, 'No email address — skipping email');
          break;
        }

        const jobData: EmailJobData = {
          notificationId: `notif_${Date.now()}`,
          partyId: event.partyId,
          toAddress,
          templateId: getTemplateId(event.type),
          templateData: {
            type: event.type,
            severity: event.severity,
            title: event.title,
            message: event.message,
            ...event.data,
          },
          severity: event.severity,
        };

        await emailQueue.add('send-email', jobData, {
          priority: event.severity === 'critical' ? 1 : event.severity === 'warning' ? 5 : 10,
        });
        break;
      }

      case 'webhook': {
        const webhookQueue = getWebhookQueue();
        if (!webhookQueue) {
          log.debug('Webhook queue not available — skipping');
          break;
        }

        const webhooks = await getActiveWebhooks(event.partyId, event.type);
        for (const wh of webhooks) {
          const jobData: WebhookJobData = {
            notificationId: `notif_${Date.now()}`,
            webhookEndpointId: wh.id,
            payload: {
              id: `notif_${Date.now()}`,
              type: event.type,
              category: event.category,
              severity: event.severity,
              timestamp: new Date().toISOString(),
              data: {
                partyId: event.partyId,
                title: event.title,
                message: event.message,
                ...event.data,
              },
            },
            secret: wh.secret,
            url: wh.url,
          };

          await webhookQueue.add('send-webhook', jobData, {
            priority: event.severity === 'critical' ? 1 : 5,
          });
        }
        break;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const notificationBus = new NotificationBus();
