import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type {
  ApiResponse,
  Pagination,
  UserPortfolio,
  UserTransaction,
  TaxReportSummary,
  PnlBreakdown,
  TimeSeriesPoint,
  InstitutionalRiskMetrics,
  AnalyticsTimeRange,
} from '@dualis/shared';
import { AppError } from '../middleware/errorHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import * as portfolioService from '../services/analytics/portfolioAnalytics.service.js';
import { generateExport } from '../services/analytics/export.service.js';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const rangeSchema = z.object({
  range: z.enum(['7d', '30d', '90d', '1y']).optional().default('30d'),
});

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

const exportSchema = z.object({
  type: z.enum(['pool_history', 'user_transactions', 'tax_report', 'revenue']),
  format: z.enum(['csv', 'pdf']),
  year: z.coerce.number().int().min(2020).max(2030).optional(),
  poolId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

const yearSchema = z.object({
  year: z.coerce.number().int().min(2020).max(2030).optional(),
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function getUserId(request: FastifyRequest): string {
  return (request as FastifyRequest & { user?: { userId?: string; partyId: string } }).user?.userId ?? 'user_demo';
}

// ---------------------------------------------------------------------------
// Routes — institutional (API key / JWT required)
// ---------------------------------------------------------------------------

export async function analyticsInstitutionalRoutes(fastify: FastifyInstance): Promise<void> {

  // All routes require auth
  fastify.addHook('preHandler', authMiddleware);

  // GET /institutional/portfolio — Portfolio summary
  fastify.get('/institutional/portfolio', async (request, reply) => {
    const userId = getUserId(request);
    const parsed = rangeSchema.safeParse(request.query);
    const range = parsed.success ? parsed.data.range as AnalyticsTimeRange : '30d';

    const portfolio = portfolioService.getUserPortfolio(userId, range);

    const response: ApiResponse<UserPortfolio> = { data: portfolio };
    return reply.status(200).send(response);
  });

  // GET /institutional/portfolio/history — Portfolio value trend
  fastify.get('/institutional/portfolio/history', async (request, reply) => {
    const userId = getUserId(request);
    const parsed = rangeSchema.safeParse(request.query);
    const range = parsed.success ? parsed.data.range as AnalyticsTimeRange : '30d';

    const portfolio = portfolioService.getUserPortfolio(userId, range);

    const response: ApiResponse<TimeSeriesPoint[]> = {
      data: portfolio.portfolioValueHistory,
    };
    return reply.status(200).send(response);
  });

  // GET /institutional/positions — All positions (detailed)
  fastify.get('/institutional/positions', async (request, reply) => {
    const userId = getUserId(request);
    const portfolio = portfolioService.getUserPortfolio(userId);

    const response: ApiResponse<{
      supply: typeof portfolio.supplyPositions;
      borrow: typeof portfolio.borrowPositions;
    }> = {
      data: {
        supply: portfolio.supplyPositions,
        borrow: portfolio.borrowPositions,
      },
    };
    return reply.status(200).send(response);
  });

  // GET /institutional/transactions — Transaction history (paginated)
  fastify.get('/institutional/transactions', async (request, reply) => {
    const userId = getUserId(request);
    const parsed = paginationSchema.safeParse(request.query);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid query parameters', 400, parsed.error.flatten());
    }

    const { transactions, total } = portfolioService.getUserTransactions(
      userId,
      parsed.data.limit,
      parsed.data.offset,
    );

    const pagination: Pagination = {
      total,
      limit: parsed.data.limit,
      offset: parsed.data.offset,
      hasMore: parsed.data.offset + parsed.data.limit < total,
    };

    const response: ApiResponse<UserTransaction[]> = { data: transactions, pagination };
    return reply.status(200).send(response);
  });

  // GET /institutional/pnl — P&L report
  fastify.get('/institutional/pnl', async (request, reply) => {
    const userId = getUserId(request);
    const portfolio = portfolioService.getUserPortfolio(userId);

    const response: ApiResponse<{
      totalInterestEarned: number;
      totalInterestPaid: number;
      netInterestUsd: number;
      unrealizedPnl: number;
      totalPnl: number;
      pnlHistory: TimeSeriesPoint[];
    }> = {
      data: {
        totalInterestEarned: portfolio.totalInterestEarned,
        totalInterestPaid: portfolio.totalInterestPaid,
        netInterestUsd: portfolio.netInterestUsd,
        unrealizedPnl: portfolio.unrealizedPnl,
        totalPnl: portfolio.totalPnl,
        pnlHistory: portfolio.pnlHistory,
      },
    };
    return reply.status(200).send(response);
  });

  // GET /institutional/pnl/breakdown — P&L pool-by-pool
  fastify.get('/institutional/pnl/breakdown', async (request, reply) => {
    const userId = getUserId(request);
    const breakdown = portfolioService.getPnlBreakdown(userId);

    const response: ApiResponse<PnlBreakdown[]> = { data: breakdown };
    return reply.status(200).send(response);
  });

  // GET /institutional/tax-report — Annual tax report
  fastify.get('/institutional/tax-report', async (request, reply) => {
    const userId = getUserId(request);
    const parsed = yearSchema.safeParse(request.query);
    const year = parsed.success ? parsed.data.year : undefined;

    const taxReport = portfolioService.getTaxReport(userId, year);

    const response: ApiResponse<TaxReportSummary> = { data: taxReport };
    return reply.status(200).send(response);
  });

  // POST /institutional/export — CSV/PDF export
  fastify.post('/institutional/export', async (request, reply) => {
    const userId = getUserId(request);
    const parsed = exportSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid export parameters', 400, parsed.error.flatten());
    }

    const opts: { year?: number; poolId?: string; from?: string; to?: string } = {};
    if (parsed.data.year != null) opts.year = parsed.data.year;
    if (parsed.data.poolId != null) opts.poolId = parsed.data.poolId;
    if (parsed.data.from != null) opts.from = parsed.data.from;
    if (parsed.data.to != null) opts.to = parsed.data.to;

    const result = generateExport(
      parsed.data.type,
      parsed.data.format,
      userId,
      opts,
    );

    reply.header('Content-Type', result.contentType);
    reply.header('Content-Disposition', `attachment; filename="${result.fileName}"`);
    return reply.status(200).send(result.content);
  });

  // GET /institutional/risk — Risk metrics
  fastify.get('/institutional/risk', async (request, reply) => {
    const userId = getUserId(request);
    const portfolio = portfolioService.getUserPortfolio(userId);

    const riskMetrics: InstitutionalRiskMetrics = {
      avgHealthFactor: portfolio.avgHealthFactor,
      lowestHealthFactor: portfolio.lowestHealthFactor,
      liquidationProximity: portfolio.lowestHealthFactor != null
        ? Math.max(0, (portfolio.lowestHealthFactor - 1) / portfolio.lowestHealthFactor)
        : null,
      concentrationRisk: 0.35,
      positions: portfolio.supplyPositions.length + portfolio.borrowPositions.length,
    };

    const response: ApiResponse<InstitutionalRiskMetrics> = { data: riskMetrics };
    return reply.status(200).send(response);
  });

  // GET /analytics/export/csv — Export analytics as CSV
  fastify.get('/analytics/export/csv', async (request, reply) => {
    const userId = getUserId(request);
    const typeSchema = z.object({
      type: z.enum(['pool_history', 'user_transactions', 'tax_report', 'revenue']).optional().default('user_transactions'),
      year: z.coerce.number().int().min(2020).max(2030).optional(),
      poolId: z.string().optional(),
    });
    const parsed = typeSchema.safeParse(request.query);
    const opts = parsed.success ? parsed.data : { type: 'user_transactions' as const };

    const exportOpts: { year?: number; poolId?: string } = {};
    if ('year' in opts && opts.year != null) exportOpts.year = opts.year;
    if ('poolId' in opts && opts.poolId != null) exportOpts.poolId = opts.poolId;

    const result = generateExport(opts.type, 'csv', userId, exportOpts);

    reply.header('Content-Type', result.contentType);
    reply.header('Content-Disposition', `attachment; filename="${result.fileName}"`);
    return reply.status(200).send(result.content);
  });

  // GET /analytics/export/pdf — Export analytics as PDF (HTML)
  fastify.get('/analytics/export/pdf', async (request, reply) => {
    const userId = getUserId(request);
    const typeSchema = z.object({
      type: z.enum(['pool_history', 'user_transactions', 'tax_report', 'revenue']).optional().default('user_transactions'),
      year: z.coerce.number().int().min(2020).max(2030).optional(),
      poolId: z.string().optional(),
    });
    const parsed = typeSchema.safeParse(request.query);
    const opts = parsed.success ? parsed.data : { type: 'user_transactions' as const };

    const exportOpts: { year?: number; poolId?: string } = {};
    if ('year' in opts && opts.year != null) exportOpts.year = opts.year;
    if ('poolId' in opts && opts.poolId != null) exportOpts.poolId = opts.poolId;

    const result = generateExport(opts.type, 'pdf', userId, exportOpts);

    reply.header('Content-Type', result.contentType);
    reply.header('Content-Disposition', `attachment; filename="${result.fileName}"`);
    return reply.status(200).send(result.content);
  });
}
