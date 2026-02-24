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
  getRateModel,
  type InterestRateModelConfig,
} from '@dualis/shared';
import { randomUUID } from 'node:crypto';

const log = createChildLogger('pool-service');

// ─── Rate model lookup per pool ─────────────────────────────────────────────

const POOL_RATE_MODELS: Record<string, InterestRateModelConfig> = {
  'usdc-main': getRateModel('USDC'),
  'wbtc-main': getRateModel('wBTC'),
  'eth-main': getRateModel('ETH'),
  'cc-main': getRateModel('CC'),
  'tbill-2026': getRateModel('T-BILL'),
  'spy-2026': getRateModel('SPY'),
};

// ─── Pool State (mutable to support accrual simulation) ─────────────────────

interface PoolState {
  poolId: string;
  asset: { symbol: string; type: string; priceUSD: number };
  totalSupply: number;
  totalBorrow: number;
  totalReserves: number;
  borrowIndex: number;
  supplyIndex: number;
  lastAccrualTs: number; // Unix seconds
  isActive: boolean;
  contractId: string;
}

const POOL_STATES: PoolState[] = [
  {
    poolId: 'usdc-main',
    asset: { symbol: 'USDC', type: 'Stablecoin', priceUSD: 1.0 },
    totalSupply: 245_600_000,
    totalBorrow: 178_200_000,
    totalReserves: 4_912_000,
    borrowIndex: 1.0,
    supplyIndex: 1.0,
    lastAccrualTs: Math.floor(Date.now() / 1000) - 300,
    isActive: true,
    contractId: 'canton::pool::usdc-main::001',
  },
  {
    poolId: 'wbtc-main',
    asset: { symbol: 'wBTC', type: 'CryptoCurrency', priceUSD: 62_450 },
    totalSupply: 1_850,
    totalBorrow: 920,
    totalReserves: 12.5,
    borrowIndex: 1.0,
    supplyIndex: 1.0,
    lastAccrualTs: Math.floor(Date.now() / 1000) - 300,
    isActive: true,
    contractId: 'canton::pool::wbtc-main::002',
  },
  {
    poolId: 'eth-main',
    asset: { symbol: 'ETH', type: 'CryptoCurrency', priceUSD: 3_420 },
    totalSupply: 45_200,
    totalBorrow: 28_900,
    totalReserves: 340,
    borrowIndex: 1.0,
    supplyIndex: 1.0,
    lastAccrualTs: Math.floor(Date.now() / 1000) - 300,
    isActive: true,
    contractId: 'canton::pool::eth-main::003',
  },
  {
    poolId: 'cc-main',
    asset: { symbol: 'CC', type: 'CryptoCurrency', priceUSD: 2.30 },
    totalSupply: 89_000_000,
    totalBorrow: 34_200_000,
    totalReserves: 890_000,
    borrowIndex: 1.0,
    supplyIndex: 1.0,
    lastAccrualTs: Math.floor(Date.now() / 1000) - 300,
    isActive: true,
    contractId: 'canton::pool::cc-main::004',
  },
  {
    poolId: 'tbill-2026',
    asset: { symbol: 'T-BILL-2026', type: 'TokenizedTreasury', priceUSD: 99.87 },
    totalSupply: 320_000_000,
    totalBorrow: 245_000_000,
    totalReserves: 3_200_000,
    borrowIndex: 1.0,
    supplyIndex: 1.0,
    lastAccrualTs: Math.floor(Date.now() / 1000) - 300,
    isActive: true,
    contractId: 'canton::pool::tbill-2026::005',
  },
  {
    poolId: 'spy-2026',
    asset: { symbol: 'SPY-2026', type: 'TokenizedEquity', priceUSD: 512.45 },
    totalSupply: 156_000_000,
    totalBorrow: 89_400_000,
    totalReserves: 1_560_000,
    borrowIndex: 1.0,
    supplyIndex: 1.0,
    lastAccrualTs: Math.floor(Date.now() / 1000) - 300,
    isActive: true,
    contractId: 'canton::pool::spy-2026::006',
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function accruePoolInterest(pool: PoolState): void {
  const model = POOL_RATE_MODELS[pool.poolId];
  if (!model) return;

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

function poolToListItem(pool: PoolState): PoolListItem {
  const model = POOL_RATE_MODELS[pool.poolId];
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
    supplyAPY: model ? calculatePoolAPY(model, utilization, 'supply') : 0,
    borrowAPY: model ? calculatePoolAPY(model, utilization, 'borrow') : 0,
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
  const pool = POOL_STATES.find((p) => p.poolId === poolId);
  if (!pool) return [];

  const now = Date.now();
  const periodDays: Record<string, number> = {
    '7d': 7, '30d': 30, '90d': 90, '1y': 365, all: 365,
  };
  const days = periodDays[period] ?? 30;
  const points: PoolHistoryPoint[] = [];
  const model = POOL_RATE_MODELS[poolId];

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
      supplyAPY: model
        ? Number(calculatePoolAPY(model, simUtil, 'supply').toFixed(4))
        : Number((pool.totalSupply > 0 ? 0.04 * jitter : 0).toFixed(4)),
      borrowAPY: model
        ? Number(calculatePoolAPY(model, simUtil, 'borrow').toFixed(4))
        : Number((0.06 * jitter).toFixed(4)),
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

  // Accrue interest on all pools before returning
  for (const pool of POOL_STATES) {
    accruePoolInterest(pool);
  }

  let filtered = POOL_STATES.map(poolToListItem);

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
  const pool = POOL_STATES.find((p) => p.poolId === poolId);
  if (!pool) throw new Error(`Pool ${poolId} not found`);

  // Accrue interest before returning detail
  accruePoolInterest(pool);

  const model = POOL_RATE_MODELS[poolId];
  const listItem = poolToListItem(pool);
  const collateralConfig = {
    loanToValue: 0.75,
    liquidationThreshold: 0.82,
    liquidationPenalty: 0.05,
    borrowCap: listItem.totalSupplyUSD * 0.85,
  };

  return {
    ...listItem,
    available: pool.totalSupply - pool.totalBorrow,
    interestRateModel: model
      ? { type: model.type, baseRate: model.baseRate, multiplier: model.multiplier, kink: model.kink, jumpMultiplier: model.jumpMultiplier }
      : { type: 'VariableRate', baseRate: 0.02, multiplier: 0.05, kink: 0.8, jumpMultiplier: 0.15 },
    collateralConfig,
    accumulatedBorrowIndex: pool.borrowIndex,
    accumulatedSupplyIndex: pool.supplyIndex,
    lastAccrualTimestamp: new Date(pool.lastAccrualTs * 1000).toISOString(),
  };
}

export function getPoolHistory(poolId: string, period: string): PoolHistoryPoint[] {
  log.debug({ poolId, period }, 'Getting pool history');
  if (!POOL_STATES.find((p) => p.poolId === poolId)) {
    throw new Error(`Pool ${poolId} not found`);
  }
  return generateHistoryPoints(poolId, period);
}

export function deposit(
  poolId: string,
  _partyId: string,
  amount: string,
): { data: DepositResponse; transaction: TransactionMeta } {
  log.info({ poolId, _partyId, amount }, 'Processing deposit');
  const pool = POOL_STATES.find((p) => p.poolId === poolId);
  if (!pool) throw new Error(`Pool ${poolId} not found`);

  // Accrue interest before modifying state
  accruePoolInterest(pool);

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) throw new Error('Invalid deposit amount');

  // Update pool supply state
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

export function withdraw(
  poolId: string,
  _partyId: string,
  shares: string,
): { data: WithdrawResponse; transaction: TransactionMeta } {
  log.info({ poolId, _partyId, shares }, 'Processing withdrawal');
  const pool = POOL_STATES.find((p) => p.poolId === poolId);
  if (!pool) throw new Error(`Pool ${poolId} not found`);

  // Accrue interest before modifying state
  accruePoolInterest(pool);

  const sharesNum = parseFloat(shares);
  if (isNaN(sharesNum) || sharesNum <= 0) throw new Error('Invalid withdrawal amount');

  const withdrawnAmount = sharesNum * (pool.supplyIndex || 1);
  const available = pool.totalSupply - pool.totalBorrow;
  if (withdrawnAmount > available) throw new Error('Insufficient liquidity for withdrawal');

  // Update pool supply state
  pool.totalSupply -= withdrawnAmount;

  return {
    data: {
      withdrawnAmount: withdrawnAmount.toFixed(6),
      remainingShares: 0,
    },
    transaction: buildTransactionMeta(),
  };
}
