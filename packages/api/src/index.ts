/**
 * Dualis Finance API — Main server bootstrap.
 *
 * The server starts successfully even when Canton, PostgreSQL, or Redis
 * are unavailable (mock / degraded mode).
 */
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import compress from '@fastify/compress';
import websocket from '@fastify/websocket';
import cookie from '@fastify/cookie';
import csrfProtection from '@fastify/csrf-protection';
import { nanoid } from 'nanoid';

import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { globalErrorHandler } from './middleware/errorHandler.js';
import { metricsOnRequest, metricsOnResponse, metricsRoute } from './middleware/metrics.js';
import { closeDb } from './db/client.js';
import { closeRedis } from './cache/redis.js';
import { isBanned, recordRateLimitViolation } from './security/ban.js';

// Route modules
import { healthRoutes } from './routes/health.js';
import { poolRoutes } from './routes/pools.js';
import { borrowRoutes } from './routes/borrow.js';
import { secLendingRoutes } from './routes/secLending.js';
import { creditRoutes } from './routes/credit.js';
import { oracleRoutes } from './routes/oracle.js';
import { governanceRoutes } from './routes/governance.js';
import { flashLoanRoutes } from './routes/flashLoan.js';
import { stakingRoutes } from './routes/staking.js';
import { analyticsRoutes } from './routes/analytics.js';
import { adminRoutes } from './routes/admin.js';

// Innovation route modules
import { attestationRoutes } from './routes/attestation.js';
import { productiveRoutes } from './routes/productive.js';
import { advancedSecLendingRoutes } from './routes/advancedSecLending.js';
import { institutionalRoutes } from './routes/institutional.js';
import { privacyRoutes } from './routes/privacy.js';

// Auth & Onboarding routes
import { authRoutes } from './routes/auth.js';
import { onboardingRoutes } from './routes/onboarding.js';

// Wallet routes
import { walletRoutes } from './routes/wallet.js';

// Notification routes (MP20)
import { notificationRoutes } from './routes/notifications.js';
import { notificationPreferenceRoutes } from './routes/notification-preferences.js';
import { webhookRoutes } from './routes/webhooks.js';

// Notification workers & queues (MP20)
import { initNotificationQueues, closeNotificationQueues } from './notification/queue.js';
import { startEmailWorker, stopEmailWorker } from './notification/workers/email.worker.js';
import { startWebhookWorker, stopWebhookWorker } from './notification/workers/webhook.worker.js';
import { startDigestWorker, stopDigestWorker } from './notification/workers/digest.worker.js';
import { startCleanupWorker, stopCleanupWorker } from './notification/workers/cleanup.worker.js';

// Notification event sources (MP20) — side-effect imports register scheduled jobs
import './notification/sources/rateChangeMonitor.js';
import './notification/sources/documentExpiryChecker.js';

// Admin panel routes
import { adminDashboardRoutes } from './routes/admin-dashboard.js';
import { adminPoolRoutes } from './routes/admin-pools.js';
import { adminUserRoutes } from './routes/admin-users.js';
import { adminOracleRoutes } from './routes/admin-oracle.js';
import { adminComplianceRoutes } from './routes/admin-compliance.js';
import { adminReportsRoutes } from './routes/admin-reports.js';
import { adminSettingsRoutes } from './routes/admin-settings.js';
import { adminAuditRoutes } from './routes/admin-audit.js';

// Compliance routes (MP21 KYC/AML)
import { complianceKYCRoutes } from './routes/compliance-kyc.js';
import { complianceWebhookRoutes } from './routes/compliance-webhook.js';
import complianceAMLRoutes from './routes/compliance-aml.js';
import complianceGDPRRoutes from './routes/compliance-gdpr.js';
import complianceAuditRoutes from './routes/compliance-audit-routes.js';
import adminComplianceKYCRoutes from './routes/admin-compliance-kyc.js';
import adminComplianceGDPRRoutes from './routes/admin-compliance-gdpr.js';

