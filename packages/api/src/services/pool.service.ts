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
import { randomUUID } from 'node:crypto';

const log = createChildLogger('pool-service');

const MOCK_POOLS: PoolListItem[] = [
  {
    poolId: 'usdc-main',
    asset: { symbol: 'USDC', type: 'Stablecoin', priceUSD: 1.0 },
    totalSupply: 245_600_000,
    totalSupplyUSD: 245_600_000,
    totalBorrow: 178_200_000,
    totalBorrowUSD: 178_200_000,
    totalReserves: 4_912_000,
    utilization: 0.7256,
    supplyAPY: 0.0412,
    borrowAPY: 0.0568,
    isActive: true,
    contractId: 'canton::pool::usdc-main::001',
  },
  {
    poolId: 'wbtc-main',
    asset: { symbol: 'wBTC', type: 'CryptoCurrency', priceUSD: 62_450 },
    totalSupply: 1_850,
    totalSupplyUSD: 115_532_500,
    totalBorrow: 920,
    totalBorrowUSD: 57_454_000,
    totalReserves: 12.5,
    utilization: 0.4973,
    supplyAPY: 0.0189,
    borrowAPY: 0.0345,
    isActive: true,
    contractId: 'canton::pool::wbtc-main::002',
  },
  {
    poolId: 'eth-main',
    asset: { symbol: 'ETH', type: 'CryptoCurrency', priceUSD: 3_420 },
    totalSupply: 45_200,
    totalSupplyUSD: 154_584_000,
    totalBorrow: 28_900,
    totalBorrowUSD: 98_838_000,
    totalReserves: 340,
    utilization: 0.6394,
    supplyAPY: 0.0298,
    borrowAPY: 0.0467,
    isActive: true,
    contractId: 'canton::pool::eth-main::003',
  },
  {
    poolId: 'cc-receivable',
    asset: { symbol: 'CC-REC', type: 'TokenizedReceivable', priceUSD: 1.0 },
    totalSupply: 89_000_000,
    totalSupplyUSD: 89_000_000,
    totalBorrow: 67_400_000,
    totalBorrowUSD: 67_400_000,
    totalReserves: 1_780_000,
    utilization: 0.7573,
    supplyAPY: 0.0645,
    borrowAPY: 0.0852,
    isActive: true,
    contractId: 'canton::pool::cc-receivable::004',
  },
  {
    poolId: 'tbill-short',
    asset: { symbol: 'T-BILL', type: 'TokenizedTreasury', priceUSD: 1.0 },
    totalSupply: 320_000_000,
    totalSupplyUSD: 320_000_000,
    totalBorrow: 198_400_000,
    totalBorrowUSD: 198_400_000,
    totalReserves: 6_400_000,
    utilization: 0.62,
    supplyAPY: 0.0523,
    borrowAPY: 0.0645,
    isActive: true,
    contractId: 'canton::pool::tbill-short::005',
  },
  {
    poolId: 'spy-equity',
    asset: { symbol: 'SPY', type: 'TokenizedEquity', priceUSD: 478.5 },
    totalSupply: 326_000,
    totalSupplyUSD: 155_961_000,
    totalBorrow: 142_800,
    totalBorrowUSD: 68_329_800,
    totalReserves: 4_890,
    utilization: 0.438,
    supplyAPY: 0.0215,
    borrowAPY: 0.0389,
    isActive: true,
    contractId: 'canton::pool::spy-equity::006',
  },
];

const MOCK_POOL_DETAILS: Record<string, PoolDetail> = Object.fromEntries(
  MOCK_POOLS.map((pool) => [
    pool.poolId,
    {
      ...pool,
      available: pool.totalSupply - pool.totalBorrow,
      interestRateModel: {
        type: 'VariableRate',
        baseRate: 0.02,
        multiplier: 0.05,
        kink: 0.8,
        jumpMultiplier: 0.15,
      },
      collateralConfig: {
        loanToValue: 0.75,
        liquidationThreshold: 0.82,
        liquidationPenalty: 0.05,
        borrowCap: pool.totalSupplyUSD * 0.85,
      },
      accumulatedBorrowIndex: 1.000234,
      accumulatedSupplyIndex: 1.000189,
      lastAccrualTimestamp: new Date().toISOString(),
    },
  ])
);

function generateHistoryPoints(poolId: string, period: string): PoolHistoryPoint[] {
  const pool = MOCK_POOLS.find((p) => p.poolId === poolId);
  if (!pool) return [];

  const now = Date.now();
  const periodDays: Record<string, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
    all: 365,
  };
  const days = periodDays[period] ?? 30;
  const points: PoolHistoryPoint[] = [];

  for (let i = days; i >= 0; i--) {
    const ts = new Date(now - i * 86_400_000);
    const jitter = 1 + (Math.sin(i * 0.3) * 0.05);
    points.push({
      timestamp: ts.toISOString(),
      totalSupply: Math.round(pool.totalSupply * jitter),
      totalBorrow: Math.round(pool.totalBorrow * jitter * 0.98),
      supplyAPY: Number((pool.supplyAPY * jitter).toFixed(4)),
      borrowAPY: Number((pool.borrowAPY * jitter).toFixed(4)),
      utilization: Number((pool.utilization * jitter * 0.99).toFixed(4)),
      priceUSD: Number((pool.asset.priceUSD * (1 + Math.sin(i * 0.2) * 0.02)).toFixed(2)),
    });
  }

  return points;
}

function buildTransactionMeta(): TransactionMeta {
  return {
    id: `tx-${randomUUID()}`,
    status: 'confirmed',
    timestamp: new Date().toISOString(),
  };
}

export function listPools(
  params: ListPoolsParams
): { data: PoolListItem[]; pagination: Pagination } {
  log.debug({ params }, 'Listing pools');

  let filtered = [...MOCK_POOLS];

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
  const detail = MOCK_POOL_DETAILS[poolId];
  if (!detail) {
    throw new Error(`Pool ${poolId} not found`);
  }
  return detail;
}

export function getPoolHistory(
  poolId: string,
  period: string
): PoolHistoryPoint[] {
  log.debug({ poolId, period }, 'Getting pool history');
  if (!MOCK_POOLS.find((p) => p.poolId === poolId)) {
    throw new Error(`Pool ${poolId} not found`);
  }
  return generateHistoryPoints(poolId, period);
}

export function deposit(
  poolId: string,
  _partyId: string,
  _amount: string
): { data: DepositResponse; transaction: TransactionMeta } {
  log.info({ poolId, _partyId, _amount }, 'Processing deposit');
  if (!MOCK_POOL_DETAILS[poolId]) {
    throw new Error(`Pool ${poolId} not found`);
  }

  return {
    data: {
      poolContractId: MOCK_POOL_DETAILS[poolId].contractId,
      positionContractId: `canton::position::${poolId}-${randomUUID().slice(0, 8)}`,
    },
    transaction: buildTransactionMeta(),
  };
}

export function withdraw(
  poolId: string,
  _partyId: string,
  shares: string
): { data: WithdrawResponse; transaction: TransactionMeta } {
  log.info({ poolId, _partyId, shares }, 'Processing withdrawal');
  if (!MOCK_POOL_DETAILS[poolId]) {
    throw new Error(`Pool ${poolId} not found`);
  }

  const sharesNum = parseFloat(shares);
  return {
    data: {
      withdrawnAmount: (sharesNum * 1.0023).toFixed(6),
      remainingShares: 0,
    },
    transaction: buildTransactionMeta(),
  };
}
