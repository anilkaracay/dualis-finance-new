import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ApiResponse } from '@dualis/shared';
import { requireAdminViewer } from '../middleware/admin-auth.js';

const periodSchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y']).optional().default('30d'),
});

// ---------------------------------------------------------------------------
// Mock report data
// ---------------------------------------------------------------------------

function generateTimeSeries(points: number, base: number, variance: number) {
  return Array.from({ length: points }, (_, i) => ({
    date: new Date(Date.now() - (points - i) * 86400000).toISOString().slice(0, 10),
    value: base + (Math.random() - 0.3) * variance * (i / points),
  }));
}

export async function adminReportsRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /admin/reports/revenue — revenue breakdown
  fastify.get(
    '/admin/reports/revenue',
    { preHandler: [requireAdminViewer] },
    async (request, reply) => {
      const parsed = periodSchema.safeParse(request.query);
      const period = parsed.success ? parsed.data.period : '30d';
      const points = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;

      const data = {
        totalRevenue: 284_500,
        interestRevenue: 198_150,
        liquidationRevenue: 45_200,
        flashLoanRevenue: 12_800,
        protocolFees: 28_350,
        timeSeries: generateTimeSeries(points, 5000, 3000),
        breakdown: [
          { source: 'Interest Spread', amount: 198_150, percentage: 0.697 },
          { source: 'Liquidation Penalties', amount: 45_200, percentage: 0.159 },
          { source: 'Protocol Fees', amount: 28_350, percentage: 0.100 },
          { source: 'Flash Loan Fees', amount: 12_800, percentage: 0.045 },
        ],
      };

      const response: ApiResponse<typeof data> = { data };
      return reply.status(200).send(response);
    },
  );

  // GET /admin/reports/pools — pool performance
  fastify.get(
    '/admin/reports/pools',
    { preHandler: [requireAdminViewer] },
    async (_request, reply) => {
      const data = {
        pools: [
          { poolId: 'usdc-main', name: 'USDC Main Pool', tvl: 25_000_000, utilization: 0.50, revenue30d: 125_000, avgAPY: 0.032, growthRate: 0.08 },
          { poolId: 'wbtc-main', name: 'wBTC Pool', tvl: 10_000_000, utilization: 0.35, revenue30d: 42_000, avgAPY: 0.012, growthRate: 0.12 },
          { poolId: 'eth-main', name: 'ETH Pool', tvl: 8_200_000, utilization: 0.50, revenue30d: 65_000, avgAPY: 0.018, growthRate: 0.05 },
          { poolId: 'tbill-main', name: 'T-Bill Pool', tvl: 5_000_000, utilization: 0.30, revenue30d: 35_000, avgAPY: 0.042, growthRate: 0.15 },
          { poolId: 'cc-main', name: 'CC Token Pool', tvl: 2_000_000, utilization: 0.45, revenue30d: 12_000, avgAPY: 0.045, growthRate: -0.02 },
          { poolId: 'spy-main', name: 'SPY ETF Pool', tvl: 3_000_000, utilization: 0.27, revenue30d: 5_500, avgAPY: 0.015, growthRate: 0.20 },
        ],
        totalTVL: 53_200_000,
        avgUtilization: 0.395,
        totalRevenue30d: 284_500,
      };

      const response: ApiResponse<typeof data> = { data };
      return reply.status(200).send(response);
    },
  );

  // GET /admin/reports/liquidations — liquidation report
  fastify.get(
    '/admin/reports/liquidations',
    { preHandler: [requireAdminViewer] },
    async (_request, reply) => {
      const data = {
        totalLiquidations: 23,
        totalValueLiquidated: 1_850_000,
        avgPenaltyCollected: 4_520,
        totalPenalties: 45_200,
        events: [
          { id: 1, user: 'party::user42', pool: 'wbtc-main', debtRepaid: 150_000, collateralSeized: 165_000, penalty: 9_000, healthFactorBefore: 0.95, timestamp: '2024-12-10T14:30:00Z' },
          { id: 2, user: 'party::user87', pool: 'eth-main', debtRepaid: 80_000, collateralSeized: 88_000, penalty: 4_800, healthFactorBefore: 0.88, timestamp: '2024-12-08T09:15:00Z' },
          { id: 3, user: 'party::user23', pool: 'usdc-main', debtRepaid: 250_000, collateralSeized: 270_000, penalty: 12_500, healthFactorBefore: 0.92, timestamp: '2024-12-05T16:45:00Z' },
          { id: 4, user: 'party::user55', pool: 'cc-main', debtRepaid: 45_000, collateralSeized: 52_200, penalty: 3_600, healthFactorBefore: 0.78, timestamp: '2024-12-01T11:00:00Z' },
        ],
        timeSeries: generateTimeSeries(30, 2, 3),
      };

      const response: ApiResponse<typeof data> = { data };
      return reply.status(200).send(response);
    },
  );

  // GET /admin/reports/reserves — reserve fund status
  fastify.get(
    '/admin/reports/reserves',
    { preHandler: [requireAdminViewer] },
    async (_request, reply) => {
      const data = {
        totalReserves: 2_850_000,
        reserveRatio: 0.054,
        targetRatio: 0.05,
        byAsset: [
          { asset: 'USDC', amount: 1_250_000, percentage: 0.439 },
          { asset: 'ETH', amount: 410_000, percentage: 0.144 },
          { asset: 'wBTC', amount: 500_000, percentage: 0.175 },
          { asset: 'T-BILL', amount: 350_000, percentage: 0.123 },
          { asset: 'CC', amount: 140_000, percentage: 0.049 },
          { asset: 'SPY', amount: 200_000, percentage: 0.070 },
        ],
        timeSeries: generateTimeSeries(30, 2_500_000, 500_000),
      };

      const response: ApiResponse<typeof data> = { data };
      return reply.status(200).send(response);
    },
  );

  // GET /admin/reports/rates — interest rate analytics
  fastify.get(
    '/admin/reports/rates',
    { preHandler: [requireAdminViewer] },
    async (_request, reply) => {
      const data = {
        avgSupplyRate: 0.028,
        avgBorrowRate: 0.048,
        avgSpread: 0.020,
        weightedAvgUtilization: 0.42,
        byPool: [
          { poolId: 'usdc-main', supplyAPY: 0.032, borrowAPY: 0.058, spread: 0.026, utilization: 0.50 },
          { poolId: 'wbtc-main', supplyAPY: 0.012, borrowAPY: 0.028, spread: 0.016, utilization: 0.35 },
          { poolId: 'eth-main', supplyAPY: 0.018, borrowAPY: 0.034, spread: 0.016, utilization: 0.50 },
          { poolId: 'tbill-main', supplyAPY: 0.042, borrowAPY: 0.052, spread: 0.010, utilization: 0.30 },
          { poolId: 'cc-main', supplyAPY: 0.045, borrowAPY: 0.095, spread: 0.050, utilization: 0.45 },
          { poolId: 'spy-main', supplyAPY: 0.015, borrowAPY: 0.032, spread: 0.017, utilization: 0.27 },
        ],
      };

      const response: ApiResponse<typeof data> = { data };
      return reply.status(200).send(response);
    },
  );

  // POST /admin/reports/export — export any report as CSV
  fastify.post(
    '/admin/reports/export',
    { preHandler: [requireAdminViewer] },
    async (request, reply) => {
      const schema = z.object({
        reportType: z.enum(['revenue', 'pools', 'liquidations', 'reserves', 'rates']),
      });
      const parsed = schema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Invalid report type' });
      }

      const csv = `report_type,generated_at\n${parsed.data.reportType},${new Date().toISOString()}`;

      return reply
        .status(200)
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="${parsed.data.reportType}-report.csv"`)
        .send(csv);
    },
  );
}
