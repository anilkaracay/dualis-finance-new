/**
 * User Balance Service — Aggregates per-user supply and borrow positions from Canton.
 */

import { createChildLogger } from '../config/logger.js';
import { env } from '../config/env.js';
import * as cantonQueries from '../canton/queries.js';
import * as registry from './poolRegistry.js';
import type { CreditTier } from '@dualis/shared';

const log = createChildLogger('user-balance-service');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserSupplyPosition {
  contractId: string;
  positionId: string;
  poolId: string;
  asset: { symbol: string; priceUSD: number };
  principal: number;
  currentBalance: number;
  interestEarned: number;
  depositTimestamp: string;
}

export interface UserBorrowPosition {
  contractId: string;
  positionId: string;
  poolId: string;
  borrowedAsset: { symbol: string; type: string; priceUSD: number };
  borrowedAmountPrincipal: number;
  currentDebt: number;
  interestAccrued: number;
  healthFactor: {
    value: number;
    collateralValueUSD: number;
    borrowValueUSD: number;
    weightedLTV: number;
  };
  creditTier: CreditTier;
  collateral: Array<{ symbol: string; amount: string; valueUSD: number }>;
  borrowTimestamp: string;
}

export interface UserBalanceSummary {
  supplyPositions: UserSupplyPosition[];
  borrowPositions: UserBorrowPosition[];
  totalSupplyUSD: number;
  totalBorrowUSD: number;
  netWorthUSD: number;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * Get all supply positions for a user from Canton ledger.
 */
export async function getUserSupplyPositions(
  userPartyId: string,
): Promise<UserSupplyPosition[]> {
  if (env.CANTON_MOCK) {
    return [];
  }

  try {
    const contracts = await cantonQueries.getSupplyPositions(userPartyId);

    return contracts.map(c => {
      const p = c.payload as Record<string, unknown>;
      const asset = p.asset as Record<string, unknown> | undefined;
      const poolId = (p.poolId as string) ?? '';
      const principal = parseFloat((p.principal as string) ?? '0');
      const indexAtEntry = parseFloat((p.supplyIndexAtEntry as string) ?? '1');

      // Calculate current balance using pool's current supply index
      const pool = registry.getPool(poolId);
      const currentIndex = pool?.supplyIndex ?? 1;
      const currentBalance = principal * (currentIndex / indexAtEntry);
      const interestEarned = currentBalance - principal;

      const assetSymbol = (asset?.symbol as string) ?? 'UNKNOWN';
      const price = registry.getAssetPriceMap()[assetSymbol] ?? 1;

      return {
        contractId: c.contractId,
        positionId: (p.positionId as string) ?? c.contractId,
        poolId,
        asset: { symbol: assetSymbol, priceUSD: price },
        principal,
        currentBalance,
        interestEarned,
        depositTimestamp: (p.depositTimestamp as string) ?? new Date().toISOString(),
      };
    });
  } catch (err) {
    log.warn({ userPartyId, err }, 'Failed to query supply positions');
    return [];
  }
}

/**
 * Get all borrow positions for a user from Canton ledger.
 */
export async function getUserBorrowPositions(
  userPartyId: string,
): Promise<UserBorrowPosition[]> {
  if (env.CANTON_MOCK) {
    return [];
  }

  try {
    const contracts = await cantonQueries.getUserPositions(userPartyId);

    return contracts.map(c => {
      const p = c.payload as unknown as Record<string, unknown>;
      const asset = p.borrowedAsset as Record<string, unknown> | undefined;
      const hf = p.lastHealthFactor as Record<string, unknown> | undefined;
      const collRefs = (p.collateralRefs as Array<Record<string, unknown>>) ?? [];

      const principal = parseFloat((p.borrowedAmountPrincipal as string) ?? '0');
      const poolId = (p.poolId as string) ?? '';

      // Calculate current debt using borrow index accrual
      const pool = registry.getPool(poolId);
      const indexAtEntry = parseFloat((p.borrowIndexAtEntry as string) ?? '1');
      const currentIndex = pool?.borrowIndex ?? 1;
      const currentDebt = principal * (currentIndex / indexAtEntry);
      const interestAccrued = currentDebt - principal;

      return {
        contractId: c.contractId,
        positionId: (p.positionId as string) ?? c.contractId,
        poolId,
        borrowedAsset: {
          symbol: (asset?.symbol as string) ?? 'UNKNOWN',
          type: (asset?.instrumentType as string) ?? 'CryptoCurrency',
          priceUSD: parseFloat((asset?.priceUSD as string) ?? '1'),
        },
        borrowedAmountPrincipal: principal,
        currentDebt,
        interestAccrued,
        healthFactor: {
          value: parseFloat((hf?.value as string) ?? '1'),
          collateralValueUSD: parseFloat((hf?.collateralValueUSD as string) ?? '0'),
          borrowValueUSD: parseFloat((hf?.borrowValueUSD as string) ?? '0'),
          weightedLTV: parseFloat((hf?.weightedLTV as string) ?? '0'),
        },
        creditTier: (p.creditTier as CreditTier) ?? 'Unrated',
        collateral: collRefs.map(ref => ({
          symbol: (ref.symbol as string) ?? '',
          amount: (ref.amount as string) ?? '0',
          valueUSD: parseFloat((ref.valueUSD as string) ?? '0'),
        })),
        borrowTimestamp: (p.borrowTimestamp as string) ?? new Date().toISOString(),
      };
    });
  } catch (err) {
    log.warn({ userPartyId, err }, 'Failed to query borrow positions');
    return [];
  }
}

/**
 * Get full balance summary for a user.
 */
export async function getUserBalances(
  userPartyId: string,
): Promise<UserBalanceSummary> {
  const [supplyPositions, borrowPositions] = await Promise.all([
    getUserSupplyPositions(userPartyId),
    getUserBorrowPositions(userPartyId),
  ]);

  const totalSupplyUSD = supplyPositions.reduce(
    (sum, pos) => sum + pos.currentBalance * pos.asset.priceUSD,
    0,
  );

  const totalBorrowUSD = borrowPositions.reduce(
    (sum, pos) => sum + pos.currentDebt * pos.borrowedAsset.priceUSD,
    0,
  );

  return {
    supplyPositions,
    borrowPositions,
    totalSupplyUSD,
    totalBorrowUSD,
    netWorthUSD: totalSupplyUSD - totalBorrowUSD,
  };
}
