'use client';

import { create } from 'zustand';

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
}

interface PositionActions {
  fetchPositions: (partyId: string) => void;
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

export const usePositionStore = create<PositionState & PositionActions>()((set) => ({
  supplyPositions: [],
  borrowPositions: [],
  secLendingDeals: [],
  isLoading: false,

  fetchPositions: (_partyId: string) => {
    set({ isLoading: true });
    setTimeout(() => {
      set({
        supplyPositions: MOCK_SUPPLY,
        borrowPositions: MOCK_BORROW,
        secLendingDeals: MOCK_SEC_LENDING,
        isLoading: false,
      });
    }, 500);
  },
}));
