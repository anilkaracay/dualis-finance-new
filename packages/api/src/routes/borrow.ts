import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ApiResponse, ApiErrorCode, BorrowResponse, BorrowPositionItem, RepayResponse, AddCollateralResponse } from '@dualis/shared';
import { getCollateralParams } from '@dualis/shared';
import { AppError } from '../middleware/errorHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import * as borrowService from '../services/borrow.service.js';
import * as registry from '../services/poolRegistry.js';
import { mapCantonError } from '../canton/error-mapper.js';

const positiveAmountString = z.string().min(1).refine((val) => {
  const num = parseFloat(val);
  return !isNaN(num) && num > 0;
}, { message: 'Amount must be a positive number' }).refine((val) => {
  const num = parseFloat(val);
  return num <= 1_000_000_000;
}, { message: 'Amount exceeds maximum allowed value' });

const routingModeSchema = z.enum(['proxy', 'wallet-sign', 'auto']).optional();

const borrowRequestSchema = z.object({
  lendingPoolId: z.string().min(1),
  borrowAmount: positiveAmountString,
  collateralAssets: z.array(
    z.object({
      symbol: z.string().min(1),
      amount: positiveAmountString,
    })
  ).min(1),
  routingMode: routingModeSchema,
  walletParty: z.string().optional(),
  walletTransferConfirmed: z.boolean().optional(),
  walletTxHash: z.string().optional(),
});

const repaySchema = z.object({
  amount: z.string().min(1).refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, { message: 'Amount must be a positive number' }).refine((val) => {
    const num = parseFloat(val);
    return num <= 1_000_000_000;
  }, { message: 'Amount exceeds maximum allowed value' }),
  routingMode: routingModeSchema,
  walletParty: z.string().optional(),
  walletTransferConfirmed: z.boolean().optional(),
  walletTxHash: z.string().optional(),
});

const addCollateralSchema = z.object({
  asset: z.object({
    symbol: z.string().min(1),
    amount: z.string().min(1).refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, { message: 'Amount must be a positive number' }).refine((val) => {
      const num = parseFloat(val);
      return num <= 1_000_000_000;
    }, { message: 'Amount exceeds maximum allowed value' }),
  }),
  routingMode: routingModeSchema,
  walletParty: z.string().optional(),
  walletTransferConfirmed: z.boolean().optional(),
  walletTxHash: z.string().optional(),
});

