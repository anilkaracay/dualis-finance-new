import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ApiResponse, ProductiveProject, ProductiveBorrow, ProductivePool, IoTReading } from '@dualis/shared';
import { AppError } from '../middleware/errorHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import * as productiveService from '../services/productive.service.js';

const submitProjectSchema = z.object({
  category: z.enum([
    'SolarEnergy', 'WindEnergy', 'BatteryStorage', 'DataCenter',
    'SupplyChain', 'ExportFinance', 'EquipmentLeasing',
    'RealEstate', 'AgriInfra', 'TelecomInfra',
  ]),
  metadata: z.record(z.string(), z.unknown()),
  requestedAmount: z.string().min(1),
});

const updateStatusSchema = z.object({
  status: z.enum([
    'Proposed', 'UnderReview', 'Approved', 'Funded',
    'InConstruction', 'Operational', 'Repaying', 'Completed', 'Defaulted',
  ]),
});

const requestBorrowSchema = z.object({
  projectId: z.string().min(1),
  poolId: z.string().min(1),
  loanAmount: z.string().min(1),
  collateral: z.object({
    cryptoCollateral: z.string(),
    projectAssetValue: z.string(),
    tifaCollateral: z.string(),
    totalValue: z.string(),
    cryptoRatio: z.number().min(0).max(1),
  }),
});

const cashflowSchema = z.object({
  expectedDate: z.string(),
  expectedAmount: z.string(),
  actualAmount: z.string().nullable(),
  source: z.string(),
  status: z.enum(['Projected', 'Received', 'Partial', 'Missed', 'Overdue']),
});

const listProjectsSchema = z.object({
  category: z.enum([
    'SolarEnergy', 'WindEnergy', 'BatteryStorage', 'DataCenter',
    'SupplyChain', 'ExportFinance', 'EquipmentLeasing',
    'RealEstate', 'AgriInfra', 'TelecomInfra',
  ]).optional(),
  status: z.enum([
    'Proposed', 'UnderReview', 'Approved', 'Funded',
    'InConstruction', 'Operational', 'Repaying', 'Completed', 'Defaulted',
  ]).optional(),
});

export async function productiveRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /productive/projects — list projects
  fastify.get('/productive/projects', async (request, reply) => {
    const parsed = listProjectsSchema.safeParse(request.query);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid query parameters', 400, parsed.error.flatten());
    }
    const result = productiveService.listProjects(parsed.data);

    const response: ApiResponse<ProductiveProject[]> = {
      data: result.data,
      pagination: result.pagination,
    };
    return reply.status(200).send(response);
  });

  // GET /productive/projects/:projectId — project detail
  fastify.get('/productive/projects/:projectId', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const detail = productiveService.getProjectDetail(projectId);

    if (!detail) {
      throw new AppError('NOT_FOUND', `Project ${projectId} not found`, 404);
    }

    const response: ApiResponse<{ project: ProductiveProject; iotReadings: IoTReading[] }> = {
      data: detail,
    };
    return reply.status(200).send(response);
  });

  // POST /productive/projects (auth) — submit project
  fastify.post(
    '/productive/projects',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = submitProjectSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid project data', 400, parsed.error.flatten());
      }

      const partyId = request.user!.partyId;
      const result = productiveService.submitProject(partyId, parsed.data);

      const response: ApiResponse<ProductiveProject> = {
        data: result.data,
        transaction: result.transaction,
      };
      return reply.status(201).send(response);
    },
  );

  // PATCH /productive/projects/:projectId/status (auth) — update status
  fastify.patch(
    '/productive/projects/:projectId/status',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      const parsed = updateStatusSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid status', 400, parsed.error.flatten());
      }

      const result = productiveService.updateProjectStatus(projectId, parsed.data.status);
      const response: ApiResponse<typeof result.data> = {
        data: result.data,
        transaction: result.transaction,
      };
      return reply.status(200).send(response);
    },
  );

  // GET /productive/pools — list productive pools
  fastify.get('/productive/pools', async (_request, reply) => {
    const pools = productiveService.listProductivePools();
    const response: ApiResponse<ProductivePool[]> = { data: pools };
    return reply.status(200).send(response);
  });

  // POST /productive/borrow (auth) — request productive borrow
  fastify.post(
    '/productive/borrow',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = requestBorrowSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid borrow request', 400, parsed.error.flatten());
      }

      const partyId = request.user!.partyId;
      const result = productiveService.requestProductiveBorrow({
        borrowerParty: partyId,
        ...parsed.data,
      });

      const response: ApiResponse<ProductiveBorrow> = {
        data: result.data,
        transaction: result.transaction,
      };
      return reply.status(201).send(response);
    },
  );

  // GET /productive/borrows (auth) — list user's productive borrows
  fastify.get(
    '/productive/borrows',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = request.user!.partyId;
      const borrows = productiveService.getBorrows(partyId);

      const response: ApiResponse<ProductiveBorrow[]> = { data: borrows };
      return reply.status(200).send(response);
    },
  );

  // POST /productive/borrows/:borrowId/cashflow (auth) — process cashflow
  fastify.post(
    '/productive/borrows/:borrowId/cashflow',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { borrowId } = request.params as { borrowId: string };
      const parsed = cashflowSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid cashflow data', 400, parsed.error.flatten());
      }

      const result = productiveService.processCashflowRepayment(borrowId, parsed.data);
      const response: ApiResponse<typeof result.data> = {
        data: result.data,
        transaction: result.transaction,
      };
      return reply.status(200).send(response);
    },
  );

  // GET /productive/iot/:projectId — IoT readings
  fastify.get('/productive/iot/:projectId', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const { period } = request.query as { period?: string };
    const readings = productiveService.getIoTReadings(projectId, period);

    const response: ApiResponse<IoTReading[]> = { data: readings };
    return reply.status(200).send(response);
  });

  // GET /productive/analytics — productive lending analytics
  fastify.get('/productive/analytics', async (_request, reply) => {
    const analytics = productiveService.getProductiveAnalytics();
    const response: ApiResponse<typeof analytics> = { data: analytics };
    return reply.status(200).send(response);
  });
}
