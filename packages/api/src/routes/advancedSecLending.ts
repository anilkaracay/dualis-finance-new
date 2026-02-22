import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ApiResponse, TransactionMeta } from '@dualis/shared';
import { AppError } from '../middleware/errorHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import { randomUUID } from 'node:crypto';

function buildTransactionMeta(): TransactionMeta {
  return {
    id: `tx-${randomUUID()}`,
    status: 'confirmed',
    timestamp: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Mock data for advanced sec lending features
// ---------------------------------------------------------------------------

interface FractionalOffer {
  offerId: string;
  lender: string;
  security: { symbol: string; amount: number; type: string };
  totalAmount: number;
  remainingAmount: number;
  minFillAmount: number;
  feeRate: number;
  fills: Array<{ filledBy: string; amount: number; filledAt: string }>;
  isActive: boolean;
  createdAt: string;
}

interface NettingAgreement {
  agreementId: string;
  partyA: string;
  partyB: string;
  dealIds: string[];
  netAmount: number;
  netDirection: string;
  status: string;
  createdAt: string;
}

interface CorporateAction {
  actionId: string;
  dealId: string;
  actionType: string;
  security: string;
  recordDate: string;
  paymentDate: string;
  amount: number;
  status: string;
}

const MOCK_FRACTIONAL_OFFERS: FractionalOffer[] = [
  {
    offerId: 'frac-offer-001',
    lender: 'party::institutional-lender-1',
    security: { symbol: 'AAPL', amount: 50_000, type: 'TokenizedEquity' },
    totalAmount: 50_000,
    remainingAmount: 35_000,
    minFillAmount: 2_500,
    feeRate: 0.28,
    fills: [
      { filledBy: 'party::hedge-fund-delta', amount: 15_000, filledAt: '2026-02-15T10:00:00.000Z' },
    ],
    isActive: true,
    createdAt: '2026-02-10T08:00:00.000Z',
  },
  {
    offerId: 'frac-offer-002',
    lender: 'party::pension-fund-alpha',
    security: { symbol: 'TSLA', amount: 25_000, type: 'TokenizedEquity' },
    totalAmount: 25_000,
    remainingAmount: 25_000,
    minFillAmount: 1_000,
    feeRate: 0.42,
    fills: [],
    isActive: true,
    createdAt: '2026-02-18T14:00:00.000Z',
  },
  {
    offerId: 'frac-offer-003',
    lender: 'party::sovereign-fund-beta',
    security: { symbol: 'SPY', amount: 100_000, type: 'TokenizedEquity' },
    totalAmount: 100_000,
    remainingAmount: 60_000,
    minFillAmount: 5_000,
    feeRate: 0.18,
    fills: [
      { filledBy: 'party::market-maker-gamma', amount: 40_000, filledAt: '2026-02-19T09:00:00.000Z' },
    ],
    isActive: true,
    createdAt: '2026-02-12T11:00:00.000Z',
  },
];

const MOCK_NETTING_AGREEMENTS: NettingAgreement[] = [
  {
    agreementId: 'net-001',
    partyA: 'party::alice::1',
    partyB: 'party::bob::2',
    dealIds: ['deal-001', 'deal-002'],
    netAmount: 25_000,
    netDirection: 'partyA_owes',
    status: 'proposed',
    createdAt: '2026-02-20T10:00:00.000Z',
  },
];

const MOCK_CORPORATE_ACTIONS: CorporateAction[] = [
  {
    actionId: 'ca-001',
    dealId: 'deal-001',
    actionType: 'Dividend',
    security: 'AAPL',
    recordDate: '2026-02-17T00:00:00.000Z',
    paymentDate: '2026-02-20T00:00:00.000Z',
    amount: 2500,
    status: 'processed',
  },
  {
    actionId: 'ca-002',
    dealId: 'deal-003',
    actionType: 'CouponPayment',
    security: 'US-T10Y',
    recordDate: '2026-02-21T00:00:00.000Z',
    paymentDate: '2026-02-27T00:00:00.000Z',
    amount: 12500,
    status: 'pending',
  },
];

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createFractionalOfferSchema = z.object({
  security: z.object({ symbol: z.string().min(1), amount: z.number().positive(), type: z.string() }),
  minFillAmount: z.number().positive(),
  feeRate: z.number().min(0),
});

const fillFractionalSchema = z.object({
  amount: z.number().positive(),
});

const proposeNettingSchema = z.object({
  counterparty: z.string().min(1),
  dealIds: z.array(z.string()).min(1),
});

const calculateDynamicFeeSchema = z.object({
  security: z.string().min(1),
  amount: z.number().positive(),
  duration: z.number().int().positive(),
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function advancedSecLendingRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /sec-lending/fractional — list fractional offers
  fastify.get('/sec-lending/fractional', async (_request, reply) => {
    const response: ApiResponse<FractionalOffer[]> = { data: MOCK_FRACTIONAL_OFFERS };
    return reply.status(200).send(response);
  });

  // POST /sec-lending/fractional (auth) — create fractional offer
  fastify.post(
    '/sec-lending/fractional',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = createFractionalOfferSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid fractional offer', 400, parsed.error.flatten());
      }

      const partyId = request.user!.partyId;
      const offer: FractionalOffer = {
        offerId: `frac-offer-${randomUUID().slice(0, 8)}`,
        lender: partyId,
        security: parsed.data.security,
        totalAmount: parsed.data.security.amount,
        remainingAmount: parsed.data.security.amount,
        minFillAmount: parsed.data.minFillAmount,
        feeRate: parsed.data.feeRate,
        fills: [],
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      const response: ApiResponse<FractionalOffer> = {
        data: offer,
        transaction: buildTransactionMeta(),
      };
      return reply.status(201).send(response);
    },
  );

  // POST /sec-lending/fractional/:offerId/fill (auth) — fill partial
  fastify.post(
    '/sec-lending/fractional/:offerId/fill',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { offerId } = request.params as { offerId: string };
      const parsed = fillFractionalSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid fill request', 400, parsed.error.flatten());
      }

      const offer = MOCK_FRACTIONAL_OFFERS.find((o) => o.offerId === offerId);
      if (!offer) {
        throw new AppError('NOT_FOUND', `Fractional offer ${offerId} not found`, 404);
      }

      if (parsed.data.amount < offer.minFillAmount) {
        throw new AppError('VALIDATION_ERROR', `Minimum fill amount is ${offer.minFillAmount}`, 400);
      }

      const response: ApiResponse<{ dealId: string; filledAmount: number; remainingAmount: number }> = {
        data: {
          dealId: `deal-frac-${randomUUID().slice(0, 8)}`,
          filledAmount: parsed.data.amount,
          remainingAmount: offer.remainingAmount - parsed.data.amount,
        },
        transaction: buildTransactionMeta(),
      };
      return reply.status(201).send(response);
    },
  );

  // POST /sec-lending/dynamic-fee (public) — calculate dynamic fee
  fastify.post('/sec-lending/dynamic-fee', async (request, reply) => {
    const parsed = calculateDynamicFeeSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid parameters', 400, parsed.error.flatten());
    }

    // Mock dynamic fee calculation based on supply/demand
    const baseFee = 0.25;
    const demandMultiplier = Math.min(2, 1 + (parsed.data.amount / 50_000) * 0.5);
    const durationFactor = 1 + (parsed.data.duration / 365) * 0.3;
    const dynamicFee = Number((baseFee * demandMultiplier * durationFactor).toFixed(4));

    const response: ApiResponse<{ security: string; suggestedFee: number; baseFee: number; demandMultiplier: number; durationFactor: number }> = {
      data: {
        security: parsed.data.security,
        suggestedFee: dynamicFee,
        baseFee,
        demandMultiplier: Number(demandMultiplier.toFixed(4)),
        durationFactor: Number(durationFactor.toFixed(4)),
      },
    };
    return reply.status(200).send(response);
  });

  // GET /sec-lending/netting — list netting agreements
  fastify.get(
    '/sec-lending/netting',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = request.user!.partyId;
      const agreements = MOCK_NETTING_AGREEMENTS.filter(
        (n) => n.partyA === partyId || n.partyB === partyId,
      );

      const response: ApiResponse<NettingAgreement[]> = { data: agreements };
      return reply.status(200).send(response);
    },
  );

  // POST /sec-lending/netting (auth) — propose netting
  fastify.post(
    '/sec-lending/netting',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = proposeNettingSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid netting proposal', 400, parsed.error.flatten());
      }

      const partyId = request.user!.partyId;
      const agreement: NettingAgreement = {
        agreementId: `net-${randomUUID().slice(0, 8)}`,
        partyA: partyId,
        partyB: parsed.data.counterparty,
        dealIds: parsed.data.dealIds,
        netAmount: Math.round(Math.random() * 50_000),
        netDirection: 'partyA_owes',
        status: 'proposed',
        createdAt: new Date().toISOString(),
      };

      const response: ApiResponse<NettingAgreement> = {
        data: agreement,
        transaction: buildTransactionMeta(),
      };
      return reply.status(201).send(response);
    },
  );

  // POST /sec-lending/netting/:agreementId/execute (auth) — execute netting
  fastify.post(
    '/sec-lending/netting/:agreementId/execute',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { agreementId } = request.params as { agreementId: string };

      const agreement = MOCK_NETTING_AGREEMENTS.find((n) => n.agreementId === agreementId);
      if (!agreement) {
        throw new AppError('NOT_FOUND', `Netting agreement ${agreementId} not found`, 404);
      }

      const response: ApiResponse<{ agreementId: string; status: string; settledAmount: number }> = {
        data: {
          agreementId,
          status: 'settled',
          settledAmount: agreement.netAmount,
        },
        transaction: buildTransactionMeta(),
      };
      return reply.status(200).send(response);
    },
  );

  // GET /sec-lending/corporate-actions — list corporate actions
  fastify.get(
    '/sec-lending/corporate-actions',
    { preHandler: [authMiddleware] },
    async (_request, reply) => {
      const response: ApiResponse<CorporateAction[]> = { data: MOCK_CORPORATE_ACTIONS };
      return reply.status(200).send(response);
    },
  );
}
