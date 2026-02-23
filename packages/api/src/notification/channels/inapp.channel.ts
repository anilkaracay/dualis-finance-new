import type { NotificationEvent, StoredNotification } from '@dualis/shared';
import { nanoid } from 'nanoid';
import { getDb } from '../../db/client.js';
import * as schema from '../../db/schema.js';
import { channelManager } from '../../ws/channels.js';
import { createChildLogger } from '../../config/logger.js';
import { incrementUnreadCount } from '../ratelimit.js';

const log = createChildLogger('inapp-channel');

/**
 * Deliver an in-app notification:
 * 1. Insert into notifications table
 * 2. Increment Redis unread count
 * 3. Push via WebSocket to connected clients
 */
export async function deliver(
  event: NotificationEvent,
): Promise<StoredNotification | null> {
  const db = getDb();
  const notificationId = `notif_${nanoid(16)}`;
  const now = new Date();

  const stored: StoredNotification = {
    id: notificationId,
    partyId: event.partyId,
    type: event.type,
    category: event.category,
    severity: event.severity,
    title: event.title,
    message: event.message,
    data: event.data,
    status: 'delivered',
    channels: event.channels ?? ['in_app'],
    link: event.link ?? null,
    readAt: null,
    deliveredAt: now.toISOString(),
    createdAt: now.toISOString(),
  };

  // 1. Persist to DB
  if (db) {
    try {
      await db.insert(schema.notifications).values({
        id: stored.id,
        partyId: stored.partyId,
        type: stored.type,
        category: stored.category,
        severity: stored.severity,
        title: stored.title,
        message: stored.message,
        data: stored.data,
        status: stored.status,
        channels: stored.channels,
        link: stored.link,
        deliveredAt: now,
        createdAt: now,
      });
    } catch (err) {
      log.error({ err, notificationId }, 'Failed to persist notification');
      return null;
    }
  } else {
    log.warn({ notificationId }, 'No DB — notification not persisted');
  }

  // 2. Increment unread count in Redis
  const unreadCount = await incrementUnreadCount(event.partyId);

  // 3. Push via WebSocket
  try {
    channelManager.broadcastToParty(event.partyId, {
      type: 'notification',
      data: stored,
    });

    channelManager.broadcastToParty(event.partyId, {
      type: 'unread_count',
      data: { count: unreadCount },
    });
  } catch (err) {
    log.warn({ err, notificationId }, 'WebSocket push failed');
  }

  log.info(
    { notificationId, partyId: event.partyId, type: event.type, severity: event.severity },
    'In-app notification delivered',
  );

  return stored;
}
