import { createHmac } from 'crypto';
import { nanoid } from 'nanoid';
import { eq, sql } from 'drizzle-orm';
import { createChildLogger } from '../../config/logger.js';
import { env } from '../../config/env.js';
import { getDb } from '../../db/client.js';
import * as schema from '../../db/schema.js';

const log = createChildLogger('webhook-channel');

// ---------------------------------------------------------------------------
// HMAC signing
// ---------------------------------------------------------------------------

function signPayload(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

// ---------------------------------------------------------------------------
// Webhook delivery
// ---------------------------------------------------------------------------

export interface WebhookDeliveryResult {
  success: boolean;
  httpStatus?: number;
  error?: string;
}

export async function deliver(
  notificationId: string,
  webhookEndpointId: string,
  url: string,
  secret: string,
  payload: Record<string, unknown>,
  attempt: number = 1,
): Promise<WebhookDeliveryResult> {
  const body = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signPayload(secret, body);

  const timeoutMs = env.NOTIFICATION_WEBHOOK_TIMEOUT_MS;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Dualis-Signature': `sha256=${signature}`,
        'X-Dualis-Timestamp': String(timestamp),
        'User-Agent': 'Dualis-Webhook/1.0',
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseBody = await response.text().catch(() => '');
    const truncatedBody = responseBody.slice(0, 500);
    const success = response.ok; // 2xx

    // Log delivery
    await logDelivery(
      webhookEndpointId,
      notificationId,
      response.status,
      truncatedBody,
      attempt,
      success,
    );

    if (success) {
      // Reset failure count on success
      await resetFailureCount(webhookEndpointId);
      log.info({ webhookEndpointId, notificationId, status: response.status }, 'Webhook delivered');
    } else {
      await incrementFailureCount(webhookEndpointId);
      log.warn({ webhookEndpointId, notificationId, status: response.status }, 'Webhook delivery non-2xx');
    }

    return { success, httpStatus: response.status };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    await logDelivery(webhookEndpointId, notificationId, null, null, attempt, false, errorMsg);
    await incrementFailureCount(webhookEndpointId);

    log.error({ err, webhookEndpointId, url, attempt }, 'Webhook delivery failed');
    return { success: false, error: errorMsg };
  }
}

// ---------------------------------------------------------------------------
// Failure count & circuit breaker
// ---------------------------------------------------------------------------

const MAX_CONSECUTIVE_FAILURES = 10;

async function incrementFailureCount(webhookEndpointId: string): Promise<void> {
  const db = getDb();
  if (!db) return;

  try {
    const result = await db
      .update(schema.webhookEndpoints)
      .set({
        failureCount: sql`${schema.webhookEndpoints.failureCount} + 1`,
      })
      .where(eq(schema.webhookEndpoints.id, webhookEndpointId))
      .returning({ failureCount: schema.webhookEndpoints.failureCount });

    if (result.length > 0 && (result[0]?.failureCount ?? 0) >= MAX_CONSECUTIVE_FAILURES) {
      // Auto-deactivate
      await db
        .update(schema.webhookEndpoints)
        .set({ isActive: false })
        .where(eq(schema.webhookEndpoints.id, webhookEndpointId));

      log.warn(
        { webhookEndpointId, failureCount: result[0]?.failureCount },
        'Webhook endpoint deactivated after consecutive failures',
      );
    }
  } catch (err) {
    log.warn({ err, webhookEndpointId }, 'Failed to update failure count');
  }
}

async function resetFailureCount(webhookEndpointId: string): Promise<void> {
  const db = getDb();
  if (!db) return;

  try {
    await db
      .update(schema.webhookEndpoints)
      .set({ failureCount: 0, lastDeliveryAt: new Date() })
      .where(eq(schema.webhookEndpoints.id, webhookEndpointId));
  } catch (err) {
    log.warn({ err, webhookEndpointId }, 'Failed to reset failure count');
  }
}

// ---------------------------------------------------------------------------
// Delivery log
// ---------------------------------------------------------------------------

async function logDelivery(
  webhookEndpointId: string,
  notificationId: string,
  httpStatus: number | null,
  responseBody: string | null,
  attempt: number,
  success: boolean,
  error?: string,
): Promise<void> {
  const db = getDb();
  if (!db) return;

  try {
    await db.insert(schema.webhookDeliveryLog).values({
      id: `wdl_${nanoid(16)}`,
      webhookEndpointId,
      notificationId,
      httpStatus,
      responseBody,
      attempt,
      success,
      error: error ?? null,
    });
  } catch (err) {
    log.warn({ err }, 'Failed to log webhook delivery');
  }
}

// ---------------------------------------------------------------------------
// URL validation (SSRF protection)
// ---------------------------------------------------------------------------

/**
 * Check if an IPv4 address is private/reserved (SSRF protection).
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p))) return false;

  const [a, b] = parts as [number, number, number, number];

  // 127.0.0.0/8 — loopback
  if (a === 127) return true;
  // 10.0.0.0/8 — private
  if (a === 10) return true;
  // 172.16.0.0/12 — private (172.16.0.0 – 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16 — private
  if (a === 192 && b === 168) return true;
  // 169.254.0.0/16 — link-local
  if (a === 169 && b === 254) return true;
  // 0.0.0.0/8 — unspecified
  if (a === 0) return true;

  return false;
}

export function validateWebhookUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);

    // Must be HTTPS
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'Webhook URL must use HTTPS' };
    }

    // Block private/reserved hostnames and IPs
    const hostname = parsed.hostname.replace(/^\[|\]$/g, ''); // strip IPv6 brackets

    // Block well-known private hostnames
    if (
      hostname === 'localhost' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname === '[::1]' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.localhost')
    ) {
      return { valid: false, error: 'Webhook URL cannot point to internal/private addresses' };
    }

    // Block private IPv4 addresses
    if (isPrivateIPv4(hostname)) {
      return { valid: false, error: 'Webhook URL cannot point to a private IP address' };
    }

    // Block IPv6 private ranges (simplified check)
    if (hostname.startsWith('fc') || hostname.startsWith('fd') ||
        hostname.startsWith('fe80') || hostname === '::' ||
        hostname.startsWith('::ffff:127') || hostname.startsWith('::ffff:10.') ||
        hostname.startsWith('::ffff:192.168')) {
      return { valid: false, error: 'Webhook URL cannot point to a private IPv6 address' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Generate a cryptographically secure webhook secret.
 */
export function generateWebhookSecret(): string {
  return `whsec_${nanoid(32)}`;
}
