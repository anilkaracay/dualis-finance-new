import { createChildLogger } from '../config/logger.js';
import type {
  ListPoolsParams,
  PoolListItem,
  PoolDetail,
  PoolHistoryPoint,
  DepositResponse,
  WithdrawResponse,
  Pagination,
  TransactionMeta,
} from '@dualis/shared';
import {
  calculateUtilization,
  calculatePoolAPY,
  accrueInterest,
  getCollateralParams,
} from '@dualis/shared';
import { randomUUID } from 'node:crypto';
import { nanoid } from 'nanoid';
import { env } from '../config/env.js';
import { cantonConfig } from '../config/canton-env.js';
import { CantonClient } from '../canton/client.js';
import * as cantonQueries from '../canton/queries.js';
import * as registry from './poolRegistry.js';
import { trackActivity } from './reward-tracker.service.js';
import { getDb, schema } from '../db/client.js';
import * as tokenBalanceService from './tokenBalance.service.js';
import { getTokenBridge } from '../canton/startup.js';
import * as transactionRouterService from './transactionRouter.service.js';
import type { TransactionResult, TransactionRoutingMode } from '@dualis/shared';

const log = createChildLogger('pool-service');

// ─── Helpers ────────────────────────────────────────────────────────────────

function accruePoolInterest(pool: registry.PoolState): void {
  const model = registry.getPoolRateModel(pool.poolId);

  const now = Math.floor(Date.now() / 1000);
  const result = accrueInterest(
    model,
    pool.totalBorrow,
    pool.totalSupply,
    pool.totalReserves,
    pool.borrowIndex,
    pool.supplyIndex,
    pool.lastAccrualTs,
    now,
  );

  pool.totalBorrow = result.newTotalBorrows;
  pool.totalReserves = result.newTotalReserves;
  pool.borrowIndex = result.newBorrowIndex;
  pool.supplyIndex = result.newSupplyIndex;
  pool.lastAccrualTs = now;
}

function poolToListItem(pool: registry.PoolState): PoolListItem {
  const model = registry.getPoolRateModel(pool.poolId);
  const utilization = calculateUtilization(pool.totalBorrow, pool.totalSupply);

  return {
    poolId: pool.poolId,
    asset: pool.asset,
    totalSupply: pool.totalSupply,
    totalSupplyUSD: pool.totalSupply * pool.asset.priceUSD,
    totalBorrow: pool.totalBorrow,
    totalBorrowUSD: pool.totalBorrow * pool.asset.priceUSD,
    totalReserves: pool.totalReserves,
    utilization,
    supplyAPY: calculatePoolAPY(model, utilization, 'supply'),
    borrowAPY: calculatePoolAPY(model, utilization, 'borrow'),
    isActive: pool.isActive,
    contractId: pool.contractId,
  };
}

function buildTransactionMeta(): TransactionMeta {
  return {
    id: `tx-${randomUUID()}`,
    status: 'confirmed',
    timestamp: new Date().toISOString(),
  };
}

