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
import { env } from '../config/env.js';
import { cantonConfig } from '../config/canton-env.js';
import { CantonClient } from '../canton/client.js';
import * as registry from './poolRegistry.js';

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
  _partyId: string,
  amount: string,
): Promise<{ data: DepositResponse; transaction: TransactionMeta }> {
  log.info({ poolId, amount }, 'Processing deposit');
  const pool = registry.getPool(poolId);
  if (!pool) throw new Error(`Pool ${poolId} not found`);

  // Accrue interest before modifying state
  accruePoolInterest(pool);

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) throw new Error('Invalid deposit amount');

  // ---------- Canton mode: exercise Deposit choice on LendingPool ----------
  if (!env.CANTON_MOCK) {
    const client = CantonClient.getInstance();
    const result = await client.exerciseChoice(
      'Dualis.Lending.Pool:LendingPool',
      pool.contractId,
      'Deposit',
      {
        depositor: cantonConfig().parties.operator,
        amount: parseFloat(amount).toFixed(10),
        depositTime: new Date().toISOString(),
      },
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
        const { getPoolByKey } = await import('../canton/queries.js');
        const fresh = await getPoolByKey(poolId);
        if (fresh) newPoolContractId = fresh.contractId;
      } catch { /* fallthrough — keep existing ID */ }
    }
    pool.contractId = newPoolContractId;
    pool.totalSupply += amountNum;

    const shares = amountNum / (pool.supplyIndex || 1);

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
  partyId: string,
  shares: string,
): Promise<{ data: WithdrawResponse; transaction: TransactionMeta }> {
  log.info({ poolId, partyId, shares }, 'Processing withdrawal');
  const pool = registry.getPool(poolId);
  if (!pool) throw new Error(`Pool ${poolId} not found`);

  // Accrue interest before modifying state
  accruePoolInterest(pool);

  const sharesNum = parseFloat(shares);
  if (isNaN(sharesNum) || sharesNum <= 0) throw new Error('Invalid withdrawal amount');

  const withdrawnAmount = sharesNum * (pool.supplyIndex || 1);
  const available = pool.totalSupply - pool.totalBorrow;
  if (withdrawnAmount > available) throw new Error('Insufficient liquidity for withdrawal');

  // ---------- Canton mode: exercise ProcessWithdraw on LendingPool ----------
  if (!env.CANTON_MOCK) {
    const client = CantonClient.getInstance();

    // ProcessWithdraw updates the pool's totalSupply on-ledger
    const result = await client.exerciseChoice(
      'Dualis.Lending.Pool:LendingPool',
      pool.contractId,
      'ProcessWithdraw',
      { withdrawAmount: withdrawnAmount.toFixed(10) },
    );

    // Update local pool contract ID (choice archives old pool, creates new one)
    let newCid = pool.contractId;
    const events = result.events ?? [];
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
        const { getPoolByKey } = await import('../canton/queries.js');
        const fresh = await getPoolByKey(poolId);
        if (fresh) newCid = fresh.contractId;
      } catch { /* fallthrough */ }
    }
    pool.contractId = newCid;

    pool.totalSupply -= withdrawnAmount;

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

  return {
    data: {
      withdrawnAmount: withdrawnAmount.toFixed(6),
      remainingShares: 0,
    },
    transaction: buildTransactionMeta(),
  };
}
