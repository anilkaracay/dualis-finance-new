'use client';

import { create } from 'zustand';
import type {
  AnalyticsTimeRange,
  UserPortfolio,
  ProtocolStats,
  AdminAnalyticsOverview,
  ProtocolHealthDashboard,
  RevenueSummary,
  TimeSeriesPoint,
  UserTransaction,
  PnlBreakdown,
} from '@dualis/shared';

// ---------------------------------------------------------------------------
// Asset color palette
// ---------------------------------------------------------------------------

export const ASSET_COLORS: Record<string, string> = {
  ETH: '#627EEA',
  WBTC: '#F7931A',
  USDC: '#2775CA',
  USDT: '#26A17B',
  DAI: '#F5AC37',
  USD1: '#3B82F6',
  'T-BILL': '#10B981',
  SPY: '#8B5CF6',
};

export function getAssetColor(asset: string): string {
  return ASSET_COLORS[asset] ?? '#6B7280';
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface AnalyticsState {
  // Time range
  selectedRange: AnalyticsTimeRange;
  setSelectedRange: (range: AnalyticsTimeRange) => void;

  // Portfolio
  portfolio: UserPortfolio | null;
  portfolioLoading: boolean;
  setPortfolio: (p: UserPortfolio | null) => void;
  setPortfolioLoading: (v: boolean) => void;

  // Transactions
  transactions: UserTransaction[];
  transactionsTotal: number;
  setTransactions: (txs: UserTransaction[], total: number) => void;

  // P&L
  pnlBreakdown: PnlBreakdown[];
  setPnlBreakdown: (b: PnlBreakdown[]) => void;

  // Protocol
  protocolStats: ProtocolStats | null;
  setProtocolStats: (s: ProtocolStats | null) => void;

  // Admin
  adminOverview: AdminAnalyticsOverview | null;
  setAdminOverview: (o: AdminAnalyticsOverview | null) => void;

  protocolHealth: ProtocolHealthDashboard | null;
  setProtocolHealth: (h: ProtocolHealthDashboard | null) => void;

  revenueSummary: RevenueSummary | null;
  setRevenueSummary: (r: RevenueSummary | null) => void;

  tvlHistory: TimeSeriesPoint[];
  setTvlHistory: (h: TimeSeriesPoint[]) => void;

  // Export
  exportLoading: boolean;
  setExportLoading: (v: boolean) => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  selectedRange: '30d',
  setSelectedRange: (range) => set({ selectedRange: range }),

  portfolio: null,
  portfolioLoading: false,
  setPortfolio: (portfolio) => set({ portfolio }),
  setPortfolioLoading: (portfolioLoading) => set({ portfolioLoading }),

  transactions: [],
  transactionsTotal: 0,
  setTransactions: (transactions, transactionsTotal) => set({ transactions, transactionsTotal }),

  pnlBreakdown: [],
  setPnlBreakdown: (pnlBreakdown) => set({ pnlBreakdown }),

  protocolStats: null,
  setProtocolStats: (protocolStats) => set({ protocolStats }),

  adminOverview: null,
  setAdminOverview: (adminOverview) => set({ adminOverview }),

  protocolHealth: null,
  setProtocolHealth: (protocolHealth) => set({ protocolHealth }),

  revenueSummary: null,
  setRevenueSummary: (revenueSummary) => set({ revenueSummary }),

  tvlHistory: [],
  setTvlHistory: (tvlHistory) => set({ tvlHistory }),

  exportLoading: false,
  setExportLoading: (exportLoading) => set({ exportLoading }),
}));
