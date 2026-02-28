import { createChildLogger } from '../config/logger.js';
import type {
  BorrowRequest,
  BorrowResponse,
  BorrowPositionItem,
  RepayResponse,
  AddCollateralResponse,
  TransactionMeta,
  TransactionResult,
  TransactionRoutingMode,
  CreditTier,
} from '@dualis/shared';
import {
  calculatePoolAPY,
  calculateMaxBorrowable,
  calculateHealthFactor,
  getCollateralParams,
  type CollateralPositionInput,
  type DebtPositionInput,
  type HealthFactorResult,
} from '@dualis/shared';
import { randomUUID } from 'node:crypto';
import { nanoid } from 'nanoid';
import { env } from '../config/env.js';
import { cantonConfig } from '../config/canton-env.js';
import { CantonClient } from '../canton/client.js';
import * as cantonQueries from '../canton/queries.js';
import * as compositeCreditService from './compositeCredit.service.js';
import * as poolService from './pool.service.js';
import * as registry from './poolRegistry.js';
import { trackActivity } from './reward-tracker.service.js';
import { getDb, schema } from '../db/client.js';
import * as tokenBalanceService from './tokenBalance.service.js';
import * as transactionRouterService from './transactionRouter.service.js';
import { registerPostSignCallback } from './transactionRouter.service.js';

const log = createChildLogger('borrow-service');

function buildTransactionMeta(): TransactionMeta {
  return {
    id: `tx-${randomUUID()}`,
    status: 'confirmed',
    timestamp: new Date().toISOString(),
  };
}

/** Fire-and-forget Canton transaction log. */
function logTransaction(opts: {
  userId?: string | undefined;
  partyId: string;
  templateId: string;
  choiceName: string;
  amountUsd: number;
  txHash?: string;
}): void {
  const db = getDb();
  if (!db || !opts.userId) return;
  db.insert(schema.transactionLogs)
    .values({
      transactionLogId: `txl_${nanoid(16)}`,
      userId: opts.userId,
      partyId: opts.partyId,
      templateId: opts.templateId,
      choiceName: opts.choiceName,
      routingMode: 'proxy',
      status: 'confirmed',
      txHash: opts.txHash ?? null,
      amountUsd: opts.amountUsd.toFixed(2),
      confirmedAt: new Date(),
    })
    .catch((err: unknown) => log.warn({ err }, 'Failed to log transaction'));
}

/**
 * Resolve asset price — uses pool registry first, then known extras.
 * New pools added at runtime are automatically covered.
 */
function getAssetPrice(symbol: string): number {
  return registry.getAssetPriceMap()[symbol] ?? 1;
}

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
    lendingPoolId: 'tbill-2026',
    borrowedAsset: { symbol: 'T-BILL-2026', type: 'TokenizedTreasury', priceUSD: 99.87 },
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
 * Prices are resolved dynamically from the pool registry.
 */
