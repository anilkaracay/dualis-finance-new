'use client';

import { create } from 'zustand';
import type { BorrowPositionItem, SecLendingDealItem } from '@dualis/shared';

interface SupplyPosition {
  positionId: string;
  poolId: string;
  symbol: string;
  depositedAmount: number;
  shares: number;
  currentValueUSD: number;
  apy: number;
  depositTimestamp: string;
}

interface BorrowPositionData {
  positionId: string;
  poolId: string;
  symbol: string;
  borrowedAmountPrincipal: number;
  currentDebt: number;
  healthFactor: number;
  creditTier: string;
  isLiquidatable: boolean;
  collateral: Array<{ symbol: string; amount: number; valueUSD: number }>;
  borrowTimestamp: string;
}

interface SecLendingDealData {
  dealId: string;
  role: 'lender' | 'borrower';
  security: { symbol: string; amount: number };
  status: string;
  feeAccrued: number;
  startDate: string;
  expectedEndDate: string;
}

interface PositionState {
  supplyPositions: SupplyPosition[];
  borrowPositions: BorrowPositionData[];
  secLendingDeals: SecLendingDealData[];
  isLoading: boolean;
  isDemo: boolean;
  error: string | null;
}

interface PositionActions {
  fetchPositions: () => Promise<void>;
  fetchFromAPI: () => Promise<void>;
}

const MOCK_SUPPLY: SupplyPosition[] = [
  {
    positionId: 'usdc-main-pos1',
    poolId: 'usdc-main',
    symbol: 'USDC',
    depositedAmount: 500_000,
    shares: 485_000,
    currentValueUSD: 512_345,
    apy: 0.0824,
    depositTimestamp: '2026-01-15T10:00:00Z',
  },
  {
    positionId: 'tbill-2026-pos1',
    poolId: 'tbill-2026',
    symbol: 'T-BILL-2026',
    depositedAmount: 1_000_000,
    shares: 980_000,
    currentValueUSD: 1_023_456,
    apy: 0.0512,
    depositTimestamp: '2026-01-20T14:00:00Z',
  },
  {
    positionId: 'eth-main-pos1',
    poolId: 'eth-main',
    symbol: 'ETH',
    depositedAmount: 10,
    shares: 9.8,
    currentValueUSD: 34_567,
    apy: 0.0356,
    depositTimestamp: '2026-02-01T08:00:00Z',
  },
];

const MOCK_BORROW: BorrowPositionData[] = [
  {
    positionId: 'borrow-001',
    poolId: 'usdc-main',
    symbol: 'USDC',
    borrowedAmountPrincipal: 200_000,
    currentDebt: 201_234.56,
    healthFactor: 1.67,
    creditTier: 'Gold',
    isLiquidatable: false,
    collateral: [
      { symbol: 'wBTC', amount: 3.5, valueUSD: 340_320 },
      { symbol: 'CC', amount: 50_000, valueUSD: 115_000 },
    ],
    borrowTimestamp: '2026-02-10T10:00:00Z',
  },
  {
    positionId: 'borrow-002',
    poolId: 'eth-main',
    symbol: 'ETH',
    borrowedAmountPrincipal: 5,
    currentDebt: 5.12,
    healthFactor: 2.34,
    creditTier: 'Gold',
    isLiquidatable: false,
    collateral: [
      { symbol: 'USDC', amount: 25_000, valueUSD: 25_000 },
    ],
    borrowTimestamp: '2026-02-15T12:00:00Z',
  },
];

const MOCK_SEC_LENDING: SecLendingDealData[] = [
  {
    dealId: 'deal-001',
    role: 'lender',
    security: { symbol: 'SPY-2026', amount: 500_000 },
    status: 'Active',
    feeAccrued: 1_234.56,
    startDate: '2026-02-10T10:00:00Z',
    expectedEndDate: '2026-05-10T10:00:00Z',
  },
];

