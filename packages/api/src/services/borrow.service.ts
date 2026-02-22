import { createChildLogger } from '../config/logger.js';
import type {
  BorrowRequest,
  BorrowResponse,
  BorrowPositionItem,
  RepayResponse,
  AddCollateralResponse,
  TransactionMeta,
  CreditTier,
} from '@dualis/shared';
import { randomUUID } from 'node:crypto';
import * as compositeCreditService from './compositeCredit.service.js';

const log = createChildLogger('borrow-service');

// Base APY before tier-based discounts
const BASE_BORROW_APY = 0.068;

function buildTransactionMeta(): TransactionMeta {
  return {
    id: `tx-${randomUUID()}`,
    status: 'confirmed',
    timestamp: new Date().toISOString(),
  };
}

// Hybrid collateral price map — includes crypto, project assets, and TIFA receivables
const COLLATERAL_PRICES: Record<string, number> = {
  USDC: 1.0,
  ETH: 3_420,
  wBTC: 62_450,
  'T-BILL': 1.0,
  'CC-REC': 1.0,
  SPY: 478.5,
  // Productive project assets
  'SOLAR-ASSET': 1.0,
  'WIND-ASSET': 1.0,
  'INFRA-ASSET': 1.0,
  // TIFA receivables
  'TIFA-REC': 1.0,
  'TIFA-INVOICE': 1.0,
};

const MOCK_POSITIONS: BorrowPositionItem[] = [
  {
    positionId: 'borrow-pos-001',
    lendingPoolId: 'usdc-main',
    borrowedAsset: { symbol: 'USDC', type: 'Stablecoin', priceUSD: 1.0 },
    borrowedAmountPrincipal: 50_000,
    currentDebt: 50_234.56,
    interestAccrued: 234.56,
    healthFactor: {
      value: 1.85,
      collateralValueUSD: 92_925,
      borrowValueUSD: 50_234.56,
      weightedLTV: 0.54,
    },
    creditTier: 'Gold' as CreditTier,
    isLiquidatable: false,
    collateral: [
      { symbol: 'ETH', amount: '18.5', valueUSD: 63_270 },
      { symbol: 'wBTC', amount: '0.475', valueUSD: 29_655 },
    ],
    borrowTimestamp: '2025-12-15T10:30:00.000Z',
    contractId: 'canton::borrow::pos-001',
  },
  {
    positionId: 'borrow-pos-002',
    lendingPoolId: 'eth-main',
    borrowedAsset: { symbol: 'ETH', type: 'CryptoCurrency', priceUSD: 3_420 },
    borrowedAmountPrincipal: 12,
    currentDebt: 12.045,
    interestAccrued: 0.045,
    healthFactor: {
      value: 2.12,
      collateralValueUSD: 87_006,
      borrowValueUSD: 41_193.9,
      weightedLTV: 0.4735,
    },
    creditTier: 'Gold' as CreditTier,
    isLiquidatable: false,
    collateral: [
      { symbol: 'USDC', amount: '45000', valueUSD: 45_000 },
      { symbol: 'T-BILL', amount: '42006', valueUSD: 42_006 },
    ],
    borrowTimestamp: '2026-01-08T14:22:00.000Z',
    contractId: 'canton::borrow::pos-002',
  },
  {
    positionId: 'borrow-pos-003',
    lendingPoolId: 'tbill-short',
    borrowedAsset: { symbol: 'T-BILL', type: 'TokenizedTreasury', priceUSD: 1.0 },
    borrowedAmountPrincipal: 200_000,
    currentDebt: 201_890,
    interestAccrued: 1_890,
    healthFactor: {
      value: 1.35,
      collateralValueUSD: 272_551.5,
      borrowValueUSD: 201_890,
      weightedLTV: 0.7407,
    },
    creditTier: 'Silver' as CreditTier,
    isLiquidatable: false,
    collateral: [
      { symbol: 'wBTC', amount: '3.5', valueUSD: 218_575 },
      { symbol: 'USDC', amount: '53976.5', valueUSD: 53_976.5 },
    ],
    borrowTimestamp: '2026-02-01T09:15:00.000Z',
    contractId: 'canton::borrow::pos-003',
  },
];