// Analytics & Reporting routes (MP24)
import { analyticsPublicRoutes } from './routes/analyticsPublic.js';
import { analyticsInstitutionalRoutes } from './routes/analyticsInstitutional.js';
import { analyticsAdminRoutes } from './routes/analyticsAdmin.js';

// Compliance queues & workers (MP21)
import { initComplianceQueues, closeComplianceQueues } from './compliance/queue.js';
import { startWalletScreeningWorker, stopWalletScreeningWorker } from './compliance/workers/wallet-screening.worker.js';
import { startSanctionsScreeningWorker, stopSanctionsScreeningWorker } from './compliance/workers/sanctions-screening.worker.js';
import { startPeriodicScreeningWorker, stopPeriodicScreeningWorker } from './compliance/workers/periodic-screening.worker.js';
import { startComplianceCleanupWorker, stopComplianceCleanupWorker } from './compliance/workers/compliance-cleanup.worker.js';

// WebSocket
import { wsRoutes } from './ws/server.js';

// Background jobs
import { initScheduler, stopScheduler } from './jobs/index.js';

// Oracle shutdown
import { shutdownOracle } from './jobs/oracleUpdate.job.js';

// Canton bootstrap
import { initializeCanton } from './canton/startup.js';
import { loadFromCanton as loadPoolsFromCanton } from './services/poolRegistry.js';

// Sentry error tracking
import { initSentry, closeSentry } from './middleware/sentry.js';

