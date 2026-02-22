import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type {
  ApiResponse,
  ListSecLendingOffersParams,
  CreateSecLendingOfferRequest,
  SecLendingOfferItem,
  CreateOfferResponse,
  AcceptOfferResponse,
  SecLendingDealItem,
  RecallResponse,
  ReturnResponse,
} from '@dualis/shared';
import { AppError } from '../middleware/errorHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import * as secLendingService from '../services/secLending.service.js';

const listOffersSchema = z.object({
  assetType: z.enum(['equity', 'bond', 'treasury', 'all']).optional(),
  minFee: z.coerce.number().min(0).optional(),
  maxFee: z.coerce.number().min(0).optional(),
  minDuration: z.coerce.number().int().min(1).optional(),
  sortBy: z.enum(['fee', 'value', 'duration', 'created']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const createOfferSchema = z.object({
  security: z.object({
    symbol: z.string().min(1),
    amount: z.string().min(1),
  }),
  feeType: z.enum(['fixed', 'floating', 'negotiated']),
  feeValue: z.number().min(0),
  acceptedCollateralTypes: z.array(z.string()).min(1),
  initialMarginPercent: z.number().min(100),
  minLendDuration: z.number().int().min(1),
  maxLendDuration: z.number().int().min(1).optional(),
  isRecallable: z.boolean(),
  recallNoticeDays: z.number().int().min(0),
});

const acceptOfferSchema = z.object({
  collateral: z.array(
    z.object({
      symbol: z.string().min(1),
      amount: z.string().min(1),
    })
  ).min(1),
  requestedDuration: z.number().int().min(1),
});

export async function secLendingRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /sec-lending/offers
  fastify.get('/sec-lending/offers', async (request, reply) => {
    const parsed = listOffersSchema.safeParse(request.query);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid query parameters', 400, parsed.error.flatten());
    }

    const params = parsed.data as ListSecLendingOffersParams;
    const result = secLendingService.listOffers(params);
    const response: ApiResponse<SecLendingOfferItem[]> = {
      data: result.data,
      pagination: result.pagination,
    };

    return reply.status(200).send(response);
  });

  // POST /sec-lending/offers (auth)
  fastify.post(
    '/sec-lending/offers',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = createOfferSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid offer request', 400, parsed.error.flatten());
      }

      const partyId = (request as FastifyRequest & { partyId: string }).partyId;
      const offerData = parsed.data as CreateSecLendingOfferRequest;
      const result = secLendingService.createOffer(partyId, offerData);

      const response: ApiResponse<CreateOfferResponse> = {
        data: result.data,
        transaction: result.transaction,
      };

      return reply.status(201).send(response);
    }
  );

  // POST /sec-lending/offers/:offerId/accept (auth)
  fastify.post(
    '/sec-lending/offers/:offerId/accept',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { offerId } = request.params as { offerId: string };
      const parsed = acceptOfferSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid accept request', 400, parsed.error.flatten());
      }

      const partyId = (request as FastifyRequest & { partyId: string }).partyId;

      try {
        const result = secLendingService.acceptOffer(partyId, offerId, parsed.data);
        const response: ApiResponse<AcceptOfferResponse> = {
          data: result.data,
          transaction: result.transaction,
        };
        return reply.status(201).send(response);
      } catch {
        throw new AppError('NOT_FOUND', `Offer ${offerId} not found`, 404);
      }
    }
  );

  // GET /sec-lending/deals (auth)
  fastify.get(
    '/sec-lending/deals',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = (request as FastifyRequest & { partyId: string }).partyId;
      const deals = secLendingService.getDeals(partyId);

      const response: ApiResponse<SecLendingDealItem[]> = {
        data: deals,
      };

      return reply.status(200).send(response);
    }
  );

  // POST /sec-lending/deals/:dealId/recall (auth)
  fastify.post(
    '/sec-lending/deals/:dealId/recall',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { dealId } = request.params as { dealId: string };
      const partyId = (request as FastifyRequest & { partyId: string }).partyId;

      try {
        const result = secLendingService.recall(partyId, dealId);
        const response: ApiResponse<RecallResponse> = {
          data: result.data,
          transaction: result.transaction,
        };
        return reply.status(200).send(response);
      } catch {
        throw new AppError('DEAL_NOT_ACTIVE', `Deal ${dealId} not found or not active`, 422);
      }
    }
  );

  // POST /sec-lending/deals/:dealId/return (auth)
  fastify.post(
    '/sec-lending/deals/:dealId/return',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { dealId } = request.params as { dealId: string };
      const partyId = (request as FastifyRequest & { partyId: string }).partyId;

      try {
        const result = secLendingService.returnSecurities(partyId, dealId);
        const response: ApiResponse<ReturnResponse> = {
          data: result.data,
          transaction: result.transaction,
        };
        return reply.status(200).send(response);
      } catch {
        throw new AppError('DEAL_NOT_ACTIVE', `Deal ${dealId} not found or not active`, 422);
      }
    }
  );
}
