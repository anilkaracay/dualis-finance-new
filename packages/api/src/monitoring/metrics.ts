import { Counter, Histogram, Gauge, Registry } from 'prom-client';

export const registry = new Registry();

// Business metrics
export const tvlGauge = new Gauge({ name: 'dualis_tvl_usd', help: 'Total Value Locked in USD', registers: [registry] });
export const utilizationGauge = new Gauge({ name: 'dualis_utilization_ratio', help: 'Pool utilization ratio', labelNames: ['pool_id'], registers: [registry] });
export const activeLoansGauge = new Gauge({ name: 'dualis_active_loans', help: 'Number of active loans', registers: [registry] });
export const liquidationsCounter = new Counter({ name: 'dualis_liquidations_total', help: 'Total liquidations', labelNames: ['tier'], registers: [registry] });

// HTTP metrics
export const httpDuration = new Histogram({ name: 'http_request_duration_seconds', help: 'HTTP request duration', labelNames: ['method', 'route', 'status'], buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5], registers: [registry] });
export const httpTotal = new Counter({ name: 'http_requests_total', help: 'Total HTTP requests', labelNames: ['method', 'route', 'status'], registers: [registry] });

// Canton metrics
export const cantonLatency = new Histogram({ name: 'canton_request_duration_seconds', help: 'Canton API latency', labelNames: ['method'], buckets: [0.05, 0.1, 0.5, 1, 2, 5, 10], registers: [registry] });

// DB metrics
export const dbQueryDuration = new Histogram({ name: 'db_query_duration_seconds', help: 'Database query duration', labelNames: ['query'], buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5], registers: [registry] });

// Cache metrics
export const cacheHitRate = new Counter({ name: 'cache_hits_total', help: 'Cache hits', labelNames: ['key_type'], registers: [registry] });
export const cacheMissRate = new Counter({ name: 'cache_misses_total', help: 'Cache misses', labelNames: ['key_type'], registers: [registry] });

// WebSocket metrics
export const wsConnections = new Gauge({ name: 'ws_active_connections', help: 'Active WebSocket connections', registers: [registry] });

// Job metrics
export const jobDuration = new Histogram({ name: 'job_duration_seconds', help: 'Background job duration', labelNames: ['job_name'], registers: [registry] });
