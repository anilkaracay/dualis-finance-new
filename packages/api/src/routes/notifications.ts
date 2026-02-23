import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';
import { queryValidator, paramsValidator } from '../middleware/validate.js';
import { getDb } from '../db/client.js';
import * as schema from '../db/schema.js';
import { createChildLogger } from '../config/logger.js';
import { getUnreadCount, decrementUnreadCount, resetUnreadCount } from '../notification/ratelimit.js';
import { channelManager } from '../ws/channels.js';
import { notificationQuerySchema } from '../schemas/notification.js';
import { idParamSchema } from '../schemas/common.js';

const log = createChildLogger('notification-routes');

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export async function notificationRoutes(fastify: FastifyInstance): Promise<void> {
  // ── GET /notifications ─────────────────────────────────────────────────
  fastify.get(
    '/notifications',
    { preHandler: [authMiddleware, queryValidator(notificationQuerySchema)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const partyId = request.user!.partyId;
      const query = request.query as {
        page?: string;
        limit?: string;
        category?: string;
        severity?: string;
        unread?: string;
      };

      const page = Math.max(1, parseInt(query.page ?? '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
      const offset = (page - 1) * limit;

      const db = getDb();
      if (!db) {
        return reply.status(503).send({ error: 'Database unavailable' });
      }

      try {
        // Build conditions
        const conditions = [eq(schema.notifications.partyId, partyId)];

        if (query.category) {
          conditions.push(eq(schema.notifications.category, query.category));
        }
        if (query.severity) {
          conditions.push(eq(schema.notifications.severity, query.severity));
        }
        if (query.unread === 'true') {
          conditions.push(sql`${schema.notifications.readAt} IS NULL`);
        }

        const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

        // Get total count
        const countResult = await db
          .select({ total: count() })
          .from(schema.notifications)
          .where(whereClause!);
        const total = countResult[0]?.total ?? 0;

        // Get paginated data
        const rows = await db
          .select()
          .from(schema.notifications)
          .where(whereClause!)
          .orderBy(desc(schema.notifications.createdAt))
          .limit(limit)
          .offset(offset);

        const data = rows.map((r) => ({
          id: r.id,
          partyId: r.partyId,
          type: r.type,
          category: r.category,
          severity: r.severity,
          title: r.title,
          message: r.message,
          data: r.data,
          status: r.status,
          channels: r.channels,
          link: r.link,
          readAt: r.readAt?.toISOString() ?? null,
          deliveredAt: r.deliveredAt?.toISOString() ?? null,
          createdAt: r.createdAt.toISOString(),
        }));

        return reply.status(200).send({
          data,
          pagination: {
            page,
            limit,
            total: Number(total),
            totalPages: Math.ceil(Number(total) / limit),
          },
        });
      } catch (err) {
        log.error({ err, partyId }, 'Failed to fetch notifications');
        return reply.status(500).send({ error: 'Failed to fetch notifications' });
      }
    },
  );

  // ── GET /notifications/unread-count ────────────────────────────────────
  fastify.get(
    '/notifications/unread-count',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const partyId = request.user!.partyId;

      // Try Redis first (fast)
      let unreadCount = await getUnreadCount(partyId);

      // Fallback to DB if Redis returns 0 (may be cold cache)
      if (unreadCount === 0) {
        const db = getDb();
        if (db) {
          try {
            const countResult = await db
              .select({ total: count() })
              .from(schema.notifications)
              .where(
                and(
                  eq(schema.notifications.partyId, partyId),
                  sql`${schema.notifications.readAt} IS NULL`,
                ),
              );
            unreadCount = Number(countResult[0]?.total ?? 0);
          } catch { /* use 0 */ }
        }
      }

      return reply.status(200).send({ count: unreadCount });
    },
  );

  // ── GET /notifications/:id ────────────────────────────────────────────
  fastify.get(
    '/notifications/:id',
    { preHandler: [authMiddleware, paramsValidator(idParamSchema)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const partyId = request.user!.partyId;
      const { id } = request.params as { id: string };

      const db = getDb();
      if (!db) return reply.status(503).send({ error: 'Database unavailable' });

      try {
        const rows = await db
          .select()
          .from(schema.notifications)
          .where(
            and(
              eq(schema.notifications.id, id),
              eq(schema.notifications.partyId, partyId),
            ),
          )
          .limit(1);

        if (rows.length === 0) {
          return reply.status(404).send({ error: 'Notification not found' });
        }

        const r = rows[0]!;
        return reply.status(200).send({
          data: {
            id: r.id,
            partyId: r.partyId,
            type: r.type,
            category: r.category,
            severity: r.severity,
            title: r.title,
            message: r.message,
            data: r.data,
            status: r.status,
            channels: r.channels,
            link: r.link,
            readAt: r.readAt?.toISOString() ?? null,
            deliveredAt: r.deliveredAt?.toISOString() ?? null,
            createdAt: r.createdAt.toISOString(),
          },
        });
      } catch (err) {
        log.error({ err, id }, 'Failed to fetch notification');
        return reply.status(500).send({ error: 'Failed to fetch notification' });
      }
    },
  );

  // ── PUT /notifications/:id/read ───────────────────────────────────────
  fastify.put(
    '/notifications/:id/read',
    { preHandler: [authMiddleware, paramsValidator(idParamSchema)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const partyId = request.user!.partyId;
      const { id } = request.params as { id: string };

      const db = getDb();
      if (!db) return reply.status(503).send({ error: 'Database unavailable' });

      try {
        const result = await db
          .update(schema.notifications)
          .set({ readAt: new Date(), status: 'read' })
          .where(
            and(
              eq(schema.notifications.id, id),
              eq(schema.notifications.partyId, partyId),
              sql`${schema.notifications.readAt} IS NULL`,
            ),
          )
          .returning({ id: schema.notifications.id });

        if (result.length > 0) {
          const newCount = await decrementUnreadCount(partyId);
          // Push updated count via WS
          channelManager.broadcastToParty(partyId, {
            type: 'unread_count',
            data: { count: newCount },
          });
        }

        return reply.status(200).send({ success: true });
      } catch (err) {
        log.error({ err, id }, 'Failed to mark notification as read');
        return reply.status(500).send({ error: 'Failed to mark as read' });
      }
    },
  );

  // ── PUT /notifications/read-all ───────────────────────────────────────
  fastify.put(
    '/notifications/read-all',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const partyId = request.user!.partyId;

      const db = getDb();
      if (!db) return reply.status(503).send({ error: 'Database unavailable' });

      try {
        await db
          .update(schema.notifications)
          .set({ readAt: new Date(), status: 'read' })
          .where(
            and(
              eq(schema.notifications.partyId, partyId),
              sql`${schema.notifications.readAt} IS NULL`,
            ),
          );

        await resetUnreadCount(partyId);

        // Push updated count via WS
        channelManager.broadcastToParty(partyId, {
          type: 'unread_count',
          data: { count: 0 },
        });

        return reply.status(200).send({ success: true });
      } catch (err) {
        log.error({ err, partyId }, 'Failed to mark all as read');
        return reply.status(500).send({ error: 'Failed to mark all as read' });
      }
    },
  );

  // ── DELETE /notifications/:id ─────────────────────────────────────────
  fastify.delete(
    '/notifications/:id',
    { preHandler: [authMiddleware, paramsValidator(idParamSchema)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const partyId = request.user!.partyId;
      const { id } = request.params as { id: string };

      const db = getDb();
      if (!db) return reply.status(503).send({ error: 'Database unavailable' });

      try {
        await db
          .update(schema.notifications)
          .set({ status: 'failed' }) // soft delete
          .where(
            and(
              eq(schema.notifications.id, id),
              eq(schema.notifications.partyId, partyId),
            ),
          );

        return reply.status(200).send({ success: true });
      } catch (err) {
        log.error({ err, id }, 'Failed to delete notification');
        return reply.status(500).send({ error: 'Failed to delete notification' });
      }
    },
  );
}
