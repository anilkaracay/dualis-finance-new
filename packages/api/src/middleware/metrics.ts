import type { FastifyReply, FastifyRequest } from 'fastify';
import client from 'prom-client';

// ---------------------------------------------------------------------------
// Prometheus registry and default metrics
// ---------------------------------------------------------------------------

const register = new client.Registry();
client.collectDefaultMetrics({ register });

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------

/** HTTP request duration histogram (seconds). */
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

/** HTTP requests total counter. */
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [register],
});

/** Active connections gauge. */
export const activeConnections = new client.Gauge({
  name: 'http_active_connections',
  help: 'Number of active HTTP connections',
  registers: [register],
});

// ---------------------------------------------------------------------------
// Request timing symbol (attached to request for duration tracking)
// ---------------------------------------------------------------------------

const REQUEST_START_TIME = Symbol('requestStartTime');

// Augment Fastify request to carry the start time
declare module 'fastify' {
  interface FastifyRequest {
    [REQUEST_START_TIME]?: [number, number];
  }
}

// ---------------------------------------------------------------------------
// Metrics middleware hooks
// ---------------------------------------------------------------------------

/**
 * Fastify `onRequest` hook — records start time and increments active connections.
 */
export function metricsOnRequest(
  request: FastifyRequest,
  _reply: FastifyReply,
  done: () => void,
): void {
  request[REQUEST_START_TIME] = process.hrtime();
  activeConnections.inc();
  done();
}

/**
 * Fastify `onResponse` hook — records duration and decrements active connections.
 */
export function metricsOnResponse(
  request: FastifyRequest,
  reply: FastifyReply,
  done: () => void,
): void {
  const startTime = request[REQUEST_START_TIME];
  if (startTime) {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const durationSeconds = seconds + nanoseconds / 1e9;

    // Normalize route (use routeOptions.url for parameterized paths, fall back to raw url)
    const route = request.routeOptions?.url ?? request.url;
    const method = request.method;
    const statusCode = String(reply.statusCode);

    httpRequestDuration.labels(method, route, statusCode).observe(durationSeconds);
    httpRequestsTotal.labels(method, route, statusCode).inc();
  }
  activeConnections.dec();
  done();
}

// ---------------------------------------------------------------------------
// Metrics endpoint handler
// ---------------------------------------------------------------------------

/**
 * Fastify route handler for GET /metrics (Prometheus scrape endpoint).
 */
export async function metricsRoute(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const metrics = await register.metrics();
  void reply.header('Content-Type', register.contentType).send(metrics);
}