function generateHistoryPoints(poolId: string, period: string): PoolHistoryPoint[] {
  const pool = registry.getPool(poolId);
  if (!pool) return [];

  const now = Date.now();
  const periodDays: Record<string, number> = {
    '7d': 7, '30d': 30, '90d': 90, '1y': 365, all: 365,
  };
  const days = periodDays[period] ?? 30;
  const points: PoolHistoryPoint[] = [];
  const model = registry.getPoolRateModel(poolId);

  for (let i = days; i >= 0; i--) {
    const ts = new Date(now - i * 86_400_000);
    const jitter = 1 + (Math.sin(i * 0.3) * 0.05);
    const simSupply = pool.totalSupply * jitter;
    const simBorrow = pool.totalBorrow * jitter * 0.98;
    const simUtil = calculateUtilization(simBorrow, simSupply);

    points.push({
      timestamp: ts.toISOString(),
      totalSupply: Math.round(simSupply),
      totalBorrow: Math.round(simBorrow),
      supplyAPY: Number(calculatePoolAPY(model, simUtil, 'supply').toFixed(4)),
      borrowAPY: Number(calculatePoolAPY(model, simUtil, 'borrow').toFixed(4)),
      utilization: Number(simUtil.toFixed(4)),
      priceUSD: Number((pool.asset.priceUSD * (1 + Math.sin(i * 0.2) * 0.02)).toFixed(2)),
    });
  }

  return points;
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

// ─── Public API ─────────────────────────────────────────────────────────────

export function listPools(
  params: ListPoolsParams,
): { data: PoolListItem[]; pagination: Pagination } {
  log.debug({ params }, 'Listing pools');

  const allPools = registry.getAllPools();

  // Accrue interest on all pools before returning
  for (const pool of allPools) {
    accruePoolInterest(pool);
  }

  let filtered = allPools.map(poolToListItem);

  if (params.assetType && params.assetType !== 'all') {
    const typeMap: Record<string, string> = {
      stablecoin: 'Stablecoin',
      crypto: 'CryptoCurrency',
      treasury: 'TokenizedTreasury',
      rwa: 'TokenizedReceivable',
    };
    const mappedType = typeMap[params.assetType];
    if (mappedType) {
      filtered = filtered.filter((p) => p.asset.type === mappedType);
    }
  }

  if (params.sortBy) {
    const dir = params.sortOrder === 'desc' ? -1 : 1;
    filtered.sort((a, b) => {
      const key = params.sortBy as keyof PoolListItem;
      const av = a[key];
      const bv = b[key];
      if (typeof av === 'number' && typeof bv === 'number') {
        return (av - bv) * dir;
      }
      return 0;
    });
  }

  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;
  const total = filtered.length;
  const page = filtered.slice(offset, offset + limit);

  return {
    data: page,
    pagination: { total, limit, offset, hasMore: offset + limit < total },
  };
}

export function getPoolDetail(poolId: string): PoolDetail {
  log.debug({ poolId }, 'Getting pool detail');
  const pool = registry.getPool(poolId);
  if (!pool) throw new Error(`Pool ${poolId} not found`);

  // Accrue interest before returning detail
  accruePoolInterest(pool);

  const model = registry.getPoolRateModel(poolId);
  const listItem = poolToListItem(pool);

  // Dynamic collateral config from shared config (falls back to sensible defaults)
  const collateralCfg = getCollateralParams(pool.asset.symbol);
  const collateralConfig = {
    loanToValue: collateralCfg?.loanToValue ?? 0.75,
    liquidationThreshold: collateralCfg?.liquidationThreshold ?? 0.82,
    liquidationPenalty: collateralCfg?.liquidationPenalty ?? 0.05,
    borrowCap: collateralCfg?.borrowCap ?? listItem.totalSupplyUSD * 0.85,
  };

  return {
    ...listItem,
    available: pool.totalSupply - pool.totalBorrow,
    interestRateModel: {
      type: model.type,
      baseRate: model.baseRate,
      multiplier: model.multiplier,
      kink: model.kink,
      jumpMultiplier: model.jumpMultiplier,
    },
    collateralConfig,
    accumulatedBorrowIndex: pool.borrowIndex,
    accumulatedSupplyIndex: pool.supplyIndex,
    lastAccrualTimestamp: new Date(pool.lastAccrualTs * 1000).toISOString(),
  };
}

export function getPoolHistory(poolId: string, period: string): PoolHistoryPoint[] {
  log.debug({ poolId, period }, 'Getting pool history');
  if (!registry.hasPool(poolId)) {
    throw new Error(`Pool ${poolId} not found`);
  }
  return generateHistoryPoints(poolId, period);
}

export async function deposit(
  poolId: string,
  userPartyId: string,
  amount: string,
  userId?: string | undefined,
  routingMode?: TransactionRoutingMode,
): Promise<{ data: DepositResponse; transaction: TransactionMeta } | TransactionResult> {
  log.info({ poolId, userPartyId, amount, routingMode }, 'Processing deposit');
  const pool = registry.getPool(poolId);
  if (!pool) throw new Error(`Pool ${poolId} not found`);

  // Accrue interest before modifying state
  accruePoolInterest(pool);

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) throw new Error('Invalid deposit amount');

  // ── Balance check: ensure user has enough tokens to deposit ──
  const walletBalance = await tokenBalanceService.getWalletTokenBalance(userPartyId, pool.asset.symbol);
  if (walletBalance < amountNum) {
    throw new Error(
      `Insufficient ${pool.asset.symbol} balance: you have ${walletBalance.toFixed(4)} but tried to deposit ${amountNum.toFixed(4)}`,
    );
  }

  // ── Wallet-sign mode: prepare signing payload, return to frontend ──
  if (routingMode === 'wallet-sign' && userId) {
    const txResult = await transactionRouterService.routeTransaction(userId, {
      templateId: 'Dualis.Lending.Pool:LendingPool',
      choiceName: 'Deposit',
      argument: {
        depositor: userPartyId,
        amount: amountNum.toFixed(10),
        depositTime: new Date().toISOString(),
      },
      contractId: pool.contractId,
      forceRoutingMode: 'wallet-sign',
      amountUsd: String(amountNum * pool.asset.priceUSD),
    });
    return txResult;
  }

  // ---------- Canton mode: exercise Deposit choice on LendingPool ----------
  if (!env.CANTON_MOCK) {
    const client = CantonClient.getInstance();
    const operatorParty = cantonConfig().parties.operator;

    // Deposit choice: controller depositor — needs actAs [operator, user]
    const result = await client.exerciseChoice(
      'Dualis.Lending.Pool:LendingPool',
      pool.contractId,
      'Deposit',
      {
        depositor: userPartyId,
        amount: parseFloat(amount).toFixed(10),
        depositTime: new Date().toISOString(),
      },
      { actAs: [operatorParty, userPartyId] },
    );

    // Extract created contract IDs from the response events
    let newPoolContractId = pool.contractId;
    let positionContractId = '';
    const events = result.events ?? [];
    for (const event of events) {
      const created = (event as Record<string, unknown>).CreatedEvent as Record<string, unknown> | undefined;
      if (!created) continue;
      const tid = (created.templateId as string) ?? '';
      if (tid.includes('SupplyPosition')) {
        positionContractId = (created.contractId as string) ?? '';
      } else if (tid.includes('LendingPool')) {
        newPoolContractId = (created.contractId as string) ?? '';
      }
    }

    // Update pool contract ID (Deposit archives old pool, creates new one)
    // If events didn't provide a new ID, re-query Canton for the fresh contract
    if (newPoolContractId === pool.contractId) {
      try {
        const fresh = await cantonQueries.getPoolByKey(poolId);
        if (fresh) newPoolContractId = fresh.contractId;
      } catch { /* fallthrough — keep existing ID */ }
    }
    pool.contractId = newPoolContractId;
    pool.totalSupply += amountNum;

    const shares = amountNum / (pool.supplyIndex || 1);

    // Debit user wallet: tokens move from user to pool operator
    const bridge = getTokenBridge();
    if (bridge) {
      try {
        await bridge.transfer({
          from: userPartyId,
          to: operatorParty,
          token: { symbol: pool.asset.symbol, amount: amount },
          reference: `deposit-${poolId}-${Date.now()}`,
        });
      } catch (err) {
        log.warn({ err, userPartyId, poolId }, 'Token bridge transfer failed after deposit');
      }
    }

    // Fire-and-forget reward tracking (never fails the main operation)
    void trackActivity({
      activityType: 'deposit',
      userId,
      partyId: userPartyId,
      poolId,
      asset: pool.asset.symbol,
      amount: amountNum * pool.asset.priceUSD,
    });

    // Fire-and-forget transaction log
    logTransaction({
      userId,
      partyId: userPartyId,
      templateId: 'Dualis.Lending.Pool:LendingPool',
      choiceName: 'Deposit',
      amountUsd: amountNum * pool.asset.priceUSD,
    });

    return {
      data: {
        poolContractId: newPoolContractId,
        positionContractId: positionContractId || `canton::position::${poolId}-${randomUUID().slice(0, 8)}`,
        sharesReceived: shares.toFixed(6),
        amountDeposited: amountNum.toFixed(6),
      },
      transaction: buildTransactionMeta(),
    };
  }

  // ---------- Mock mode: in-memory state update ----------
  pool.totalSupply += amountNum;
  const shares = amountNum / (pool.supplyIndex || 1);

  // Debit user wallet (mock mode)
  const mockBridge = getTokenBridge();
  if (mockBridge) {
    try {
      await mockBridge.transfer({
        from: userPartyId,
        to: cantonConfig().parties.operator,
        token: { symbol: pool.asset.symbol, amount: amount },
        reference: `deposit-${poolId}-${Date.now()}`,
      });
    } catch (err) {
      log.warn({ err }, 'Mock token transfer failed after deposit');
    }
  }

  // Fire-and-forget reward tracking (mock mode)
  void trackActivity({
    activityType: 'deposit',
    userId,
    partyId: cantonConfig().parties.operator,
    poolId,
    asset: pool.asset.symbol,
    amount: amountNum * pool.asset.priceUSD,
  });

  return {
    data: {
      poolContractId: pool.contractId,
      positionContractId: `canton::position::${poolId}-${randomUUID().slice(0, 8)}`,
      sharesReceived: shares.toFixed(6),
      amountDeposited: amountNum.toFixed(6),
    },
    transaction: buildTransactionMeta(),
  };
}

