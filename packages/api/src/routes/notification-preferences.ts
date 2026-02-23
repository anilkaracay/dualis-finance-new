import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { UserNotificationPreferences, TestNotificationRequest } from '@dualis/shared';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';
import { getDb } from '../db/client.js';
import * as schema from '../db/schema.js';
import { createChildLogger } from '../config/logger.js';
import { notificationBus } from '../notification/notification.bus.js';
import { getRedis } from '../cache/redis.js';

const log = createChildLogger('notification-preferences-routes');

// ---------------------------------------------------------------------------
// Default preferences
// ---------------------------------------------------------------------------

const DEFAULTS: UserNotificationPreferences = {
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
// Helper: DB row → UserNotificationPreferences
// ---------------------------------------------------------------------------

function rowToPrefs(partyId: string, row: typeof schema.notificationPreferences.$inferSelect): UserNotificationPreferences {
  return {
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
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export async function notificationPreferenceRoutes(fastify: FastifyInstance): Promise<void> {
  // ── GET /notifications/preferences ─────────────────────────────────────
  fastify.get(
    '/notifications/preferences',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const partyId = request.user!.partyId;

      const db = getDb();
      if (!db) return reply.status(200).send({ data: { ...DEFAULTS, partyId } });

      try {
        const rows = await db
          .select()
          .from(schema.notificationPreferences)
          .where(eq(schema.notificationPreferences.partyId, partyId))
          .limit(1);

        if (rows.length === 0) {
          return reply.status(200).send({ data: { ...DEFAULTS, partyId } });
        }

        return reply.status(200).send({ data: rowToPrefs(partyId, rows[0]!) });
      } catch (err) {
        log.error({ err, partyId }, 'Failed to fetch preferences');
        return reply.status(500).send({ error: 'Failed to fetch preferences' });
      }
    },
  );

  // ── PUT /notifications/preferences ─────────────────────────────────────
  fastify.put(
    '/notifications/preferences',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const partyId = request.user!.partyId;
      const body = request.body as Partial<UserNotificationPreferences>;

      const db = getDb();
      if (!db) return reply.status(503).send({ error: 'Database unavailable' });

      // Validate HF thresholds order
      const hfCaution = body.financial?.hfCautionThreshold;
      const hfDanger = body.financial?.hfDangerThreshold;
      const hfCritical = body.financial?.hfCriticalThreshold;

      if (hfCaution !== undefined || hfDanger !== undefined || hfCritical !== undefined) {
        const c = hfCaution ?? DEFAULTS.financial.hfCautionThreshold;
        const d = hfDanger ?? DEFAULTS.financial.hfDangerThreshold;
        const cr = hfCritical ?? DEFAULTS.financial.hfCriticalThreshold;

        if (!(c > d && d > cr && cr > 1.0)) {
          return reply.status(400).send({
            error: 'HF thresholds must satisfy: caution > danger > critical > 1.0',
          });
        }
      }

      // Validate digest time format
      if (body.digest?.time) {
        const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
        if (!timeRegex.test(body.digest.time)) {
          return reply.status(400).send({ error: 'Digest time must be HH:MM format (00:00-23:59)' });
        }
      }

      // Validate digest frequency
      if (body.digest?.frequency && !['daily', 'weekly'].includes(body.digest.frequency)) {
        return reply.status(400).send({ error: 'Digest frequency must be "daily" or "weekly"' });
      }

      try {
        // Build update object from partial input
        const updateData: Record<string, unknown> = { updatedAt: new Date() };

        if (body.channels?.inApp !== undefined) updateData.channelInApp = body.channels.inApp;
        if (body.channels?.email !== undefined) updateData.emailEnabled = body.channels.email;
        if (body.channels?.webhook !== undefined) updateData.channelWebhook = body.channels.webhook;
        if (body.financial?.enabled !== undefined) updateData.financialEnabled = body.financial.enabled;
        if (hfCaution !== undefined) updateData.hfCautionThreshold = hfCaution;
        if (hfDanger !== undefined) updateData.hfDangerThreshold = hfDanger;
        if (hfCritical !== undefined) updateData.hfCriticalThreshold = hfCritical;
        if (body.financial?.interestMilestones !== undefined) updateData.interestMilestones = body.financial.interestMilestones;
        if (body.financial?.rateChanges !== undefined) updateData.rateChanges = body.financial.rateChanges;
        if (body.auth?.enabled !== undefined) updateData.authEnabled = body.auth.enabled;
        if (body.auth?.newLoginAlerts !== undefined) updateData.newLoginAlerts = body.auth.newLoginAlerts;
        if (body.governance?.enabled !== undefined) updateData.governanceEnabled = body.governance.enabled;
        if (body.digest?.enabled !== undefined) updateData.digestEnabled = body.digest.enabled;
        if (body.digest?.frequency !== undefined) updateData.digestFrequency = body.digest.frequency;
        if (body.digest?.time !== undefined) updateData.digestTime = body.digest.time;

        // Upsert: try update first, insert if not exists
        const existing = await db
          .select({ id: schema.notificationPreferences.id })
          .from(schema.notificationPreferences)
          .where(eq(schema.notificationPreferences.partyId, partyId))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(schema.notificationPreferences)
            .set(updateData)
            .where(eq(schema.notificationPreferences.partyId, partyId));
        } else {
          await db.insert(schema.notificationPreferences).values({
            partyId,
            ...updateData,
          });
        }

        // Invalidate preference cache
        const redis = getRedis();
        if (redis) {
          try { await redis.del(`notif:prefs:${partyId}`); } catch { /* ignore */ }
        }

        // Fetch updated row
        const rows = await db
          .select()
          .from(schema.notificationPreferences)
          .where(eq(schema.notificationPreferences.partyId, partyId))
          .limit(1);

        const prefs = rows.length > 0 ? rowToPrefs(partyId, rows[0]!) : { ...DEFAULTS, partyId };

        log.info({ partyId }, 'Notification preferences updated');
        return reply.status(200).send({ data: prefs });
      } catch (err) {
        log.error({ err, partyId }, 'Failed to update preferences');
        return reply.status(500).send({ error: 'Failed to update preferences' });
      }
    },
  );

  // ── POST /notifications/preferences/test ───────────────────────────────
  fastify.post(
    '/notifications/preferences/test',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const partyId = request.user!.partyId;
      const body = request.body as TestNotificationRequest | undefined;
      const channel = body?.channel ?? 'in_app';

      try {
        const channels = channel === 'in_app'
          ? ['in_app' as const, 'websocket' as const]
          : channel === 'email'
            ? ['email' as const]
            : ['webhook' as const];

        await notificationBus.emit({
          type: 'SYSTEM_MAINTENANCE',
          category: 'system',
          severity: 'info',
          partyId,
          title: 'Test Notification',
          message: 'This is a test notification to verify your notification settings are working correctly.',
          data: { test: true },
          channels,
          deduplicationKey: `test:${partyId}:${Date.now()}`, // Unique — never deduped
        });

        return reply.status(200).send({ success: true, channel });
      } catch (err) {
        log.error({ err, partyId, channel }, 'Failed to send test notification');
        return reply.status(500).send({ error: 'Failed to send test notification' });
      }
    },
  );
}