export function requestBorrow(
  partyId: string,
  params: BorrowRequest
): { data: BorrowResponse; transaction: TransactionMeta } {
  log.info({ partyId, params }, 'Processing borrow request');

  // Look up composite score for tier-based rate discount
  const compositeScore = compositeCreditService.getCompositeScore(partyId);
  const rateDiscount = compositeScore.benefits.rateDiscount;
  const discountedAPY = Number((BASE_BORROW_APY * (1 - rateDiscount)).toFixed(4));

  log.debug(
    { tier: compositeScore.tier, rateDiscount, baseAPY: BASE_BORROW_APY, discountedAPY },
    'Applied tier-based rate discount',
  );

  const borrowAmount = parseFloat(params.borrowAmount);
  // Hybrid collateral: supports crypto, project assets, and TIFA receivables
  const collateralValueUSD = params.collateralAssets.reduce((acc, a) => {
    return acc + parseFloat(a.amount) * (COLLATERAL_PRICES[a.symbol] ?? 1);
  }, 0);

  return {
    data: {
      borrowPositionId: `borrow-pos-${randomUUID().slice(0, 8)}`,
      collateralPositionId: `collateral-pos-${randomUUID().slice(0, 8)}`,
      borrowedAmount: params.borrowAmount,
      healthFactor: {
        value: Number((collateralValueUSD / borrowAmount).toFixed(2)),
        collateralValueUSD,
        borrowValueUSD: borrowAmount,
        weightedLTV: Number((borrowAmount / collateralValueUSD).toFixed(4)),
      },
      creditTier: compositeScore.tier,
      borrowAPY: discountedAPY,
    },
    transaction: buildTransactionMeta(),
  };
}

export function getPositions(
  partyId: string
): BorrowPositionItem[] {
  log.debug({ partyId }, 'Getting borrow positions');
  return MOCK_POSITIONS;
}

export function repay(
  partyId: string,
  positionId: string,
  amount: string
): { data: RepayResponse; transaction: TransactionMeta } {
  log.info({ partyId, positionId, amount }, 'Processing repayment');

  const position = MOCK_POSITIONS.find((p) => p.positionId === positionId);
  if (!position) {
    throw new Error(`Position ${positionId} not found`);
  }

  const repayAmount = parseFloat(amount);
  const remaining = Math.max(0, position.currentDebt - repayAmount);

  return {
    data: {
      remainingDebt: Number(remaining.toFixed(2)),
      newHealthFactor: remaining === 0 ? Infinity : Number(
        (position.healthFactor.collateralValueUSD / remaining).toFixed(2)
      ),
    },
    transaction: buildTransactionMeta(),
  };
}

export function addCollateral(
  partyId: string,
  positionId: string,
  asset: { symbol: string; amount: string }
): { data: AddCollateralResponse; transaction: TransactionMeta } {
  log.info({ partyId, positionId, asset }, 'Adding collateral');

  const position = MOCK_POSITIONS.find((p) => p.positionId === positionId);
  if (!position) {
    throw new Error(`Position ${positionId} not found`);
  }

  const addedValueUSD = parseFloat(asset.amount) * (COLLATERAL_PRICES[asset.symbol] ?? 1);
  const newCollateralValue = position.healthFactor.collateralValueUSD + addedValueUSD;

  return {
    data: {
      newCollateralValueUSD: Number(newCollateralValue.toFixed(2)),
      newHealthFactor: Number(
        (newCollateralValue / position.currentDebt).toFixed(2)
      ),
    },
    transaction: buildTransactionMeta(),
  };
}
