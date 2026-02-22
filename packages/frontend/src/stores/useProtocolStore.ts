'use client';

import { create } from 'zustand';

interface PoolData {
  poolId: string;
  symbol: string;
  instrumentType: string;
  totalDeposits: number;
  totalBorrows: number;
  totalReserves: number;
  utilization: number;
  supplyAPY: number;
  borrowAPY: number;
  priceUSD: number;
  isActive: boolean;
}

interface ProtocolState {
  pools: PoolData[];
  isLoading: boolean;
  error: string | null;
}

interface ProtocolActions {
  fetchPools: () => void;
  updatePool: (poolId: string, data: Partial<PoolData>) => void;
}

const MOCK_POOLS: PoolData[] = [
  {
    poolId: 'usdc-main',
    symbol: 'USDC',
    instrumentType: 'Stablecoin',
    totalDeposits: 245_600_000,
    totalBorrows: 189_200_000,
    totalReserves: 2_456_000,
    utilization: 0.7703,
    supplyAPY: 0.0824,
    borrowAPY: 0.1056,
    priceUSD: 1.0,
    isActive: true,
  },
  {
    poolId: 'wbtc-main',
    symbol: 'wBTC',
    instrumentType: 'CryptoCurrency',
    totalDeposits: 1_850,
    totalBorrows: 920,
    totalReserves: 12,
    utilization: 0.4973,
    supplyAPY: 0.0234,
    borrowAPY: 0.0456,
    priceUSD: 97_234.56,
    isActive: true,
  },
  {
    poolId: 'eth-main',
    symbol: 'ETH',
    instrumentType: 'CryptoCurrency',
    totalDeposits: 45_200,
    totalBorrows: 28_400,
    totalReserves: 340,
    utilization: 0.6283,
    supplyAPY: 0.0356,
    borrowAPY: 0.0589,
    priceUSD: 3_456.78,
    isActive: true,
  },
  {
    poolId: 'cc-main',
    symbol: 'CC',
    instrumentType: 'CryptoCurrency',
    totalDeposits: 89_000_000,
    totalBorrows: 34_200_000,
    totalReserves: 890_000,
    utilization: 0.3843,
    supplyAPY: 0.0156,
    borrowAPY: 0.0378,
    priceUSD: 2.30,
    isActive: true,
  },
  {
    poolId: 'tbill-2026',
    symbol: 'T-BILL-2026',
    instrumentType: 'TokenizedTreasury',
    totalDeposits: 320_000_000,
    totalBorrows: 245_000_000,
    totalReserves: 3_200_000,
    utilization: 0.7656,
    supplyAPY: 0.0512,
    borrowAPY: 0.0678,
    priceUSD: 99.87,
    isActive: true,
  },
  {
    poolId: 'spy-2026',
    symbol: 'SPY-2026',
    instrumentType: 'TokenizedEquity',
    totalDeposits: 156_000_000,
    totalBorrows: 89_400_000,
    totalReserves: 1_560_000,
    utilization: 0.5731,
    supplyAPY: 0.0445,
    borrowAPY: 0.0712,
    priceUSD: 512.45,
    isActive: true,
  },
];

export const useProtocolStore = create<ProtocolState & ProtocolActions>()((set) => ({
  pools: [],
  isLoading: false,
  error: null,

  fetchPools: () => {
    set({ isLoading: true, error: null });
    // Simulate API call
    setTimeout(() => {
      set({ pools: MOCK_POOLS, isLoading: false });
    }, 500);
  },

  updatePool: (poolId, data) =>
    set((state) => ({
      pools: state.pools.map((p) => (p.poolId === poolId ? { ...p, ...data } : p)),
    })),
}));