function buildCollateralInputs(
  collateralAssets: Array<{ symbol: string; amount: string }>,
): CollateralPositionInput[] {
  return collateralAssets.map(a => {
    const params = getCollateralParams(a.symbol);
    const price = getAssetPrice(a.symbol);
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

export async function requestBorrow(
  partyId: string,
  params: BorrowRequest,
  userId?: string | undefined,
  routingMode?: TransactionRoutingMode,
  walletParty?: string,
): Promise<{ data: BorrowResponse; transaction: TransactionMeta } | TransactionResult> {
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

  // 3. Build debt for this borrow — derive asset from registry dynamically
  const borrowAmount = parseFloat(params.borrowAmount);
  const poolAsset = registry.getPoolAssetSymbol(params.lendingPoolId) ?? 'USDC';
  const borrowPrice = getAssetPrice(poolAsset);
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

  // 7. Calculate tier-adjusted borrow APY using real pool utilization
  const model = registry.getPoolRateModel(params.lendingPoolId);
  let utilization = 0.72;
  try {
    const poolDetail = poolService.getPoolDetail(params.lendingPoolId);
    utilization = poolDetail.utilization;
  } catch { /* use default */ }
  const borrowAPY = calculatePoolAPY(model, utilization, 'borrow', rateDiscount);

  log.debug(
    { tier, rateDiscount, borrowAPY, healthFactor: previewHF.value },
    'Borrow approved with tier-adjusted rate',
  );

  // ---------- Canton mode: exercise RecordBorrow on LendingPool ----------
  if (!env.CANTON_MOCK) {
    const client = CantonClient.getInstance();
    const pool = registry.getPool(params.lendingPoolId);
    if (!pool) throw new Error(`Pool ${params.lendingPoolId} not found`);

    // RecordBorrow updates totalBorrow on the LendingPool contract
    const result = await client.exerciseChoice(
      'Dualis.Lending.Pool:LendingPool',
      pool.contractId,
      'RecordBorrow',
      { borrowAmount: params.borrowAmount },
    );

    // Update local pool contract ID
    let newPoolCid = pool.contractId;
    const events = result.events ?? [];
    for (const event of events) {
      const created = (event as Record<string, unknown>).CreatedEvent as Record<string, unknown> | undefined;
      if (!created) continue;
      const tid = (created.templateId as string) ?? '';
      if (tid.includes('LendingPool')) {
        newPoolCid = (created.contractId as string) ?? newPoolCid;
      }
    }
    if (newPoolCid === pool.contractId) {
      try {
        const fresh = await cantonQueries.getPoolByKey(params.lendingPoolId);
        if (fresh) newPoolCid = fresh.contractId;
      } catch { /* fallthrough */ }
    }
    pool.contractId = newPoolCid;
    pool.totalBorrow += borrowAmount;

    const operatorParty = cantonConfig().parties.operator;
    const collateralCfg = getCollateralParams(poolAsset);

    // Build the full BorrowPosition create payload
    const borrowPositionPayload = {
      operator: operatorParty,
      borrower: operatorParty,
      positionId: `borrow-pos-${randomUUID().slice(0, 8)}`,
      poolId: params.lendingPoolId,
      borrowedAsset: {
        symbol: poolAsset,
        instrumentType: pool.asset.type,
        priceUSD: Number(borrowPrice).toFixed(10),
        decimals: 6,
      },
      borrowedAmountPrincipal: params.borrowAmount,
      borrowIndexAtEntry: pool.borrowIndex.toFixed(10),
      collateralRefs: params.collateralAssets.map(a => ({
        vaultId: `vault-${randomUUID().slice(0, 8)}`,
        symbol: a.symbol,
        amount: a.amount,
        valueUSD: (parseFloat(a.amount) * getAssetPrice(a.symbol)).toFixed(10),
      })),
      creditTier: tier,
      tierParams: {
        maxLTV: Number(tierMaxLTV).toFixed(10),
        rateDiscount: Number(rateDiscount).toFixed(10),
        minCollateralRatio: Number(collateralCfg?.liquidationThreshold ?? 1.25).toFixed(10),
        liquidationBuffer: Number(collateralCfg?.liquidationPenalty ?? 0.05).toFixed(10),
      },
      lastHealthFactor: {
        value: previewHF.value.toFixed(10),
        collateralValueUSD: previewHF.collateralValueUSD.toFixed(10),
        weightedCollateralUSD: (previewHF.weightedCollateralValueUSD ?? previewHF.collateralValueUSD).toFixed(10),
        borrowValueUSD: previewHF.borrowValueUSD.toFixed(10),
        weightedLTV: previewHF.weightedLTV.toFixed(10),
        status: previewHF.value <= 1.0 ? 'HFLiquidatable'
          : previewHF.value <= 1.2 ? 'HFDanger'
          : previewHF.value <= 1.5 ? 'HFCaution'
          : previewHF.value <= 2.0 ? 'HFHealthy'
          : 'HFSafe',
      },
      borrowTimestamp: new Date().toISOString(),
      lastUpdateTimestamp: new Date().toISOString(),
      isActive: true,
      isLiquidatable: false,
    };

    // ── Wallet-sign mode: return signing payload for wallet approval ──
    if (routingMode === 'wallet-sign' && userId) {
      const txResult = await transactionRouterService.routeTransaction(userId, {
        templateId: 'Dualis.Lending.Borrow:BorrowPosition',
        choiceName: 'CreateBorrow',
        argument: borrowPositionPayload,
        commandType: 'create',
        forceRoutingMode: 'wallet-sign',
        amountUsd: String(borrowAmountUSD),
        ...(walletParty ? { walletParty } : {}),
      });
      return txResult;
    }

    // ── Proxy mode: create contract directly ──
    // Only operatorParty in actAs — external wallet parties are not on our participant
    const borrowPosResult = await client.createContract(
      'Dualis.Lending.Borrow:BorrowPosition',
      borrowPositionPayload,
      { actAs: [operatorParty] },
    );

    // Fire-and-forget reward tracking
    void trackActivity({
      activityType: 'borrow',
      userId,
      partyId,
      poolId: params.lendingPoolId,
      asset: poolAsset,
      amount: borrowAmountUSD,
    });

    // Fire-and-forget transaction log
    logTransaction({
      userId,
      partyId,
      templateId: 'Dualis.Lending.Borrow:BorrowPosition',
      choiceName: 'CreateBorrow',
      amountUsd: borrowAmountUSD,
    });

    return {
      data: {
        borrowPositionId: borrowPosResult.contractId,
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

  // ---------- Mock mode ----------

  // Fire-and-forget reward tracking (mock mode)
  void trackActivity({
    activityType: 'borrow',
    userId,
    partyId: cantonConfig().parties.operator,
    poolId: params.lendingPoolId,
    asset: poolAsset,
    amount: borrowAmountUSD,
  });

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

export async function getPositions(
  partyId: string,
): Promise<BorrowPositionItem[]> {
  log.debug({ partyId }, 'Getting borrow positions');

  // ---------- Canton mode: query real BorrowPosition contracts ----------
  if (!env.CANTON_MOCK) {
    try {
      // In proxy mode, operator is the borrower — query by operator party
      const borrower = cantonConfig().parties.operator || partyId;
      const contracts = await cantonQueries.getUserPositions(borrower);

      return contracts.map((c) => {
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

        // Use oracle price from registry instead of stale Canton bootstrap price
        const assetSymbol = (asset?.symbol as string) ?? 'UNKNOWN';
        const oraclePrice = registry.getAssetPriceMap()[assetSymbol];
        const assetPrice = oraclePrice && oraclePrice > 0
          ? oraclePrice
          : parseFloat((asset?.priceUSD as string) ?? '1');

        return {
          positionId: (p.positionId as string) ?? c.contractId,
          lendingPoolId: poolId,
          borrowedAsset: {
            symbol: assetSymbol,
            type: (asset?.instrumentType as string) ?? 'CryptoCurrency',
            priceUSD: assetPrice,
          },
          borrowedAmountPrincipal: principal,
          currentDebt,
          interestAccrued,
          healthFactor: {
            value: parseFloat((hf?.value as string) ?? '1'),
            collateralValueUSD: parseFloat((hf?.collateralValueUSD as string) ?? '0'),
            weightedCollateralValueUSD: parseFloat((hf?.weightedCollateralValueUSD as string) ?? (hf?.collateralValueUSD as string) ?? '0'),
            borrowValueUSD: parseFloat((hf?.borrowValueUSD as string) ?? '0'),
            weightedLTV: parseFloat((hf?.weightedLTV as string) ?? '0'),
          },
          creditTier: (p.creditTier as CreditTier) ?? 'Unrated',
          isLiquidatable: (p.isLiquidatable as boolean) ?? false,
          collateral: collRefs.map(ref => ({
            symbol: (ref.symbol as string) ?? '',
            amount: (ref.amount as string) ?? '0',
            valueUSD: parseFloat((ref.valueUSD as string) ?? '0'),
          })),
          borrowTimestamp: (p.borrowTimestamp as string) ?? new Date().toISOString(),
          contractId: c.contractId,
        };
      });
    } catch (err) {
      log.warn({ partyId, err }, 'Failed to query Canton borrow positions, falling back to mock');
      // Don't silently fall back when CANTON_MOCK=false — throw instead
      throw new Error('Failed to query borrow positions from Canton ledger');
    }
  }

  // ---------- Mock mode ----------
  return MOCK_POSITIONS;
}

export async function repay(
  partyId: string,
  positionId: string,
  amount: string,
  userId?: string | undefined,
  routingMode?: TransactionRoutingMode,
  walletParty?: string,
  walletTransferConfirmed?: boolean,
  walletTxHash?: string,
): Promise<{ data: RepayResponse; transaction: TransactionMeta } | TransactionResult> {
  log.info({ partyId, positionId, amount, walletTransferConfirmed, walletTxHash }, 'Processing repayment');

  const repayAmountNum = parseFloat(amount);
  if (isNaN(repayAmountNum) || repayAmountNum <= 0) throw new Error('Invalid repay amount');

  // ── Balance check: ensure user has enough tokens to repay ──
  // Determine the borrow asset from the position's pool
  // We'll look up pool after finding the position, but can do a preliminary check if pool known
  // For now, defer full check until after position lookup (need poolId to find symbol)

  // ---------- Canton mode ----------
  if (!env.CANTON_MOCK) {
    const client = CantonClient.getInstance();
    const operatorParty = cantonConfig().parties.operator;

    // Find the BorrowPosition contract — in proxy mode, borrower = operator
    const borrower = operatorParty || partyId;
    const positions = await cantonQueries.getUserPositions(borrower);
    const posContract = positions.find(c => {
      const p = c.payload as unknown as Record<string, unknown>;
      return (p.positionId as string) === positionId || c.contractId === positionId;
    });

    if (!posContract) {
      throw new Error(`Position ${positionId} not found`);
    }

    const payload = posContract.payload as unknown as Record<string, unknown>;
    const poolId = (payload.poolId as string) ?? '';
    const pool = registry.getPool(poolId);
    const currentBorrowIndex = pool ? pool.borrowIndex.toFixed(10) : '1.0000000000';

    // Balance check: skip when wallet already transferred tokens via Console Wallet popup
    if (!walletTransferConfirmed && pool) {
      const walletBalance = await tokenBalanceService.getWalletTokenBalance(partyId, pool.asset.symbol);
      if (walletBalance < repayAmountNum) {
        throw new Error(
          `Insufficient ${pool.asset.symbol} balance for repayment: you have ${walletBalance.toFixed(4)} but need ${repayAmountNum.toFixed(4)}`,
        );
      }
    }

    // ── Wallet-sign mode: return signing payload for wallet approval ──
    if (routingMode === 'wallet-sign' && userId) {
      const txResult = await transactionRouterService.routeTransaction(userId, {
        templateId: 'Dualis.Lending.Borrow:BorrowPosition',
        choiceName: 'Repay',
        argument: {
          repayAmount: parseFloat(amount).toFixed(10),
          currentBorrowIndex,
          repayTime: new Date().toISOString(),
        },
        contractId: posContract.contractId,
        forceRoutingMode: 'wallet-sign',
        amountUsd: String(repayAmountNum * (parseFloat(((payload.borrowedAsset as Record<string, unknown>)?.priceUSD as string) ?? '1'))),
        compoundOp: 'repay',
        compoundMeta: { poolId, amount, partyId },
        ...(walletParty ? { walletParty } : {}),
      });
      return txResult;
    }

    // ── Proxy mode: exercise choice directly ──
    // Only operatorParty in actAs — external wallet parties are not on our participant
    await client.exerciseChoice(
      'Dualis.Lending.Borrow:BorrowPosition',
      posContract.contractId,
      'Repay',
      {
        repayAmount: parseFloat(amount).toFixed(10),
        currentBorrowIndex,
        repayTime: new Date().toISOString(),
      },
      { actAs: [operatorParty] },
    );

    // Also exercise RecordRepay on the LendingPool to update totalBorrow
    if (pool) {
      const poolResult = await client.exerciseChoice(
        'Dualis.Lending.Pool:LendingPool',
        pool.contractId,
        'RecordRepay',
        { repayAmount: amount },
      );

      // Update local pool contract ID
      let newPoolCid = pool.contractId;
      const events = poolResult.events ?? [];
      for (const event of events) {
        const created = (event as Record<string, unknown>).CreatedEvent as Record<string, unknown> | undefined;
        if (!created) continue;
        const tid = (created.templateId as string) ?? '';
        if (tid.includes('LendingPool')) {
          newPoolCid = (created.contractId as string) ?? newPoolCid;
        }
      }
      if (newPoolCid === pool.contractId) {
        try {
          const fresh = await cantonQueries.getPoolByKey(poolId);
          if (fresh) newPoolCid = fresh.contractId;
        } catch { /* fallthrough */ }
      }
      pool.contractId = newPoolCid;
      pool.totalBorrow = Math.max(0, pool.totalBorrow - parseFloat(amount));
    }

    const principal = parseFloat((payload.borrowedAmountPrincipal as string) ?? '0');
    const repayAmount = parseFloat(amount);
    const remaining = Math.max(0, principal - repayAmount);
    const collateralValueUSD = parseFloat(
      ((payload.lastHealthFactor as Record<string, unknown>)?.collateralValueUSD as string) ?? '0',
    );

    // Fire-and-forget reward tracking
    const borrowedAsset = payload.borrowedAsset as Record<string, unknown> | undefined;
    const repayAsset = (borrowedAsset?.symbol as string) ?? 'USDC';
    const repayPriceUSD = parseFloat((borrowedAsset?.priceUSD as string) ?? '1');
    void trackActivity({
      activityType: 'repay',
      userId,
      partyId,
      poolId,
      asset: repayAsset,
      amount: repayAmount * repayPriceUSD,
    });

    // Fire-and-forget transaction log
    logTransaction({
      userId,
      partyId,
      templateId: 'Dualis.Lending.Borrow:BorrowPosition',
      choiceName: 'Repay',
      amountUsd: repayAmount * repayPriceUSD,
    });

    return {
      data: {
        remainingDebt: Number(remaining.toFixed(2)),
        newHealthFactor: remaining === 0 ? Infinity : Number(
          (collateralValueUSD / remaining).toFixed(2),
        ),
      },
      transaction: buildTransactionMeta(),
    };
  }

  // ---------- Mock mode ----------
  const position = MOCK_POSITIONS.find((p) => p.positionId === positionId);
  if (!position) {
    throw new Error(`Position ${positionId} not found`);
  }

  const repayAmount = parseFloat(amount);
  const remaining = Math.max(0, position.currentDebt - repayAmount);

  // Fire-and-forget reward tracking (mock mode)
  void trackActivity({
    activityType: 'repay',
    userId,
    partyId: cantonConfig().parties.operator,
    poolId: position.lendingPoolId,
    asset: position.borrowedAsset.symbol,
    amount: repayAmount * position.borrowedAsset.priceUSD,
  });

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

export async function addCollateral(
  partyId: string,
  positionId: string,
  asset: { symbol: string; amount: string },
  userId?: string | undefined,
  routingMode?: TransactionRoutingMode,
  walletParty?: string,
  walletTransferConfirmed?: boolean,
  walletTxHash?: string,
): Promise<{ data: AddCollateralResponse; transaction: TransactionMeta } | TransactionResult> {
  log.info({ partyId, positionId, asset, walletTransferConfirmed, walletTxHash }, 'Adding collateral');

  // ── Balance check: skip when wallet already transferred tokens via Console Wallet popup ──
  const collateralAmount = parseFloat(asset.amount);
  if (isNaN(collateralAmount) || collateralAmount <= 0) throw new Error('Invalid collateral amount');

  if (!walletTransferConfirmed) {
    const walletBalance = await tokenBalanceService.getWalletTokenBalance(partyId, asset.symbol);
    if (walletBalance < collateralAmount) {
      throw new Error(
        `Insufficient ${asset.symbol} balance for collateral: you have ${walletBalance.toFixed(4)} but need ${collateralAmount.toFixed(4)}`,
      );
    }
  }

  // ---------- Canton mode ----------
  if (!env.CANTON_MOCK) {
    const client = CantonClient.getInstance();
    const operatorParty = cantonConfig().parties.operator;

    // Find the BorrowPosition contract — in proxy mode, borrower = operator
    const borrower = operatorParty || partyId;
    const positions = await cantonQueries.getUserPositions(borrower);
    const posContract = positions.find(c => {
      const p = c.payload as unknown as Record<string, unknown>;
      return (p.positionId as string) === positionId || c.contractId === positionId;
    });

    if (!posContract) {
      throw new Error(`Position ${positionId} not found`);
    }

    const addedValueUSD = parseFloat(asset.amount) * getAssetPrice(asset.symbol);

    // ── Wallet-sign mode: return signing payload for wallet approval ──
    if (routingMode === 'wallet-sign' && userId) {
      const txResult = await transactionRouterService.routeTransaction(userId, {
        templateId: 'Dualis.Lending.Borrow:BorrowPosition',
        choiceName: 'AddCollateral',
        argument: {
          newCollateralRef: {
            vaultId: `vault-${randomUUID().slice(0, 8)}`,
            symbol: asset.symbol,
            amount: asset.amount,
            valueUSD: addedValueUSD.toFixed(10),
          },
          updateTime: new Date().toISOString(),
        },
        contractId: posContract.contractId,
        forceRoutingMode: 'wallet-sign',
        amountUsd: String(addedValueUSD),
        ...(walletParty ? { walletParty } : {}),
      });
      return txResult;
    }

    // ── Proxy mode: exercise choice directly ──
    await client.exerciseChoice(
      'Dualis.Lending.Borrow:BorrowPosition',
      posContract.contractId,
      'AddCollateral',
      {
        newCollateralRef: {
          vaultId: `vault-${randomUUID().slice(0, 8)}`,
          symbol: asset.symbol,
          amount: asset.amount,
          valueUSD: addedValueUSD.toFixed(10),
        },
        updateTime: new Date().toISOString(),
      },
      { actAs: [operatorParty] },
    );

    const payload = posContract.payload as unknown as Record<string, unknown>;
    const hf = payload.lastHealthFactor as Record<string, unknown> | undefined;
    const currentCollateralValue = parseFloat((hf?.collateralValueUSD as string) ?? '0');
    const currentDebt = parseFloat((payload.borrowedAmountPrincipal as string) ?? '0');
    const newCollateralValue = currentCollateralValue + addedValueUSD;

    // Fire-and-forget reward tracking
    void trackActivity({
      activityType: 'add_collateral',
      userId,
      partyId,
      asset: asset.symbol,
      amount: addedValueUSD,
    });

    // Fire-and-forget transaction log
    logTransaction({
      userId,
      partyId,
      templateId: 'Dualis.Lending.Borrow:BorrowPosition',
      choiceName: 'AddCollateral',
      amountUsd: addedValueUSD,
    });

    return {
      data: {
        newCollateralValueUSD: Number(newCollateralValue.toFixed(2)),
        newHealthFactor: currentDebt === 0 ? Infinity : Number(
          (newCollateralValue / currentDebt).toFixed(2),
        ),
      },
      transaction: buildTransactionMeta(),
    };
  }

  // ---------- Mock mode ----------
  const position = MOCK_POSITIONS.find((p) => p.positionId === positionId);
  if (!position) {
    throw new Error(`Position ${positionId} not found`);
  }

  const addedValueUSD = parseFloat(asset.amount) * getAssetPrice(asset.symbol);
  const newCollateralValue = position.healthFactor.collateralValueUSD + addedValueUSD;

  // Fire-and-forget reward tracking (mock mode)
  void trackActivity({
    activityType: 'add_collateral',
    userId,
    partyId: cantonConfig().parties.operator,
    asset: asset.symbol,
    amount: addedValueUSD,
  });

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

// ---------------------------------------------------------------------------
// Post-Sign Callbacks — execute server-side logic after user signs
// ---------------------------------------------------------------------------

registerPostSignCallback('repay', async (_txLogId, metadata) => {
  const compoundMeta = metadata.compoundMeta as { poolId: string; amount: string; partyId: string } | undefined;
  if (!compoundMeta) return;

  const { poolId, amount } = compoundMeta;
  const pool = registry.getPool(poolId);
  if (!pool) return;

  try {
    const client = CantonClient.getInstance();
    const poolResult = await client.exerciseChoice(
      'Dualis.Lending.Pool:LendingPool',
      pool.contractId,
      'RecordRepay',
      { repayAmount: amount },
    );

    // Update local pool contract ID
    let newPoolCid = pool.contractId;
    const events = poolResult.events ?? [];
    for (const event of events) {
      const created = (event as Record<string, unknown>).CreatedEvent as Record<string, unknown> | undefined;
      if (!created) continue;
      const tid = (created.templateId as string) ?? '';
      if (tid.includes('LendingPool')) {
        newPoolCid = (created.contractId as string) ?? newPoolCid;
      }
    }
    if (newPoolCid === pool.contractId) {
      try {
        const fresh = await cantonQueries.getPoolByKey(poolId);
        if (fresh) newPoolCid = fresh.contractId;
      } catch { /* fallthrough */ }
    }
    pool.contractId = newPoolCid;
    pool.totalBorrow = Math.max(0, pool.totalBorrow - parseFloat(amount));

    log.info({ poolId, amount }, 'Post-sign RecordRepay executed on pool');
  } catch (err) {
    log.warn({ poolId, amount, err: err instanceof Error ? err.message : 'unknown' }, 'Post-sign RecordRepay failed');
  }
});
