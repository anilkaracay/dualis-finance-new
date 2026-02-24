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
import {
  calculatePoolAPY,
  calculateMaxBorrowable,
  calculateHealthFactor,
  getRateModel,
  getCollateralParams,
  type CollateralPositionInput,
  type DebtPositionInput,
  type HealthFactorResult,
} from '@dualis/shared';
import { randomUUID } from 'node:crypto';
import * as compositeCreditService from './compositeCredit.service.js';

const log = createChildLogger('borrow-service');

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
  'SOLAR-ASSET': 1.0,
  'WIND-ASSET': 1.0,
  'INFRA-ASSET': 1.0,
  'TIFA-REC': 1.0,
  'TIFA-INVOICE': 1.0,
};

// Pool asset symbol lookup
const POOL_ASSETS: Record<string, string> = {
  'usdc-main': 'USDC',
  'wbtc-main': 'wBTC',
  'eth-main': 'ETH',
  'cc-receivable': 'CC-REC',
  'tbill-short': 'T-BILL',
  'spy-equity': 'SPY',
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
      weightedCollateralValueUSD: 92_934.0,
      borrowValueUSD: 50_234.56,
      weightedLTV: 0.5406,
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
      weightedCollateralValueUSD: 87_331.07,
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
      weightedCollateralValueUSD: 272_551.5,
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

/**
 * Build CollateralPositionInput from raw collateral data.
 */
function buildCollateralInputs(
  collateralAssets: Array<{ symbol: string; amount: string }>,
): CollateralPositionInput[] {
  return collateralAssets.map(a => {
    const params = getCollateralParams(a.symbol);
    const price = COLLATERAL_PRICES[a.symbol] ?? 1;
    return {
      symbol: a.symbol,
      amount: parseFloat(a.amount),
      priceUSD: price,
      loanToValue: params?.loanToValue ?? 0.50,
      liquidationThreshold: params?.liquidationThreshold ?? 0.60,
      liquidationPenalty: params?.liquidationPenalty ?? 0.10,
      collateralTier: params?.collateralTier ?? 'crypto',
    };
  });
}

export function requestBorrow(
  partyId: string,
  params: BorrowRequest,
): { data: BorrowResponse; transaction: TransactionMeta } {
  log.info({ partyId, params }, 'Processing borrow request');

  // 1. Get composite credit score for tier-based adjustments
  let tier: CreditTier = 'Unrated';
  let rateDiscount = 0;
  let tierMaxLTV = 0.65;
  try {
    const compositeScore = compositeCreditService.getCompositeScore(partyId);
    tier = compositeScore.tier;
    rateDiscount = compositeScore.benefits.rateDiscount;
    tierMaxLTV = compositeScore.benefits.maxLTV;
  } catch (err) {
    log.warn({ partyId, err }, 'Failed to get composite score, using defaults');
  }

  // 2. Build collateral position inputs with proper params
  const collateralInputs = buildCollateralInputs(params.collateralAssets);

  // 3. Build debt for this borrow
  const borrowAmount = parseFloat(params.borrowAmount);
  const poolAsset = POOL_ASSETS[params.lendingPoolId] ?? 'USDC';
  const borrowPrice = COLLATERAL_PRICES[poolAsset] ?? 1;
  const borrowAmountUSD = borrowAmount * borrowPrice;

  // 4. Check max borrowable using proper math
  const existingDebts: DebtPositionInput[] = [];
  const maxBorrowableUSD = calculateMaxBorrowable(collateralInputs, existingDebts, tierMaxLTV);

  if (borrowAmountUSD > maxBorrowableUSD) {
    throw new Error(`INSUFFICIENT_COLLATERAL: Max borrowable: $${maxBorrowableUSD.toFixed(2)}`);
  }

  // 5. Preview health factor with the new borrow
  const newDebt: DebtPositionInput = {
    symbol: poolAsset,
    amount: borrowAmount,
    priceUSD: borrowPrice,
  };

  const previewHF = calculateHealthFactor(collateralInputs, [newDebt]) as HealthFactorResult;

  // 6. Safety check — don't allow borrow that would put HF below 1.2
  if (previewHF.value < 1.2) {
    throw new Error(`HEALTH_FACTOR_TOO_LOW: Projected HF: ${previewHF.value.toFixed(2)} (min: 1.20)`);
  }

  // 7. Calculate tier-adjusted borrow APY
  const model = getRateModel(poolAsset);
  const utilization = 0.72; // would come from pool state in production
  const borrowAPY = calculatePoolAPY(model, utilization, 'borrow', rateDiscount);

  log.debug(
    { tier, rateDiscount, borrowAPY, healthFactor: previewHF.value },
    'Borrow approved with tier-adjusted rate',
  );

  return {
    data: {
      borrowPositionId: `borrow-pos-${randomUUID().slice(0, 8)}`,
      collateralPositionId: `collateral-pos-${randomUUID().slice(0, 8)}`,
      borrowedAmount: params.borrowAmount,
      healthFactor: {
        value: previewHF.value,
        collateralValueUSD: previewHF.collateralValueUSD,
        borrowValueUSD: previewHF.borrowValueUSD,
        weightedLTV: previewHF.weightedLTV,
      },
      creditTier: tier,
      borrowAPY: Number(borrowAPY.toFixed(4)),
    },
    transaction: buildTransactionMeta(),
  };
}

export function getPositions(
  partyId: string,
): BorrowPositionItem[] {
  log.debug({ partyId }, 'Getting borrow positions');
  return MOCK_POSITIONS;
}

export function repay(
  partyId: string,
  positionId: string,
  amount: string,
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
        (position.healthFactor.collateralValueUSD / remaining).toFixed(2),
      ),
    },
    transaction: buildTransactionMeta(),
  };
}

export function addCollateral(
  partyId: string,
  positionId: string,
  asset: { symbol: string; amount: string },
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
        (newCollateralValue / position.currentDebt).toFixed(2),
      ),
    },
    transaction: buildTransactionMeta(),
  };
}