/** Maps a BorrowPositionItem from the API to the local BorrowPositionData shape. */
function mapBorrowPositionItem(item: BorrowPositionItem): BorrowPositionData {
  return {
    positionId: item.positionId,
    poolId: item.lendingPoolId,
    symbol: item.borrowedAsset.symbol,
    borrowedAmountPrincipal: item.borrowedAmountPrincipal,
    currentDebt: item.currentDebt,
    healthFactor: item.healthFactor.value,
    creditTier: item.creditTier,
    isLiquidatable: item.isLiquidatable,
    collateral: item.collateral.map((c) => ({
      symbol: c.symbol,
      amount: Number(c.amount),
      valueUSD: c.valueUSD,
    })),
    borrowTimestamp: item.borrowTimestamp,
  };
}

/** Maps a SecLendingDealItem from the API to the local SecLendingDealData shape. */
function mapSecLendingDealItem(item: SecLendingDealItem): SecLendingDealData {
  return {
    dealId: item.dealId,
    role: item.role,
    security: item.security,
    status: item.status,
    feeAccrued: item.feeAccrued,
    startDate: item.startDate,
    expectedEndDate: item.expectedEndDate,
  };
}

export const usePositionStore = create<PositionState & PositionActions>()((set) => ({
  supplyPositions: [],
  borrowPositions: [],
  secLendingDeals: [],
  isLoading: false,
  isDemo: false,
  error: null,

  fetchPositions: async () => {
    set({ isLoading: true, error: null });
    try {
      const { apiClient } = await import('@/lib/api/client');
      const [borrowRes, supplyRes, dealsRes] = await Promise.allSettled([
        apiClient.get<{ data: BorrowPositionItem[] }>('/borrow/positions'),
        apiClient.get<{ data: SupplyPosition[] }>('/supply/positions'),
        apiClient.get<{ data: SecLendingDealItem[] }>('/sec-lending/deals'),
      ]);

      const borrowData = borrowRes.status === 'fulfilled' ? borrowRes.value.data : null;
      const supplyData = supplyRes.status === 'fulfilled' ? supplyRes.value.data : null;
      const dealsData = dealsRes.status === 'fulfilled' ? dealsRes.value.data : null;

      // Extract arrays from response (handle { data: [...] } wrapper)
      const borrowArr = borrowData ? (Array.isArray(borrowData) ? borrowData : (borrowData as { data?: BorrowPositionItem[] }).data ?? []) : [];
      const supplyArr = supplyData ? (Array.isArray(supplyData) ? supplyData : (supplyData as { data?: SupplyPosition[] }).data ?? []) : [];
      const dealsArr = dealsData ? (Array.isArray(dealsData) ? dealsData : (dealsData as { data?: SecLendingDealItem[] }).data ?? []) : [];

      const hasAnyData = borrowArr.length > 0 || supplyArr.length > 0 || dealsArr.length > 0;

      if (hasAnyData) {
        set({
          borrowPositions: borrowArr.length > 0
            ? (borrowArr as BorrowPositionItem[]).map(mapBorrowPositionItem)
            : [],
          supplyPositions: supplyArr as SupplyPosition[],
          secLendingDeals: dealsArr.length > 0
            ? (dealsArr as SecLendingDealItem[]).map(mapSecLendingDealItem)
            : [],
          isLoading: false,
          isDemo: false,
          error: null,
        });
      } else {
        // API returned empty — use demo data with clear flag
        set({
          supplyPositions: MOCK_SUPPLY,
          borrowPositions: MOCK_BORROW,
          secLendingDeals: MOCK_SEC_LENDING,
          isLoading: false,
          isDemo: true,
          error: null,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch positions';
      console.warn('[PositionStore] API failed, using demo data:', msg);
      set({
        supplyPositions: MOCK_SUPPLY,
        borrowPositions: MOCK_BORROW,
        secLendingDeals: MOCK_SEC_LENDING,
        isLoading: false,
        isDemo: true,
        error: `API unavailable: ${msg}`,
      });
    }
  },

  fetchFromAPI: async () => {
    // Alias — same as fetchPositions
    await usePositionStore.getState().fetchPositions();
  },
}));
