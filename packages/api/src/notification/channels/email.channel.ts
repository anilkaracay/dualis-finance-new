import { Resend } from 'resend';
import { nanoid } from 'nanoid';
import { createChildLogger } from '../../config/logger.js';
import { env } from '../../config/env.js';
import { getDb } from '../../db/client.js';
import * as schema from '../../db/schema.js';

// Template imports
import { render as renderHealthFactor } from '../templates/healthFactorWarning.js';
import { render as renderLiquidation } from '../templates/liquidationExecuted.js';
import { render as renderKyb } from '../templates/kybStatus.js';
import { render as renderDocExpiry } from '../templates/documentExpiry.js';
import { render as renderNewLogin } from '../templates/newLogin.js';
import { render as renderRateChange } from '../templates/rateChange.js';
import { render as renderProtocolPaused } from '../templates/protocolPaused.js';
import { render as renderDigest } from '../templates/digest.js';
import { render as renderWelcome } from '../templates/welcome.js';

const log = createChildLogger('email-channel');

// ---------------------------------------------------------------------------
// Resend client (null if API key not configured)
// ---------------------------------------------------------------------------

let resendClient: Resend | null = null;

if (env.RESEND_API_KEY) {
  resendClient = new Resend(env.RESEND_API_KEY);
  log.info('Resend email client initialized');
} else {
  log.info('RESEND_API_KEY not set — email channel disabled');
}

// ---------------------------------------------------------------------------
// Template registry
// ---------------------------------------------------------------------------

const templates: Record<string, (data: Record<string, unknown>) => { subject: string; html: string; text: string }> = {
  'health-factor-warning': renderHealthFactor as never,
  'liquidation-executed': renderLiquidation as never,
  'kyb-status': renderKyb as never,
  'document-expiry': renderDocExpiry as never,
  'new-login': renderNewLogin as never,
  'rate-change': renderRateChange as never,
  'protocol-paused': renderProtocolPaused as never,
  'digest': renderDigest as never,
  'welcome': renderWelcome as never,
};

// ---------------------------------------------------------------------------
// Email delivery
// ---------------------------------------------------------------------------

export interface EmailDeliveryResult {
  success: boolean;
  resendId?: string;
  error?: string;
}

export async function deliver(
  notificationId: string,
  partyId: string,
  toAddress: string,
  templateId: string,
  templateData: Record<string, unknown>,
): Promise<EmailDeliveryResult> {
  // Dry run mode
  if (env.RESEND_DRY_RUN || !resendClient) {
    const template = templates[templateId];
    if (template) {
      const rendered = template(templateData);
      log.info(
        { notificationId, partyId, toAddress, templateId, subject: rendered.subject, dryRun: true },
        'Email delivery (dry run)',
      );
    } else {
      log.info({ notificationId, templateId, dryRun: true }, 'Email delivery (dry run, unknown template)');
    }
    return { success: true };
  }

  // Render template
  const template = templates[templateId];
  if (!template) {
    log.warn({ templateId }, 'Unknown email template');
    return { success: false, error: `Unknown template: ${templateId}` };
  }

  const rendered = template(templateData);

  try {
    const result = await resendClient.emails.send({
      from: `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_ADDRESS}>`,
      to: [toAddress],
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

    const resendId = result.data?.id ?? '';

    // Log to DB
    await logDelivery(notificationId, partyId, toAddress, templateId, 'sent', resendId);

    log.info({ notificationId, partyId, toAddress, templateId, resendId }, 'Email sent');
    return { success: true, resendId };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    // Log failure to DB
    await logDelivery(notificationId, partyId, toAddress, templateId, 'failed', undefined, errorMsg);

    log.error({ err, notificationId, toAddress, templateId }, 'Email delivery failed');
    return { success: false, error: errorMsg };
  }
}

// ---------------------------------------------------------------------------
// Delivery log
// ---------------------------------------------------------------------------

async function logDelivery(
  notificationId: string,
  partyId: string,
  toAddress: string,
  templateId: string,
  status: string,
  resendId?: string,
  error?: string,
): Promise<void> {
  const db = getDb();
  if (!db) return;

  try {
    await db.insert(schema.emailDeliveryLog).values({
      id: `edl_${nanoid(16)}`,
      notificationId,
      partyId,
      toAddress,
      templateId,
      resendId: resendId ?? null,
      status,
      error: error ?? null,
    });
  } catch (err) {
    log.warn({ err }, 'Failed to log email delivery');
  }
}

export function isEmailEnabled(): boolean {
  return !!(env.RESEND_API_KEY && !env.RESEND_DRY_RUN);
}
