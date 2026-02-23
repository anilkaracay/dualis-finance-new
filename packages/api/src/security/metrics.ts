/**
 * Security-specific Prometheus metrics (MP22).
 *
 * These counters track security events for monitoring and alerting
 * via Grafana dashboards.
 */

import client from 'prom-client';

export const securityMetrics = {
  failedLogins: new client.Counter({
    name: 'security_failed_logins_total',
    help: 'Total failed login attempts',
    labelNames: ['reason'] as const,
  }),

  bruteForceBlocks: new client.Counter({
    name: 'security_brute_force_blocks_total',
    help: 'Total brute force lockout events',
  }),

  rateLimitHits: new client.Counter({
    name: 'security_rate_limit_hits_total',
    help: 'Total rate limit exceeded events',
    labelNames: ['endpoint'] as const,
  }),

  ipBans: new client.Counter({
    name: 'security_ip_bans_total',
    help: 'Total IP bans issued',
  }),

  tokenReuseDetections: new client.Counter({
    name: 'security_token_reuse_detected_total',
    help: 'Total refresh token reuse detections (potential session hijack)',
  }),

  csrfFailures: new client.Counter({
    name: 'security_csrf_failures_total',
    help: 'Total CSRF validation failures',
  }),

  sessionsRevoked: new client.Counter({
    name: 'security_sessions_revoked_total',
    help: 'Total sessions revoked',
    labelNames: ['trigger'] as const,
  }),

  webhookSignatureFailures: new client.Counter({
    name: 'security_webhook_signature_failures_total',
    help: 'Total webhook signature verification failures',
    labelNames: ['provider'] as const,
  }),

  bannedIpRequests: new client.Counter({
    name: 'security_banned_ip_requests_total',
    help: 'Total requests from banned IPs',
  }),

  ssrfAttempts: new client.Counter({
    name: 'security_ssrf_attempts_total',
    help: 'Total SSRF-blocked webhook URL registrations',
  }),
};
