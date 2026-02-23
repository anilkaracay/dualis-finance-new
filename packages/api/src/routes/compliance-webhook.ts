import { createHmac } from 'node:crypto';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../config/env.js';
import { createChildLogger } from '../config/logger.js';
import { processWebhookEvent } from '../compliance/services/kyc.service.js';
import type { SumsubWebhookEvent } from '@dualis/shared';

const log = createChildLogger('compliance-webhook');

function verifySignature(body: string, signature: string): boolean {
  if (!env.SUMSUB_WEBHOOK_SECRET) return true; // No verification in dev
  const expected = createHmac('sha256', env.SUMSUB_WEBHOOK_SECRET).update(body).digest('hex');
  return expected === signature;
}

async function complianceWebhookRoutesPlugin(fastify: FastifyInstance): Promise<void> {
  // Add raw body parsing for this route
  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    done(null, body);
  });

  // POST /compliance/webhooks/sumsub — NO auth middleware (public webhook)
  fastify.post(
    '/compliance/webhooks/sumsub',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const rawBody = request.body as string;
      const signature = (request.headers['x-payload-digest'] as string) ?? '';

      if (!verifySignature(rawBody, signature)) {
        log.warn('Invalid webhook signature');
        return reply.status(401).send({ error: 'Invalid signature' });
      }

      let event: SumsubWebhookEvent;
      try {
        event = JSON.parse(rawBody) as SumsubWebhookEvent;
      } catch {
        return reply.status(400).send({ error: 'Invalid JSON' });
      }

      // Process async — return 200 immediately
      processWebhookEvent(event).catch((err) => {
        log.error({ err, applicantId: event.applicantId }, 'Webhook processing failed');
      });

      return reply.status(200).send({ success: true });
    },
  );
}

export { complianceWebhookRoutesPlugin as complianceWebhookRoutes };
