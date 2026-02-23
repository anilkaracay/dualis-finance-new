/**
 * Structured security event logging (MP22).
 *
 * All security events are logged via Pino at `warn` level for easy filtering
 * and forwarding to SIEM systems.
 */

import { createChildLogger } from '../config/logger.js';

const log = createChildLogger('security');

export type SecurityEventType =
  | 'login_failed'
  | 'brute_force_lockout'
  | 'rate_limit_exceeded'
  | 'ip_banned'
  | 'token_reuse_detected'
  | 'session_revoked'
  | 'all_sessions_revoked'
  | 'csrf_failure'
  | 'ssrf_attempt'
  | 'webhook_signature_failure'
  | 'password_changed'
  | 'suspicious_activity';

export interface SecurityEvent {
  type: SecurityEventType;
  ip?: string;
  userId?: string;
  email?: string;
  requestId?: string;
  details?: Record<string, unknown>;
}

/**
 * Log a structured security event.
 * All events are logged at `warn` level with a consistent format
 * for easy filtering and alerting.
 */
export function logSecurityEvent(event: SecurityEvent): void {
  log.warn(
    {
      securityEvent: event.type,
      ip: event.ip,
      userId: event.userId,
      email: event.email,
      requestId: event.requestId,
      ...event.details,
    },
    `SECURITY: ${event.type}`,
  );
}