// ---------------------------------------------------------------------------
// Main bootstrap function
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // ---------------------------------------------------------------------------
  // Initialize Sentry (must be before other middleware)
  // ---------------------------------------------------------------------------

  await initSentry();

  // ---------------------------------------------------------------------------
  // Build Fastify server
  // ---------------------------------------------------------------------------

  const server = Fastify({
    logger: false, // we use our own pino logger
    genReqId: () => nanoid(),
    trustProxy: true,
    bodyLimit: env.BODY_SIZE_LIMIT_BYTES,
  });

  // ---------------------------------------------------------------------------
  // Register plugins
  // ---------------------------------------------------------------------------

  const allowedOrigins = env.CORS_ORIGIN.split(',').map(s => s.trim());
  await server.register(cors, {
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, webhooks, health probes)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-CSRF-Token', 'X-Request-ID'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'X-Request-ID', 'Retry-After'],
    maxAge: 86400,
  });

  await server.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://static.sumsub.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://static.sumsub.com'],
        imgSrc: ["'self'", 'data:', 'https://static.sumsub.com'],
        connectSrc: ["'self'", ...env.CORS_ORIGIN.split(',').map(s => s.trim()), 'https://api.sumsub.com', 'wss:'],
        frameSrc: ['https://static.sumsub.com'],
        fontSrc: ["'self'", 'https://static.sumsub.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginEmbedderPolicy: false, // Required for Sumsub KYC iframe
    dnsPrefetchControl: { allow: false },
    permittedCrossDomainPolicies: false,
  });

  await server.register(compress);
  await server.register(websocket);

  // Cookie plugin (required for CSRF)
  await server.register(cookie, {
    secret: env.COOKIE_SECRET,
  });

  // CSRF protection (opt-in via CSRF_ENABLED env var for gradual rollout)
  if (env.CSRF_ENABLED) {
    await server.register(csrfProtection, {
      sessionPlugin: '@fastify/cookie',
      cookieOpts: {
        signed: true,
        httpOnly: true,
        sameSite: 'strict',
        secure: env.NODE_ENV === 'production',
        path: '/',
      },
      getToken: (request) => request.headers['x-csrf-token'] as string,
    });
  }

  // Try to register rate limiting (requires Redis for distributed limiting,
  // but also works in-memory for single-instance setups).
  try {
    await server.register(rateLimit, {
      max: env.RATE_LIMIT_MAX,
      timeWindow: env.RATE_LIMIT_WINDOW_MS,
      allowList: (req) => {
        // Skip rate limiting for health/metrics endpoints
        const url = req.url ?? '';
        return url.startsWith('/health') || url === '/metrics';
      },
      onExceeded: async (req) => {
        try {
          await recordRateLimitViolation(req.ip);
        } catch {
          // fire-and-forget
        }
      },
      keyGenerator: (req) => req.ip,
    });
  } catch {
    logger.warn('Rate limiting disabled — Redis not available');
  }

  // Ban check: reject requests from banned IPs before any processing
  server.addHook('onRequest', async (request, reply) => {
    if (await isBanned(request.ip)) {
      return reply.status(403).send({
        error: {
          code: 'BANNED',
          message: 'Temporarily banned due to excessive requests',
          requestId: request.id,
        },
      });
    }
  });

  // ---------------------------------------------------------------------------
  // Global error handler
  // ---------------------------------------------------------------------------

  server.setErrorHandler(globalErrorHandler);

  // ---------------------------------------------------------------------------
  // Request lifecycle hooks
  // ---------------------------------------------------------------------------

  // Prometheus metrics hooks
  server.addHook('onRequest', metricsOnRequest);
  server.addHook('onResponse', metricsOnResponse);

  // Security: return X-Request-ID and Cache-Control on all responses
  server.addHook('onSend', (req, reply, _payload, done) => {
    reply.header('X-Request-ID', req.id);
    // Prevent caching of API responses containing sensitive data
    if (!reply.getHeader('Cache-Control')) {
      reply.header('Cache-Control', 'no-store');
      reply.header('Pragma', 'no-cache');
    }
    done();
  });

  // Request logging
  server.addHook('onRequest', (req, _reply, done) => {
    logger.info({ method: req.method, url: req.url, id: req.id }, 'incoming request');
    done();
  });

  server.addHook('onResponse', (req, reply, done) => {
    logger.info(
      { method: req.method, url: req.url, status: reply.statusCode, id: req.id },
      'request complete',
    );
    done();
  });

  // ---------------------------------------------------------------------------
  // Health routes (no prefix)
  // ---------------------------------------------------------------------------

  await server.register(healthRoutes);

  // ---------------------------------------------------------------------------
  // Metrics endpoint
  // ---------------------------------------------------------------------------

  server.get('/metrics', metricsRoute);

  // ---------------------------------------------------------------------------
  // API v1 routes
  // ---------------------------------------------------------------------------

  await server.register(async (app) => {
    await app.register(poolRoutes);
    await app.register(borrowRoutes);
    await app.register(secLendingRoutes);
    await app.register(creditRoutes);
    await app.register(oracleRoutes);
    await app.register(governanceRoutes);
    await app.register(flashLoanRoutes);
    await app.register(stakingRoutes);
    await app.register(analyticsRoutes);
    await app.register(adminRoutes);

    // Auth & Onboarding routes
    await app.register(authRoutes);
    await app.register(onboardingRoutes);

    // Wallet routes
    await app.register(walletRoutes);

    // Notification routes (MP20)
    await app.register(notificationRoutes);
    await app.register(notificationPreferenceRoutes);
    await app.register(webhookRoutes);

    // Compliance routes (MP21 KYC/AML)
    await app.register(complianceKYCRoutes);
    await app.register(complianceWebhookRoutes);
    await app.register(complianceAMLRoutes);
    await app.register(complianceGDPRRoutes);
    await app.register(complianceAuditRoutes);
    await app.register(adminComplianceKYCRoutes);
    await app.register(adminComplianceGDPRRoutes);

    // Innovation routes
    await app.register(attestationRoutes);
    await app.register(productiveRoutes);
    await app.register(advancedSecLendingRoutes);
    await app.register(institutionalRoutes);
    await app.register(privacyRoutes);

    // Admin panel routes
    await app.register(adminDashboardRoutes);
    await app.register(adminPoolRoutes);
    await app.register(adminUserRoutes);
    await app.register(adminOracleRoutes);
    await app.register(adminComplianceRoutes);
    await app.register(adminReportsRoutes);
    await app.register(adminSettingsRoutes);
    await app.register(adminAuditRoutes);

    // Analytics & Reporting (MP24)
    await app.register(analyticsPublicRoutes);
    await app.register(analyticsInstitutionalRoutes);
    await app.register(analyticsAdminRoutes);
  }, { prefix: '/v1' });

  // ---------------------------------------------------------------------------
  // WebSocket routes
  // ---------------------------------------------------------------------------

  await server.register(wsRoutes);

  // ---------------------------------------------------------------------------
  // Graceful shutdown
  // ---------------------------------------------------------------------------

  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
  for (const signal of signals) {
    process.on(signal, async () => {
      logger.info(`${signal} received, shutting down`);
      stopScheduler();
      await shutdownOracle();
      // MP20: Stop notification workers & queues
      await stopEmailWorker();
      await stopWebhookWorker();
      await stopDigestWorker();
      await stopCleanupWorker();
      await closeNotificationQueues();
      // MP21: Stop compliance workers & queues
      await stopWalletScreeningWorker();
      await stopSanctionsScreeningWorker();
      await stopPeriodicScreeningWorker();
      await stopComplianceCleanupWorker();
      await closeComplianceQueues();
      await server.close();
      await closeDb();
      await closeRedis();
      await closeSentry();
      process.exit(0);
    });
  }

  // ---------------------------------------------------------------------------
  // Start server
  // ---------------------------------------------------------------------------

  try {
    await server.listen({ port: env.PORT, host: '0.0.0.0' });
    logger.info(`Server started on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info({
      cantonEnv: env.CANTON_ENV,
      cantonMock: env.CANTON_MOCK,
      features: {
        flashLoans: env.FEATURE_FLASH_LOANS,
        secLending: env.FEATURE_SEC_LENDING,
        governance: env.FEATURE_GOVERNANCE,
      },
    }, 'Feature flags');

    // Initialize Canton integration layer
    try {
      const cantonResult = await initializeCanton();
      logger.info(
        {
          env: cantonResult.config.environment,
          healthy: cantonResult.healthy,
          parties: cantonResult.partyResult.allFound ? 'ok' : 'incomplete',
          bridge: cantonResult.config.tokenBridgeMode,
        },
        'Canton integration initialized',
      );

      // When not in mock mode, load pool data from Canton ledger
      if (!env.CANTON_MOCK) {
        try {
          const poolCount = await loadPoolsFromCanton();
          logger.info({ poolCount }, 'Pool registry loaded from Canton ledger');
        } catch (poolErr) {
          logger.warn({ err: poolErr }, 'Failed to load pools from Canton — using fallback mock data');
        }
      }
    } catch (cantonErr) {
      logger.warn({ err: cantonErr }, 'Canton bootstrap failed — running in degraded mode');
    }

    // Initialize background jobs if in non-test mode
    if (env.NODE_ENV !== 'test') {
      initScheduler();

      // MP20: Initialize notification queues & workers
      try {
        initNotificationQueues();
        startEmailWorker();
        startWebhookWorker();
        startDigestWorker();
        startCleanupWorker();
        logger.info('Notification workers started');
      } catch (notifErr) {
        logger.warn({ err: notifErr }, 'Notification workers failed to start — notifications may be delayed');
      }

      // MP21: Initialize compliance queues & workers
      try {
        initComplianceQueues();
        startWalletScreeningWorker();
        startSanctionsScreeningWorker();
        startPeriodicScreeningWorker();
        startComplianceCleanupWorker();
        logger.info('Compliance workers started');
      } catch (compErr) {
        logger.warn({ err: compErr }, 'Compliance workers failed to start — screening may be delayed');
      }
    }
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

main().catch((err) => {
  logger.error({ err }, 'Unhandled error during bootstrap');
  process.exit(1);
});