export async function borrowRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /borrow/collateral-assets — dynamic list of collateral assets & prices
  fastify.get('/borrow/collateral-assets', async (_request, reply) => {
    const priceMap = registry.getAssetPriceMap();
    const assets = Object.entries(priceMap).map(([symbol, priceUSD]) => {
      const params = getCollateralParams(symbol);
      return {
        symbol,
        priceUSD,
        loanToValue: params?.loanToValue ?? 0.50,
        liquidationThreshold: params?.liquidationThreshold ?? 0.60,
        isCollateralEnabled: params?.isCollateralEnabled ?? true,
      };
    }).filter((a) => a.isCollateralEnabled);

    return reply.status(200).send({ data: assets });
  });

  // POST /borrow/request (auth)
  fastify.post(
    '/borrow/request',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = borrowRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid borrow request', 400, parsed.error.flatten());
      }

      const partyId = parsed.data.walletParty || request.user!.partyId;
      const userId = request.user?.userId;

      try {
        const result = await borrowService.requestBorrow(partyId, parsed.data, userId, parsed.data.routingMode, parsed.data.walletParty);
        // Wallet-sign mode returns TransactionResult directly
        if ('requiresWalletSign' in result) {
          return reply.status(200).send({ data: result });
        }
        const response: ApiResponse<BorrowResponse> = {
          data: result.data,
          transaction: result.transaction,
        };
        return reply.status(201).send(response);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('INSUFFICIENT_COLLATERAL')) {
          throw new AppError('INSUFFICIENT_COLLATERAL', msg, 422);
        }
        if (msg.includes('HEALTH_FACTOR_TOO_LOW')) {
          throw new AppError('HEALTH_FACTOR_TOO_LOW', msg, 422);
        }
        if (msg.includes('not found') && !msg.includes('ENOTFOUND')) {
          throw new AppError('POOL_NOT_FOUND', msg, 404);
        }
        if (msg.includes('CONTRACT_NOT_FOUND') || msg.includes('CONTRACT_NOT_ACTIVE')) {
          throw new AppError('CANTON_CONFLICT', msg, 409);
        }
        const mapped = mapCantonError(err);
        throw new AppError(mapped.code as ApiErrorCode, mapped.userMessage, mapped.httpStatus);
      }
    }
  );

  // GET /borrow/positions (auth)
  fastify.get(
    '/borrow/positions',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const partyId = request.user!.partyId;
      const rawPositions = await borrowService.getPositions(partyId);

      // Aggregate borrow positions by (symbol, poolId) — one row per asset+pool
      const aggregated = new Map<string, BorrowPositionItem>();
      for (const pos of rawPositions) {
        const key = `${pos.borrowedAsset.symbol}::${pos.lendingPoolId}`;
        const existing = aggregated.get(key);
        if (existing) {
          existing.borrowedAmountPrincipal += pos.borrowedAmountPrincipal;
          existing.currentDebt += pos.currentDebt;
          existing.interestAccrued += pos.interestAccrued;
          // Merge collateral arrays
          for (const c of pos.collateral) {
            const ec = existing.collateral.find(x => x.symbol === c.symbol);
            if (ec) {
              const newAmount = parseFloat(ec.amount) + parseFloat(c.amount);
              ec.amount = newAmount.toString();
              ec.valueUSD += c.valueUSD;
            } else {
              existing.collateral.push({ ...c });
            }
          }
          // Recalculate aggregated health factor
          existing.healthFactor.collateralValueUSD += pos.healthFactor.collateralValueUSD;
          existing.healthFactor.weightedCollateralValueUSD = (existing.healthFactor.weightedCollateralValueUSD ?? 0) + (pos.healthFactor.weightedCollateralValueUSD ?? 0);
          existing.healthFactor.borrowValueUSD += pos.healthFactor.borrowValueUSD;
          if (existing.healthFactor.borrowValueUSD > 0) {
            existing.healthFactor.value = (existing.healthFactor.weightedCollateralValueUSD ?? existing.healthFactor.collateralValueUSD) / existing.healthFactor.borrowValueUSD;
          }
          // Use worst case
          existing.isLiquidatable = existing.isLiquidatable || pos.isLiquidatable;
        } else {
          aggregated.set(key, {
            ...pos,
            positionId: key,
            collateral: pos.collateral.map(c => ({ ...c })),
            healthFactor: { ...pos.healthFactor },
          });
        }
      }

      const positions = Array.from(aggregated.values());

      const response: ApiResponse<BorrowPositionItem[]> = {
        data: positions,
      };

      return reply.status(200).send(response);
    }
  );

  // POST /borrow/positions/:positionId/repay (auth)
  fastify.post(
    '/borrow/positions/:positionId/repay',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { positionId } = request.params as { positionId: string };
      const parsed = repaySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid repay request', 400, parsed.error.flatten());
      }

      const partyId = parsed.data.walletParty || request.user!.partyId;
      const userId = request.user?.userId;

      try {
        const result = await borrowService.repay(partyId, positionId, parsed.data.amount, userId, parsed.data.routingMode, parsed.data.walletParty, parsed.data.walletTransferConfirmed, parsed.data.walletTxHash);
        if ('requiresWalletSign' in result) {
          return reply.status(200).send({ data: result });
        }
        const response: ApiResponse<RepayResponse> = {
          data: result.data,
          transaction: result.transaction,
        };
        return reply.status(200).send(response);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('not found') && !msg.includes('ENOTFOUND')) {
          throw new AppError('POSITION_NOT_FOUND', `Position ${positionId} not found`, 404);
        }
        if (msg.includes('Insufficient') && msg.includes('balance')) {
          throw new AppError('INSUFFICIENT_BALANCE' as ApiErrorCode, msg, 400);
        }
        if (msg.includes('exceeds current debt')) {
          throw new AppError('REPAY_EXCEEDS_DEBT', msg, 422);
        }
        if (msg.includes('CONTRACT_NOT_FOUND') || msg.includes('CONTRACT_NOT_ACTIVE')) {
          throw new AppError('CANTON_CONFLICT', msg, 409);
        }
        const mapped = mapCantonError(err);
        throw new AppError(mapped.code as ApiErrorCode, mapped.userMessage, mapped.httpStatus);
      }
    }
  );

  // POST /borrow/positions/:positionId/add-collateral (auth)
  fastify.post(
    '/borrow/positions/:positionId/add-collateral',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { positionId } = request.params as { positionId: string };
      const parsed = addCollateralSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid add collateral request', 400, parsed.error.flatten());
      }

      const partyId = parsed.data.walletParty || request.user!.partyId;
      const userId = request.user?.userId;

      try {
        const result = await borrowService.addCollateral(partyId, positionId, parsed.data.asset, userId, parsed.data.routingMode, parsed.data.walletParty, parsed.data.walletTransferConfirmed, parsed.data.walletTxHash);
        if ('requiresWalletSign' in result) {
          return reply.status(200).send({ data: result });
        }
        const response: ApiResponse<AddCollateralResponse> = {
          data: result.data,
          transaction: result.transaction,
        };
        return reply.status(200).send(response);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('not found') && !msg.includes('ENOTFOUND')) {
          throw new AppError('POSITION_NOT_FOUND', `Position ${positionId} not found`, 404);
        }
        if (msg.includes('Insufficient') && msg.includes('balance')) {
          throw new AppError('INSUFFICIENT_BALANCE' as ApiErrorCode, msg, 400);
        }
        if (msg.includes('CONTRACT_NOT_FOUND') || msg.includes('CONTRACT_NOT_ACTIVE')) {
          throw new AppError('CANTON_CONFLICT', msg, 409);
        }
        const mapped = mapCantonError(err);
        throw new AppError(mapped.code as ApiErrorCode, mapped.userMessage, mapped.httpStatus);
      }
    }
  );
}
