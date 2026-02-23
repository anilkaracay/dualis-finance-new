import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, desc, count } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { authMiddleware } from '../middleware/auth.js';
import { bodyValidator, paramsValidator } from '../middleware/validate.js';
import { getDb } from '../db/client.js';
import * as schema from '../db/schema.js';
import { createChildLogger } from '../config/logger.js';
import { validateWebhookUrl, generateWebhookSecret } from '../notification/channels/webhook.channel.js';
import { notificationBus } from '../notification/notification.bus.js';
import { createWebhookSchema, updateWebhookSchema } from '../schemas/webhook.js';
import { idParamSchema } from '../schemas/common.js';

const log = createChildLogger('webhook-routes');

const MAX_WEBHOOKS_PER_USER = 5;

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export async function webhookRoutes(fastify: FastifyInstance): Promise<void> {
  // ── GET /webhooks ──────────────────────────────────────────────────────
  fastify.get(
    '/webhooks',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const partyId = request.user!.partyId;

      const db = getDb();
      if (!db) return reply.status(503).send({ error: 'Database unavailable' });

      try {
        const rows = await db
          .select()
          .from(schema.webhookEndpoints)
          .where(eq(schema.webhookEndpoints.partyId, partyId))
          .orderBy(desc(schema.webhookEndpoints.createdAt));

        // Hide secrets (only show prefix)
        const data = rows.map((r) => ({
          id: r.id,
          url: r.url,
          events: r.events,
          isActive: r.isActive,
          failureCount: r.failureCount,
          lastDeliveryAt: r.lastDeliveryAt?.toISOString() ?? null,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        }));

        return reply.status(200).send({ data });
      } catch (err) {
        log.error({ err, partyId }, 'Failed to fetch webhooks');
        return reply.status(500).send({ error: 'Failed to fetch webhooks' });
      }
    },
  );

  // ── POST /webhooks ─────────────────────────────────────────────────────
  fastify.post(
    '/webhooks',
    { preHandler: [authMiddleware, bodyValidator(createWebhookSchema)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const partyId = request.user!.partyId;
      const body = request.body as { url: string; events: string[] };

      // Validate URL (SSRF protection)
      const urlCheck = validateWebhookUrl(body.url);
      if (!urlCheck.valid) {
        return reply.status(400).send({ error: urlCheck.error });
      }

      const db = getDb();
      if (!db) return reply.status(503).send({ error: 'Database unavailable' });

      try {
        // Check max webhooks
        const countResult = await db
          .select({ total: count() })
          .from(schema.webhookEndpoints)
          .where(eq(schema.webhookEndpoints.partyId, partyId));
        const total = countResult[0]?.total ?? 0;

        if (Number(total) >= MAX_WEBHOOKS_PER_USER) {
          return reply.status(400).send({
            error: `Maximum ${MAX_WEBHOOKS_PER_USER} webhooks per user`,
          });
        }

        const id = `wh_${nanoid(16)}`;
        const secret = generateWebhookSecret();

        await db.insert(schema.webhookEndpoints).values({
          id,
          partyId,
          url: body.url,
          secret,
          events: body.events,
          isActive: true,
          failureCount: 0,
        });

        log.info({ partyId, webhookId: id, url: body.url }, 'Webhook endpoint created');

        // Return the secret ONCE (user must store it)
        return reply.status(201).send({
          data: {
            id,
            url: body.url,
            secret, // Only returned on creation
            events: body.events,
            isActive: true,
          },
        });
      } catch (err) {
        log.error({ err, partyId }, 'Failed to create webhook');
        return reply.status(500).send({ error: 'Failed to create webhook' });
      }
    },
  );

  // ── GET /webhooks/:id ──────────────────────────────────────────────────
  fastify.get(
    '/webhooks/:id',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const partyId = request.user!.partyId;
      const { id } = request.params as { id: string };

      const db = getDb();
      if (!db) return reply.status(503).send({ error: 'Database unavailable' });

      try {
        const rows = await db
          .select()
          .from(schema.webhookEndpoints)
          .where(
            and(
              eq(schema.webhookEndpoints.id, id),
              eq(schema.webhookEndpoints.partyId, partyId),
            ),
          )
          .limit(1);

        if (rows.length === 0) {
          return reply.status(404).send({ error: 'Webhook not found' });
        }

        const r = rows[0]!;
        return reply.status(200).send({
          data: {
            id: r.id,
            url: r.url,
            events: r.events,
            isActive: r.isActive,
            failureCount: r.failureCount,
            lastDeliveryAt: r.lastDeliveryAt?.toISOString() ?? null,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
          },
        });
      } catch (err) {
        log.error({ err, id }, 'Failed to fetch webhook');
        return reply.status(500).send({ error: 'Failed to fetch webhook' });
      }
    },
  );

  // ── PUT /webhooks/:id ──────────────────────────────────────────────────
  fastify.put(
    '/webhooks/:id',
    { preHandler: [authMiddleware, paramsValidator(idParamSchema), bodyValidator(updateWebhookSchema)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const partyId = request.user!.partyId;
      const { id } = request.params as { id: string };
      const body = request.body as { url?: string; events?: string[]; isActive?: boolean };

      if (body.url) {
        const urlCheck = validateWebhookUrl(body.url);
        if (!urlCheck.valid) {
          return reply.status(400).send({ error: urlCheck.error });
        }
      }

      const db = getDb();
      if (!db) return reply.status(503).send({ error: 'Database unavailable' });

      try {
        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        if (body.url !== undefined) updateData.url = body.url;
        if (body.events !== undefined) updateData.events = body.events;
        if (body.isActive !== undefined) {
          updateData.isActive = body.isActive;
          if (body.isActive) updateData.failureCount = 0; // Reset on reactivation
        }

        const result = await db
          .update(schema.webhookEndpoints)
          .set(updateData)
          .where(
            and(
              eq(schema.webhookEndpoints.id, id),
              eq(schema.webhookEndpoints.partyId, partyId),
            ),
          )
          .returning({ id: schema.webhookEndpoints.id });

        if (result.length === 0) {
          return reply.status(404).send({ error: 'Webhook not found' });
        }

        return reply.status(200).send({ success: true });
      } catch (err) {
        log.error({ err, id }, 'Failed to update webhook');
        return reply.status(500).send({ error: 'Failed to update webhook' });
      }
    },
  );

  // ── DELETE /webhooks/:id ───────────────────────────────────────────────
  fastify.delete(
    '/webhooks/:id',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const partyId = request.user!.partyId;
      const { id } = request.params as { id: string };

      const db = getDb();
      if (!db) return reply.status(503).send({ error: 'Database unavailable' });

      try {
        const result = await db
          .delete(schema.webhookEndpoints)
          .where(
            and(
              eq(schema.webhookEndpoints.id, id),
              eq(schema.webhookEndpoints.partyId, partyId),
            ),
          )
          .returning({ id: schema.webhookEndpoints.id });

        if (result.length === 0) {
          return reply.status(404).send({ error: 'Webhook not found' });
        }

        log.info({ partyId, webhookId: id }, 'Webhook endpoint deleted');
        return reply.status(200).send({ success: true });
      } catch (err) {
        log.error({ err, id }, 'Failed to delete webhook');
        return reply.status(500).send({ error: 'Failed to delete webhook' });
      }
    },
  );

  // ── POST /webhooks/:id/test ────────────────────────────────────────────
  fastify.post(
    '/webhooks/:id/test',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const partyId = request.user!.partyId;
      const { id } = request.params as { id: string };

      try {
        await notificationBus.emit({
          type: 'SYSTEM_MAINTENANCE',
          category: 'system',
          severity: 'info',
          partyId,
          title: 'Webhook Test',
          message: 'This is a test webhook delivery from Dualis Finance.',
          data: { test: true, webhookEndpointId: id },
          channels: ['webhook'],
          deduplicationKey: `webhook-test:${id}:${Date.now()}`,
        });

        return reply.status(200).send({ success: true });
      } catch (err) {
        log.error({ err, id }, 'Failed to send test webhook');
        return reply.status(500).send({ error: 'Failed to send test webhook' });
      }
    },
  );

  // ── GET /webhooks/:id/deliveries ───────────────────────────────────────
  fastify.get(
    '/webhooks/:id/deliveries',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const partyId = request.user!.partyId;
      const { id } = request.params as { id: string };
      const query = request.query as { page?: string; limit?: string };

      const page = Math.max(1, parseInt(query.page ?? '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
      const offset = (page - 1) * limit;

      const db = getDb();
      if (!db) return reply.status(503).send({ error: 'Database unavailable' });

      try {
        // Verify ownership
        const webhook = await db
          .select({ id: schema.webhookEndpoints.id })
          .from(schema.webhookEndpoints)
          .where(
            and(
              eq(schema.webhookEndpoints.id, id),
              eq(schema.webhookEndpoints.partyId, partyId),
            ),
          )
          .limit(1);

        if (webhook.length === 0) {
          return reply.status(404).send({ error: 'Webhook not found' });
        }

        const deliveryCountResult = await db
          .select({ total: count() })
          .from(schema.webhookDeliveryLog)
          .where(eq(schema.webhookDeliveryLog.webhookEndpointId, id));
        const total = deliveryCountResult[0]?.total ?? 0;

        const rows = await db
          .select()
          .from(schema.webhookDeliveryLog)
          .where(eq(schema.webhookDeliveryLog.webhookEndpointId, id))
          .orderBy(desc(schema.webhookDeliveryLog.deliveredAt))
          .limit(limit)
          .offset(offset);

        const data = rows.map((r) => ({
          id: r.id,
          notificationId: r.notificationId,
          httpStatus: r.httpStatus,
          attempt: r.attempt,
          success: r.success,
          error: r.error,
          deliveredAt: r.deliveredAt.toISOString(),
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
        log.error({ err, id }, 'Failed to fetch delivery logs');
        return reply.status(500).send({ error: 'Failed to fetch delivery logs' });
      }
    },
  );
}
