import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ApiResponse } from '@dualis/shared';
import { requireAdminViewer } from '../middleware/admin-auth.js';

// ---------------------------------------------------------------------------
// Mock oracle data
// ---------------------------------------------------------------------------

const MOCK_FEEDS = [
  { asset: 'USDC', price: 1.0001, change24h: 0.0001, sources: 4, confidence: 0.9999, twap: 1.0000, deviation: 0.0001, lastUpdate: new Date(Date.now() - 30000).toISOString(), staleness: 30, cbStatus: 'ok' as const },
  { asset: 'wBTC', price: 43250.50, change24h: 0.024, sources: 5, confidence: 0.998, twap: 43100.00, deviation: 0.003, lastUpdate: new Date(Date.now() - 45000).toISOString(), staleness: 45, cbStatus: 'ok' as const },
  { asset: 'ETH', price: 2280.75, change24h: -0.012, sources: 5, confidence: 0.997, twap: 2290.00, deviation: 0.004, lastUpdate: new Date(Date.now() - 30000).toISOString(), staleness: 30, cbStatus: 'ok' as const },
  { asset: 'T-BILL', price: 99.85, change24h: 0.0002, sources: 2, confidence: 0.995, twap: 99.84, deviation: 0.0001, lastUpdate: new Date(Date.now() - 120000).toISOString(), staleness: 120, cbStatus: 'ok' as const },
  { asset: 'CC', price: 1.25, change24h: -0.035, sources: 3, confidence: 0.985, twap: 1.28, deviation: 0.023, lastUpdate: new Date(Date.now() - 60000).toISOString(), staleness: 60, cbStatus: 'ok' as const },
  { asset: 'SPY', price: 480.25, change24h: 0.008, sources: 2, confidence: 0.992, twap: 479.50, deviation: 0.002, lastUpdate: new Date(Date.now() - 90000).toISOString(), staleness: 90, cbStatus: 'ok' as const },
  { asset: 'TIFA-REC', price: 32.50, change24h: 0.0, sources: 1, confidence: 0.90, twap: 32.50, deviation: 0.0, lastUpdate: new Date(Date.now() - 300000).toISOString(), staleness: 300, cbStatus: 'warning' as const },
];

const MOCK_ALERTS = [
  { id: 1, asset: 'TIFA-REC', severity: 'warning' as const, message: 'Price feed stale (>5min)', timestamp: new Date(Date.now() - 600000).toISOString(), resolved: false },
  { id: 2, asset: 'CC', severity: 'info' as const, message: 'High deviation detected (2.3%)', timestamp: new Date(Date.now() - 1800000).toISOString(), resolved: true },
  { id: 3, asset: 'wBTC', severity: 'critical' as const, message: 'Circuit breaker tripped — 8% price drop', timestamp: new Date(Date.now() - 86400000).toISOString(), resolved: true },
  { id: 4, asset: 'ETH', severity: 'warning' as const, message: 'Source disagreement detected', timestamp: new Date(Date.now() - 172800000).toISOString(), resolved: true },
];

const paginationSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export async function adminOracleRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /admin/oracle/feeds — all feed statuses
  fastify.get(
    '/admin/oracle/feeds',
    { preHandler: [requireAdminViewer] },
    async (_request, reply) => {
      const healthy = MOCK_FEEDS.filter((f) => f.cbStatus === 'ok').length;
      const total = MOCK_FEEDS.length;
      const overallHealth = healthy === total ? 'healthy' : healthy >= total - 1 ? 'degraded' : 'critical';

      const response: ApiResponse<{ feeds: typeof MOCK_FEEDS; overallHealth: string; healthy: number; total: number }> = {
        data: { feeds: MOCK_FEEDS, overallHealth, healthy, total },
      };
      return reply.status(200).send(response);
    },
  );

  // GET /admin/oracle/feeds/:asset/history — price history for an asset
  fastify.get(
    '/admin/oracle/feeds/:asset/history',
    { preHandler: [requireAdminViewer] },
    async (request, reply) => {
      const { asset } = request.params as { asset: string };
      const feed = MOCK_FEEDS.find((f) => f.asset === asset);
      const basePrice = feed?.price ?? 100;

      // Generate mock price history
      const points = 30;
      const history = Array.from({ length: points }, (_, i) => ({
        timestamp: new Date(Date.now() - (points - i) * 3600000).toISOString(),
        price: basePrice * (1 + (Math.random() - 0.5) * 0.02),
        twap: basePrice * (1 + (Math.random() - 0.5) * 0.01),
      }));

      const response: ApiResponse<typeof history> = { data: history };
      return reply.status(200).send(response);
    },
  );

  // GET /admin/oracle/alerts — alert history
  fastify.get(
    '/admin/oracle/alerts',
    { preHandler: [requireAdminViewer] },
    async (request, reply) => {
      const query = request.query as Record<string, string>;
      const { page, limit } = paginationSchema.parse(query);
      const { severity, asset } = query;

      let alerts = [...MOCK_ALERTS];
      if (severity) alerts = alerts.filter((a) => a.severity === severity);
      if (asset) alerts = alerts.filter((a) => a.asset === asset);

      const total = alerts.length;
      const offset = (page - 1) * limit;

      const response: ApiResponse<{ data: typeof alerts; total: number; page: number; limit: number }> = {
        data: { data: alerts.slice(offset, offset + limit), total, page, limit },
      };
      return reply.status(200).send(response);
    },
  );
}
