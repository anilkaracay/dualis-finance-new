import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ApiResponse } from '@dualis/shared';
import { requireAdminViewer } from '../middleware/admin-auth.js';
import * as dashboardService from '../services/admin-dashboard.service.js';
import * as auditService from '../services/admin-audit.service.js';

const periodSchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y']).optional().default('30d'),
});

const limitSchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export async function adminDashboardRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /admin/dashboard/stats
  fastify.get(
    '/admin/dashboard/stats',
    { preHandler: [requireAdminViewer] },
    async (_request, reply) => {
      const stats = await dashboardService.getDashboardStats();
      const pools = dashboardService.getPoolOverview();

      const response: ApiResponse<{ stats: typeof stats; pools: typeof pools }> = {
        data: { stats, pools },
      };
      return reply.status(200).send(response);
    },
  );

  // GET /admin/dashboard/tvl-history
  fastify.get(
    '/admin/dashboard/tvl-history',
    { preHandler: [requireAdminViewer] },
    async (request, reply) => {
      const parsed = periodSchema.safeParse(request.query);
      const period = parsed.success ? parsed.data.period : '30d';
      const data = await dashboardService.getTVLHistory(period);

      const response: ApiResponse<typeof data> = { data };
      return reply.status(200).send(response);
    },
  );

  // GET /admin/dashboard/revenue-history
  fastify.get(
    '/admin/dashboard/revenue-history',
    { preHandler: [requireAdminViewer] },
    async (request, reply) => {
      const parsed = periodSchema.safeParse(request.query);
      const period = parsed.success ? parsed.data.period : '30d';
      const data = await dashboardService.getRevenueHistory(period);

      const response: ApiResponse<typeof data> = { data };
      return reply.status(200).send(response);
    },
  );

  // GET /admin/dashboard/alerts
  fastify.get(
    '/admin/dashboard/alerts',
    { preHandler: [requireAdminViewer] },
    async (request, reply) => {
      const parsed = limitSchema.safeParse(request.query);
      const limit = parsed.success ? parsed.data.limit : 20;
      const data = await dashboardService.getSystemAlerts(limit);

      const response: ApiResponse<typeof data> = { data };
      return reply.status(200).send(response);
    },
  );

  // GET /admin/dashboard/recent-activity
  fastify.get(
    '/admin/dashboard/recent-activity',
    { preHandler: [requireAdminViewer] },
    async (request, reply) => {
      const parsed = limitSchema.safeParse(request.query);
      const limit = parsed.success ? parsed.data.limit : 10;
      const data = await auditService.getRecentActivity(limit);

      const response: ApiResponse<typeof data> = { data };
      return reply.status(200).send(response);
    },
  );
}
