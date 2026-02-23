import type { FastifyInstance } from 'fastify';
import os from 'node:os';
import { env } from '../config/env.js';
import { createChildLogger } from '../config/logger.js';
import { getDb } from '../db/client.js';
import { getRedis } from '../cache/redis.js';
import { sql } from 'drizzle-orm';

const log = createChildLogger('health-routes');

const startTime = Date.now();

const APP_VERSION = process.env.npm_package_version || '0.1.0';

interface DependencyStatus {
  status: 'up' | 'down' | 'not_configured' | 'mock_mode';
  latency?: number;
  error?: string;
}

async function checkPostgres(): Promise<DependencyStatus> {
  const db = getDb();
  if (!db) return { status: 'down', error: 'No database connection' };
  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    return { status: 'up', latency: Date.now() - start };
  } catch (err) {
    return { status: 'down', error: (err as Error).message };
  }
}

async function checkRedis(): Promise<DependencyStatus> {
  const redis = getRedis();
  if (!redis) return { status: 'down', error: 'No Redis connection' };
  try {
    const start = Date.now();
    await redis.ping();
    return { status: 'up', latency: Date.now() - start };
  } catch (err) {
    return { status: 'down', error: (err as Error).message };
  }
}

async function checkCanton(): Promise<DependencyStatus> {
  if (env.CANTON_MOCK) return { status: 'mock_mode' };
  try {
    const start = Date.now();
    const res = await fetch(`${env.CANTON_JSON_API_URL}/v1/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(5000),
    });
    // 400 is acceptable — means Canton is responding
    if (res.ok || res.status === 400) {
      return { status: 'up', latency: Date.now() - start };
    }
    return { status: 'down', error: `HTTP ${res.status}` };
  } catch (err) {
    return { status: 'down', error: (err as Error).message };
  }
}

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  // ── GET /health — Liveness probe (fast, no DB queries) ──
  fastify.get('/health', async (_request, reply) => {
    log.debug('Health check requested');

    return reply.status(200).send({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: APP_VERSION,
      uptime: Math.floor((Date.now() - startTime) / 1000),
    });
  });

  // ── GET /health/ready — Readiness probe (checks dependencies) ──
  fastify.get('/health/ready', async (_request, reply) => {
    log.debug('Readiness check requested');

    const [postgres, redis, canton] = await Promise.all([
      checkPostgres(),
      checkRedis(),
      checkCanton(),
    ]);

    const dependencies = { postgres, redis, canton };

    const coreUp = postgres.status === 'up' && redis.status === 'up';
    const cantonDown = canton.status === 'down';

    let overallStatus: 'ready' | 'degraded' | 'not_ready';
    let statusCode: number;

    if (!coreUp) {
      overallStatus = 'not_ready';
      statusCode = 503;
    } else if (cantonDown) {
      overallStatus = 'degraded';
      statusCode = 200;
    } else {
      overallStatus = 'ready';
      statusCode = 200;
    }

    return reply.status(statusCode).send({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      dependencies,
    });
  });

  // ── GET /health/detailed — Admin diagnostics ──
  fastify.get('/health/detailed', async (_request, reply) => {
    log.debug('Detailed health check requested');

    const [postgres, redis, canton] = await Promise.all([
      checkPostgres(),
      checkRedis(),
      checkCanton(),
    ]);

    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();
    const loadAvg = os.loadavg();

    return reply.status(200).send({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: APP_VERSION,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      node: process.version,
      deployTimestamp: process.env.DEPLOY_TIMESTAMP || null,

      dependencies: { postgres, redis, canton },

      memory: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        external: Math.round(mem.external / 1024 / 1024),
      },

      cpu: {
        user: cpu.user,
        system: cpu.system,
      },

      os: {
        loadAvg: {
          '1m': loadAvg[0],
          '5m': loadAvg[1],
          '15m': loadAvg[2],
        },
        freeMemMB: Math.round(os.freemem() / 1024 / 1024),
        totalMemMB: Math.round(os.totalmem() / 1024 / 1024),
      },
    });
  });
}