export async function withdraw(
  poolId: string,
  userPartyId: string,
  shares: string,
  userId?: string | undefined,
  routingMode?: TransactionRoutingMode,
): Promise<{ data: WithdrawResponse; transaction: TransactionMeta } | TransactionResult> {
  log.info({ poolId, userPartyId, shares, routingMode }, 'Processing withdrawal');
  const pool = registry.getPool(poolId);
  if (!pool) throw new Error(`Pool ${poolId} not found`);

  // Accrue interest before modifying state
  accruePoolInterest(pool);

  const sharesNum = parseFloat(shares);
  if (isNaN(sharesNum) || sharesNum <= 0) throw new Error('Invalid withdrawal amount');

  const withdrawnAmount = sharesNum * (pool.supplyIndex || 1);
  const available = pool.totalSupply - pool.totalBorrow;
  if (withdrawnAmount > available) throw new Error('Insufficient liquidity for withdrawal');

  // ── Wallet-sign mode: prepare signing payload, return to frontend ──
  if (routingMode === 'wallet-sign' && userId) {
    const txResult = await transactionRouterService.routeTransaction(userId, {
      templateId: 'Dualis.Lending.Pool:LendingPool',
      choiceName: 'ProcessWithdraw',
      argument: {
        withdrawAmount: withdrawnAmount.toFixed(10),
      },
      contractId: pool.contractId,
      forceRoutingMode: 'wallet-sign',
      amountUsd: String(withdrawnAmount * pool.asset.priceUSD),
    });
    return txResult;
  }

  // ---------- Canton mode: exercise Withdraw on SupplyPosition + ProcessWithdraw on Pool ----------
  if (!env.CANTON_MOCK) {
    const client = CantonClient.getInstance();
    const operatorParty = cantonConfig().parties.operator;

    // 1. Find user's SupplyPosition for this pool
    const positions = await cantonQueries.getSupplyPositions(userPartyId);
    const userPosition = positions.find(p => {
      const payload = p.payload as Record<string, unknown>;
      return payload.poolId === poolId;
    });

    // 2. Exercise Withdraw on user's SupplyPosition (controller depositor)
    if (userPosition) {
      try {
        await client.exerciseChoice(
          'Dualis.Lending.Pool:SupplyPosition',
          userPosition.contractId,
          'Withdraw',
          {
            currentSupplyIndex: pool.supplyIndex.toFixed(10),
            withdrawAmount: withdrawnAmount.toFixed(10),
            withdrawTime: new Date().toISOString(),
          },
          { actAs: [operatorParty, userPartyId] },
        );
      } catch (err) {
        log.warn({ err, userPartyId, poolId }, 'Failed to exercise Withdraw on SupplyPosition, continuing with pool update');
      }
    } else {
      log.warn({ userPartyId, poolId }, 'No SupplyPosition found for user, proceeding with pool withdrawal only');
    }

    // 3. Update pool state via ProcessWithdraw (controller operator)
    const poolResult = await client.exerciseChoice(
      'Dualis.Lending.Pool:LendingPool',
      pool.contractId,
      'ProcessWithdraw',
      { withdrawAmount: withdrawnAmount.toFixed(10) },
    );

    // Update local pool contract ID (choice archives old pool, creates new one)
    let newCid = pool.contractId;
    const events = poolResult.events ?? [];
    for (const event of events) {
      const created = (event as Record<string, unknown>).CreatedEvent as Record<string, unknown> | undefined;
      if (!created) continue;
      const tid = (created.templateId as string) ?? '';
      if (tid.includes('LendingPool')) {
        newCid = (created.contractId as string) ?? newCid;
      }
    }
    if (newCid === pool.contractId) {
      try {
        const fresh = await cantonQueries.getPoolByKey(poolId);
        if (fresh) newCid = fresh.contractId;
      } catch { /* fallthrough */ }
    }
    pool.contractId = newCid;

    pool.totalSupply -= withdrawnAmount;

    // Credit user wallet: tokens return from pool to user
    const withdrawBridge = getTokenBridge();
    if (withdrawBridge) {
      try {
        await withdrawBridge.transfer({
          from: operatorParty,
          to: userPartyId,
          token: { symbol: pool.asset.symbol, amount: withdrawnAmount.toFixed(10) },
          reference: `withdraw-${poolId}-${Date.now()}`,
        });
      } catch (err) {
        log.warn({ err, userPartyId, poolId }, 'Token bridge transfer failed after withdrawal');
      }
    }

    // Fire-and-forget reward tracking (never fails the main operation)
    void trackActivity({
      activityType: 'withdraw',
      userId,
      partyId: userPartyId,
      poolId,
      asset: pool.asset.symbol,
      amount: withdrawnAmount * pool.asset.priceUSD,
    });

    // Fire-and-forget transaction log
    logTransaction({
      userId,
      partyId: userPartyId,
      templateId: 'Dualis.Lending.Pool:LendingPool',
      choiceName: 'Withdraw',
      amountUsd: withdrawnAmount * pool.asset.priceUSD,
    });

    return {
      data: {
        withdrawnAmount: withdrawnAmount.toFixed(6),
        remainingShares: 0,
      },
      transaction: buildTransactionMeta(),
    };
  }

  // ---------- Mock mode: in-memory state update ----------
  pool.totalSupply -= withdrawnAmount;

  // Credit user wallet (mock mode)
  const mockWithdrawBridge = getTokenBridge();
  if (mockWithdrawBridge) {
    try {
      await mockWithdrawBridge.transfer({
        from: cantonConfig().parties.operator,
        to: userPartyId,
        token: { symbol: pool.asset.symbol, amount: withdrawnAmount.toFixed(10) },
        reference: `withdraw-${poolId}-${Date.now()}`,
      });
    } catch (err) {
      log.warn({ err }, 'Mock token transfer failed after withdrawal');
    }
  }

  // Fire-and-forget reward tracking (mock mode)
  void trackActivity({
    activityType: 'withdraw',
    userId,
    partyId: cantonConfig().parties.operator,
    poolId,
    asset: pool.asset.symbol,
    amount: withdrawnAmount * pool.asset.priceUSD,
  });

  return {
    data: {
      withdrawnAmount: withdrawnAmount.toFixed(6),
      remainingShares: 0,
    },
    transaction: buildTransactionMeta(),
  };
}
