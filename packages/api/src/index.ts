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
import { nanoid } from 'nanoid';

import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { globalErrorHandler } from './middleware/errorHandler.js';
import { metricsOnRequest, metricsOnResponse, metricsRoute } from './middleware/metrics.js';
import { closeDb } from './db/client.js';
import { closeRedis } from './cache/redis.js';

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

// WebSocket
import { wsRoutes } from './ws/server.js';

// Background jobs
import { initScheduler, stopScheduler } from './jobs/index.js';

// Canton bootstrap
import { initializeCanton } from './canton/startup.js';

// ---------------------------------------------------------------------------
// Main bootstrap function
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // ---------------------------------------------------------------------------
  // Build Fastify server
  // ---------------------------------------------------------------------------

  const server = Fastify({
    logger: false, // we use our own pino logger
    genReqId: () => nanoid(),
    trustProxy: true,
  });

  // ---------------------------------------------------------------------------
  // Register plugins
  // ---------------------------------------------------------------------------

  await server.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  await server.register(helmet, {
    contentSecurityPolicy: false,
  });

  await server.register(compress);
  await server.register(websocket);

  // Try to register rate limiting (requires Redis for distributed limiting,
  // but also works in-memory for single-instance setups).
  try {
    await server.register(rateLimit, {
      max: env.RATE_LIMIT_MAX,
      timeWindow: env.RATE_LIMIT_WINDOW_MS,
    });
  } catch {
    logger.warn('Rate limiting disabled — Redis not available');
  }

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

    // Innovation routes
    await app.register(attestationRoutes);
    await app.register(productiveRoutes);
    await app.register(advancedSecLendingRoutes);
    await app.register(institutionalRoutes);
    await app.register(privacyRoutes);
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
      await server.close();
      await closeDb();
      await closeRedis();
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
    } catch (cantonErr) {
      logger.warn({ err: cantonErr }, 'Canton bootstrap failed — running in degraded mode');
    }

    // Initialize background jobs if in non-test mode
    if (env.NODE_ENV !== 'test') {
      initScheduler();
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
