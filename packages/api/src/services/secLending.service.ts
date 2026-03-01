import { createChildLogger } from '../config/logger.js';
import type {
  ListSecLendingOffersParams,
  CreateSecLendingOfferRequest,
  AcceptSecLendingOfferRequest,
  SecLendingOfferItem,
  CreateOfferResponse,
  AcceptOfferResponse,
  SecLendingDealItem,
  RecallResponse,
  ReturnResponse,
  Pagination,
  TransactionMeta,
  CreditTier,
} from '@dualis/shared';
import { randomUUID } from 'node:crypto';

const log = createChildLogger('sec-lending-service');

function buildTransactionMeta(): TransactionMeta {
  return {
    id: `tx-${randomUUID()}`,
    status: 'confirmed',
    timestamp: new Date().toISOString(),
  };
}

const MOCK_OFFERS: SecLendingOfferItem[] = [
  // ── Tokenized Equities — Mega-cap Tech ────────────────────────────────
  {
    offerId: 'offer-aapl-001',
    lender: 'party::institutional-lender-1',
    lenderCreditTier: 'Diamond' as CreditTier,
    security: { symbol: 'AAPL', amount: 5_000, type: 'TokenizedEquity' },
    feeStructure: { type: 'FixedFee', value: 0.35 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin', 'TokenizedTreasury'],
      initialMarginPercent: 105,
      variationMarginPercent: 102,
      marginCallThreshold: 100,
      marginCallDeadlineHours: 24,
    },
    minLendDuration: 7,
    maxLendDuration: 90,
    isRecallable: true,
    recallNoticeDays: 3,
    createdAt: '2026-02-18T08:00:00.000Z',
  },
  {
    offerId: 'offer-tsla-002',
    lender: 'party::pension-fund-alpha',
    lenderCreditTier: 'Gold' as CreditTier,
    security: { symbol: 'TSLA', amount: 2_500, type: 'TokenizedEquity' },
    feeStructure: { type: 'FloatingFee', value: 0.50 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin', 'CryptoCurrency'],
      initialMarginPercent: 110,
      variationMarginPercent: 105,
      marginCallThreshold: 102,
      marginCallDeadlineHours: 12,
    },
    minLendDuration: 14,
    maxLendDuration: 180,
    isRecallable: true,
    recallNoticeDays: 5,
    createdAt: '2026-02-17T14:30:00.000Z',
  },
  {
    offerId: 'offer-msft-003',
    lender: 'party::sovereign-fund-beta',
    lenderCreditTier: 'Diamond' as CreditTier,
    security: { symbol: 'MSFT', amount: 4_200, type: 'TokenizedEquity' },
    feeStructure: { type: 'FixedFee', value: 0.30 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin', 'TokenizedTreasury'],
      initialMarginPercent: 105,
      variationMarginPercent: 102,
      marginCallThreshold: 100,
      marginCallDeadlineHours: 24,
    },
    minLendDuration: 7,
    maxLendDuration: 90,
    isRecallable: true,
    recallNoticeDays: 3,
    createdAt: '2026-02-19T09:00:00.000Z',
  },
  {
    offerId: 'offer-googl-004',
    lender: 'party::hedge-fund-delta',
    lenderCreditTier: 'Gold' as CreditTier,
    security: { symbol: 'GOOGL', amount: 3_000, type: 'TokenizedEquity' },
    feeStructure: { type: 'FixedFee', value: 0.32 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin', 'CryptoCurrency'],
      initialMarginPercent: 106,
      variationMarginPercent: 103,
      marginCallThreshold: 101,
      marginCallDeadlineHours: 24,
    },
    minLendDuration: 7,
    maxLendDuration: 120,
    isRecallable: true,
    recallNoticeDays: 3,
    createdAt: '2026-02-18T10:30:00.000Z',
  },
  {
    offerId: 'offer-amzn-005',
    lender: 'party::institutional-lender-1',
    lenderCreditTier: 'Diamond' as CreditTier,
    security: { symbol: 'AMZN', amount: 3_500, type: 'TokenizedEquity' },
    feeStructure: { type: 'FixedFee', value: 0.33 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin', 'TokenizedTreasury'],
      initialMarginPercent: 105,
      variationMarginPercent: 102,
      marginCallThreshold: 100,
      marginCallDeadlineHours: 24,
    },
    minLendDuration: 14,
    maxLendDuration: 90,
    isRecallable: true,
    recallNoticeDays: 5,
    createdAt: '2026-02-20T07:00:00.000Z',
  },
  {
    offerId: 'offer-nvda-006',
    lender: 'party::market-maker-gamma',
    lenderCreditTier: 'Gold' as CreditTier,
    security: { symbol: 'NVDA', amount: 1_800, type: 'TokenizedEquity' },
    feeStructure: { type: 'FloatingFee', value: 0.55 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin', 'CryptoCurrency', 'TokenizedTreasury'],
      initialMarginPercent: 112,
      variationMarginPercent: 106,
      marginCallThreshold: 103,
      marginCallDeadlineHours: 12,
    },
    minLendDuration: 7,
    maxLendDuration: 60,
    isRecallable: true,
    recallNoticeDays: 2,
    createdAt: '2026-02-21T08:00:00.000Z',
  },
  {
    offerId: 'offer-meta-007',
    lender: 'party::pension-fund-alpha',
    lenderCreditTier: 'Gold' as CreditTier,
    security: { symbol: 'META', amount: 2_200, type: 'TokenizedEquity' },
    feeStructure: { type: 'FixedFee', value: 0.38 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin', 'TokenizedTreasury'],
      initialMarginPercent: 107,
      variationMarginPercent: 103,
      marginCallThreshold: 101,
      marginCallDeadlineHours: 24,
    },
    minLendDuration: 14,
    maxLendDuration: 120,
    isRecallable: true,
    recallNoticeDays: 5,
    createdAt: '2026-02-19T11:00:00.000Z',
  },

  // ── Tokenized Equities — Finance ──────────────────────────────────────
  {
    offerId: 'offer-jpm-008',
    lender: 'party::sovereign-fund-beta',
    lenderCreditTier: 'Diamond' as CreditTier,
    security: { symbol: 'JPM', amount: 6_000, type: 'TokenizedEquity' },
    feeStructure: { type: 'FixedFee', value: 0.25 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin', 'TokenizedTreasury'],
      initialMarginPercent: 104,
      variationMarginPercent: 102,
      marginCallThreshold: 100,
      marginCallDeadlineHours: 48,
    },
    minLendDuration: 30,
    maxLendDuration: 180,
    isRecallable: false,
    recallNoticeDays: 0,
    createdAt: '2026-02-16T09:00:00.000Z',
  },
  {
    offerId: 'offer-gs-009',
    lender: 'party::institutional-lender-1',
    lenderCreditTier: 'Diamond' as CreditTier,
    security: { symbol: 'GS', amount: 1_500, type: 'TokenizedEquity' },
    feeStructure: { type: 'FixedFee', value: 0.28 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin'],
      initialMarginPercent: 105,
      variationMarginPercent: 102,
      marginCallThreshold: 100,
      marginCallDeadlineHours: 24,
    },
    minLendDuration: 14,
    maxLendDuration: 120,
    isRecallable: true,
    recallNoticeDays: 5,
    createdAt: '2026-02-17T14:00:00.000Z',
  },
  {
    offerId: 'offer-blk-010',
    lender: 'party::pension-fund-alpha',
    lenderCreditTier: 'Gold' as CreditTier,
    security: { symbol: 'BLK', amount: 800, type: 'TokenizedEquity' },
    feeStructure: { type: 'FixedFee', value: 0.22 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin', 'TokenizedTreasury'],
      initialMarginPercent: 104,
      variationMarginPercent: 102,
      marginCallThreshold: 100,
      marginCallDeadlineHours: 48,
    },
    minLendDuration: 30,
    maxLendDuration: 365,
    isRecallable: false,
    recallNoticeDays: 0,
    createdAt: '2026-02-15T08:00:00.000Z',
  },

  // ── ETFs ──────────────────────────────────────────────────────────────
  {
    offerId: 'offer-spy-011',
    lender: 'party::market-maker-gamma',
    lenderCreditTier: 'Gold' as CreditTier,
    security: { symbol: 'SPY', amount: 8_000, type: 'TokenizedEquity' },
    feeStructure: { type: 'NegotiatedFee', value: 0.28 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin', 'TokenizedTreasury', 'CryptoCurrency'],
      initialMarginPercent: 108,
      variationMarginPercent: 103,
      marginCallThreshold: 101,
      marginCallDeadlineHours: 24,
    },
    minLendDuration: 1,
    maxLendDuration: 30,
    isRecallable: true,
    recallNoticeDays: 1,
    createdAt: '2026-02-20T11:15:00.000Z',
  },
  {
    offerId: 'offer-qqq-012',
    lender: 'party::hedge-fund-delta',
    lenderCreditTier: 'Gold' as CreditTier,
    security: { symbol: 'QQQ', amount: 10_000, type: 'TokenizedEquity' },
    feeStructure: { type: 'FixedFee', value: 0.30 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin', 'TokenizedTreasury', 'CryptoCurrency'],
      initialMarginPercent: 106,
      variationMarginPercent: 103,
      marginCallThreshold: 101,
      marginCallDeadlineHours: 24,
    },
    minLendDuration: 1,
    maxLendDuration: 60,
    isRecallable: true,
    recallNoticeDays: 1,
    createdAt: '2026-02-21T09:30:00.000Z',
  },
  {
    offerId: 'offer-iwm-013',
    lender: 'party::institutional-lender-1',
    lenderCreditTier: 'Diamond' as CreditTier,
    security: { symbol: 'IWM', amount: 15_000, type: 'TokenizedEquity' },
    feeStructure: { type: 'FloatingFee', value: 0.42 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin', 'CryptoCurrency'],
      initialMarginPercent: 110,
      variationMarginPercent: 105,
      marginCallThreshold: 102,
      marginCallDeadlineHours: 12,
    },
    minLendDuration: 7,
    maxLendDuration: 90,
    isRecallable: true,
    recallNoticeDays: 3,
    createdAt: '2026-02-19T14:00:00.000Z',
  },
  {
    offerId: 'offer-dia-014',
    lender: 'party::pension-fund-alpha',
    lenderCreditTier: 'Gold' as CreditTier,
    security: { symbol: 'DIA', amount: 5_000, type: 'TokenizedEquity' },
    feeStructure: { type: 'FixedFee', value: 0.24 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin', 'TokenizedTreasury'],
      initialMarginPercent: 105,
      variationMarginPercent: 102,
      marginCallThreshold: 100,
      marginCallDeadlineHours: 24,
    },
    minLendDuration: 7,
    maxLendDuration: 90,
    isRecallable: true,
    recallNoticeDays: 3,
    createdAt: '2026-02-18T16:00:00.000Z',
  },
  {
    offerId: 'offer-vti-015',
    lender: 'party::sovereign-fund-beta',
    lenderCreditTier: 'Diamond' as CreditTier,
    security: { symbol: 'VTI', amount: 20_000, type: 'TokenizedEquity' },
    feeStructure: { type: 'FixedFee', value: 0.18 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin', 'TokenizedTreasury'],
      initialMarginPercent: 103,
      variationMarginPercent: 101,
      marginCallThreshold: 100,
      marginCallDeadlineHours: 48,
    },
    minLendDuration: 30,
    maxLendDuration: 365,
    isRecallable: false,
    recallNoticeDays: 0,
    createdAt: '2026-02-14T10:00:00.000Z',
  },
  {
    offerId: 'offer-efa-016',
    lender: 'party::pension-fund-alpha',
    lenderCreditTier: 'Gold' as CreditTier,
    security: { symbol: 'EFA', amount: 12_000, type: 'TokenizedEquity' },
    feeStructure: { type: 'FixedFee', value: 0.20 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin'],
      initialMarginPercent: 104,
      variationMarginPercent: 102,
      marginCallThreshold: 100,
      marginCallDeadlineHours: 48,
    },
    minLendDuration: 30,
    maxLendDuration: 180,
    isRecallable: false,
    recallNoticeDays: 0,
    createdAt: '2026-02-16T13:00:00.000Z',
  },

  // ── US Treasuries & Fixed Income ──────────────────────────────────────
  {
    offerId: 'offer-ust10y-017',
    lender: 'party::sovereign-fund-beta',
    lenderCreditTier: 'Diamond' as CreditTier,
    security: { symbol: 'US-T10Y', amount: 10_000_000, type: 'TokenizedBond' },
    feeStructure: { type: 'FixedFee', value: 0.12 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin'],
      initialMarginPercent: 102,
      variationMarginPercent: 101,
      marginCallThreshold: 100,
      marginCallDeadlineHours: 48,
    },
    minLendDuration: 30,
    maxLendDuration: 365,
    isRecallable: false,
    recallNoticeDays: 0,
    createdAt: '2026-02-15T09:00:00.000Z',
  },
  {
    offerId: 'offer-tbill3m-018',
    lender: 'party::institutional-lender-1',
    lenderCreditTier: 'Diamond' as CreditTier,
    security: { symbol: 'T-BILL-3M', amount: 25_000_000, type: 'TokenizedTreasury' },
    feeStructure: { type: 'FixedFee', value: 0.08 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin'],
      initialMarginPercent: 101,
      variationMarginPercent: 100.5,
      marginCallThreshold: 100,
      marginCallDeadlineHours: 48,
    },
    minLendDuration: 7,
    maxLendDuration: 90,
    isRecallable: false,
    recallNoticeDays: 0,
    createdAt: '2026-02-20T08:00:00.000Z',
  },
  {
    offerId: 'offer-tbill6m-019',
    lender: 'party::sovereign-fund-beta',
    lenderCreditTier: 'Diamond' as CreditTier,
    security: { symbol: 'T-BILL-6M', amount: 15_000_000, type: 'TokenizedTreasury' },
    feeStructure: { type: 'FixedFee', value: 0.10 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin'],
      initialMarginPercent: 101,
      variationMarginPercent: 100.5,
      marginCallThreshold: 100,
      marginCallDeadlineHours: 48,
    },
    minLendDuration: 14,
    maxLendDuration: 180,
    isRecallable: false,
    recallNoticeDays: 0,
    createdAt: '2026-02-19T08:00:00.000Z',
  },
  {
    offerId: 'offer-tnote2y-020',
    lender: 'party::pension-fund-alpha',
    lenderCreditTier: 'Gold' as CreditTier,
    security: { symbol: 'T-NOTE-2Y', amount: 8_000_000, type: 'TokenizedTreasury' },
    feeStructure: { type: 'FixedFee', value: 0.10 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin'],
      initialMarginPercent: 102,
      variationMarginPercent: 101,
      marginCallThreshold: 100,
      marginCallDeadlineHours: 48,
    },
    minLendDuration: 30,
    maxLendDuration: 365,
    isRecallable: false,
    recallNoticeDays: 0,
    createdAt: '2026-02-17T09:00:00.000Z',
  },
  {
    offerId: 'offer-tnote5y-021',
    lender: 'party::institutional-lender-1',
    lenderCreditTier: 'Diamond' as CreditTier,
    security: { symbol: 'T-NOTE-5Y', amount: 12_000_000, type: 'TokenizedTreasury' },
    feeStructure: { type: 'FixedFee', value: 0.11 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin'],
      initialMarginPercent: 102,
      variationMarginPercent: 101,
      marginCallThreshold: 100,
      marginCallDeadlineHours: 48,
    },
    minLendDuration: 30,
    maxLendDuration: 365,
    isRecallable: false,
    recallNoticeDays: 0,
    createdAt: '2026-02-16T10:00:00.000Z',
  },
  {
    offerId: 'offer-tbond30y-022',
    lender: 'party::sovereign-fund-beta',
    lenderCreditTier: 'Diamond' as CreditTier,
    security: { symbol: 'T-BOND-30Y', amount: 5_000_000, type: 'TokenizedBond' },
    feeStructure: { type: 'FixedFee', value: 0.15 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin'],
      initialMarginPercent: 103,
      variationMarginPercent: 101,
      marginCallThreshold: 100,
      marginCallDeadlineHours: 48,
    },
    minLendDuration: 30,
    maxLendDuration: 365,
    isRecallable: false,
    recallNoticeDays: 0,
    createdAt: '2026-02-14T09:00:00.000Z',
  },
  {
    offerId: 'offer-tips10y-023',
    lender: 'party::pension-fund-alpha',
    lenderCreditTier: 'Gold' as CreditTier,
    security: { symbol: 'TIPS-10Y', amount: 6_000_000, type: 'TokenizedBond' },
    feeStructure: { type: 'FixedFee', value: 0.14 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin'],
      initialMarginPercent: 102,
      variationMarginPercent: 101,
      marginCallThreshold: 100,
      marginCallDeadlineHours: 48,
    },
    minLendDuration: 30,
    maxLendDuration: 365,
    isRecallable: false,
    recallNoticeDays: 0,
    createdAt: '2026-02-15T11:00:00.000Z',
  },

  // ── Corporate Bonds ───────────────────────────────────────────────────
  {
    offerId: 'offer-aaplbond-024',
    lender: 'party::institutional-lender-1',
    lenderCreditTier: 'Diamond' as CreditTier,
    security: { symbol: 'AAPL-BOND-2030', amount: 5_000_000, type: 'TokenizedBond' },
    feeStructure: { type: 'FixedFee', value: 0.16 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin', 'TokenizedTreasury'],
      initialMarginPercent: 104,
      variationMarginPercent: 102,
      marginCallThreshold: 100,
      marginCallDeadlineHours: 48,
    },
    minLendDuration: 30,
    maxLendDuration: 365,
    isRecallable: false,
    recallNoticeDays: 0,
    createdAt: '2026-02-18T09:00:00.000Z',
  },
  {
    offerId: 'offer-msftbond-025',
    lender: 'party::sovereign-fund-beta',
    lenderCreditTier: 'Diamond' as CreditTier,
    security: { symbol: 'MSFT-BOND-2028', amount: 8_000_000, type: 'TokenizedBond' },
    feeStructure: { type: 'FixedFee', value: 0.14 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin', 'TokenizedTreasury'],
      initialMarginPercent: 103,
      variationMarginPercent: 101,
      marginCallThreshold: 100,
      marginCallDeadlineHours: 48,
    },
    minLendDuration: 30,
    maxLendDuration: 365,
    isRecallable: false,
    recallNoticeDays: 0,
    createdAt: '2026-02-17T10:00:00.000Z',
  },
  {
    offerId: 'offer-jpmbond-026',
    lender: 'party::pension-fund-alpha',
    lenderCreditTier: 'Gold' as CreditTier,
    security: { symbol: 'JPM-BOND-2029', amount: 4_000_000, type: 'TokenizedBond' },
    feeStructure: { type: 'FixedFee', value: 0.18 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin'],
      initialMarginPercent: 105,
      variationMarginPercent: 102,
      marginCallThreshold: 100,
      marginCallDeadlineHours: 48,
    },
    minLendDuration: 30,
    maxLendDuration: 180,
    isRecallable: false,
    recallNoticeDays: 0,
    createdAt: '2026-02-16T11:00:00.000Z',
  },

  // ── Agency / MBS ──────────────────────────────────────────────────────
  {
    offerId: 'offer-mbs-027',
    lender: 'party::sovereign-fund-beta',
    lenderCreditTier: 'Diamond' as CreditTier,
    security: { symbol: 'MBS-FNMA', amount: 20_000_000, type: 'TokenizedBond' },
    feeStructure: { type: 'FixedFee', value: 0.10 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin'],
      initialMarginPercent: 102,
      variationMarginPercent: 101,
      marginCallThreshold: 100,
      marginCallDeadlineHours: 48,
    },
    minLendDuration: 30,
    maxLendDuration: 365,
    isRecallable: false,
    recallNoticeDays: 0,
    createdAt: '2026-02-13T09:00:00.000Z',
  },

  // ── Crypto Assets ─────────────────────────────────────────────────────
  {
    offerId: 'offer-sol-028',
    lender: 'party::market-maker-gamma',
    lenderCreditTier: 'Gold' as CreditTier,
    security: { symbol: 'SOL', amount: 25_000, type: 'CryptoCurrency' },
    feeStructure: { type: 'FloatingFee', value: 0.65 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin', 'CryptoCurrency'],
      initialMarginPercent: 120,
      variationMarginPercent: 110,
      marginCallThreshold: 105,
      marginCallDeadlineHours: 6,
    },
    minLendDuration: 1,
    maxLendDuration: 30,
    isRecallable: true,
    recallNoticeDays: 1,
    createdAt: '2026-02-21T10:00:00.000Z',
  },
  {
    offerId: 'offer-avax-029',
    lender: 'party::hedge-fund-delta',
    lenderCreditTier: 'Silver' as CreditTier,
    security: { symbol: 'AVAX', amount: 50_000, type: 'CryptoCurrency' },
    feeStructure: { type: 'FloatingFee', value: 0.70 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin', 'CryptoCurrency'],
      initialMarginPercent: 125,
      variationMarginPercent: 112,
      marginCallThreshold: 107,
      marginCallDeadlineHours: 6,
    },
    minLendDuration: 1,
    maxLendDuration: 30,
    isRecallable: true,
    recallNoticeDays: 1,
    createdAt: '2026-02-20T12:00:00.000Z',
  },
  {
    offerId: 'offer-link-030',
    lender: 'party::market-maker-gamma',
    lenderCreditTier: 'Gold' as CreditTier,
    security: { symbol: 'LINK', amount: 100_000, type: 'CryptoCurrency' },
    feeStructure: { type: 'FloatingFee', value: 0.60 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin'],
      initialMarginPercent: 118,
      variationMarginPercent: 108,
      marginCallThreshold: 105,
      marginCallDeadlineHours: 8,
    },
    minLendDuration: 1,
    maxLendDuration: 60,
    isRecallable: true,
    recallNoticeDays: 1,
    createdAt: '2026-02-19T15:00:00.000Z',
  },
  {
    offerId: 'offer-uni-031',
    lender: 'party::hedge-fund-delta',
    lenderCreditTier: 'Silver' as CreditTier,
    security: { symbol: 'UNI', amount: 80_000, type: 'CryptoCurrency' },
    feeStructure: { type: 'FloatingFee', value: 0.72 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin'],
      initialMarginPercent: 125,
      variationMarginPercent: 112,
      marginCallThreshold: 107,
      marginCallDeadlineHours: 6,
    },
    minLendDuration: 1,
    maxLendDuration: 30,
    isRecallable: true,
    recallNoticeDays: 1,
    createdAt: '2026-02-18T13:00:00.000Z',
  },
  {
    offerId: 'offer-aave-032',
    lender: 'party::market-maker-gamma',
    lenderCreditTier: 'Gold' as CreditTier,
    security: { symbol: 'AAVE', amount: 5_000, type: 'CryptoCurrency' },
    feeStructure: { type: 'FloatingFee', value: 0.58 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin', 'CryptoCurrency'],
      initialMarginPercent: 118,
      variationMarginPercent: 108,
      marginCallThreshold: 105,
      marginCallDeadlineHours: 8,
    },
    minLendDuration: 1,
    maxLendDuration: 60,
    isRecallable: true,
    recallNoticeDays: 1,
    createdAt: '2026-02-20T14:00:00.000Z',
  },
  {
    offerId: 'offer-steth-033',
    lender: 'party::institutional-lender-1',
    lenderCreditTier: 'Diamond' as CreditTier,
    security: { symbol: 'stETH', amount: 2_000, type: 'CryptoCurrency' },
    feeStructure: { type: 'FixedFee', value: 0.45 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin', 'CryptoCurrency'],
      initialMarginPercent: 115,
      variationMarginPercent: 108,
      marginCallThreshold: 104,
      marginCallDeadlineHours: 8,
    },
    minLendDuration: 7,
    maxLendDuration: 90,
    isRecallable: true,
    recallNoticeDays: 3,
    createdAt: '2026-02-17T16:00:00.000Z',
  },

  // ── RWA (Real World Assets) ───────────────────────────────────────────
  {
    offerId: 'offer-paxg-034',
    lender: 'party::sovereign-fund-beta',
    lenderCreditTier: 'Diamond' as CreditTier,
    security: { symbol: 'PAXG', amount: 500, type: 'TokenizedCommodity' },
    feeStructure: { type: 'FixedFee', value: 0.20 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin'],
      initialMarginPercent: 105,
      variationMarginPercent: 102,
      marginCallThreshold: 100,
      marginCallDeadlineHours: 24,
    },
    minLendDuration: 14,
    maxLendDuration: 180,
    isRecallable: true,
    recallNoticeDays: 5,
    createdAt: '2026-02-16T08:00:00.000Z',
  },
  {
    offerId: 'offer-renyc-035',
    lender: 'party::institutional-lender-1',
    lenderCreditTier: 'Diamond' as CreditTier,
    security: { symbol: 'RE-NYC-01', amount: 100, type: 'TokenizedRealEstate' },
    feeStructure: { type: 'NegotiatedFee', value: 0.35 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin', 'TokenizedTreasury'],
      initialMarginPercent: 115,
      variationMarginPercent: 108,
      marginCallThreshold: 105,
      marginCallDeadlineHours: 72,
    },
    minLendDuration: 90,
    maxLendDuration: 365,
    isRecallable: false,
    recallNoticeDays: 0,
    createdAt: '2026-02-10T09:00:00.000Z',
  },
  {
    offerId: 'offer-reldn-036',
    lender: 'party::sovereign-fund-beta',
    lenderCreditTier: 'Diamond' as CreditTier,
    security: { symbol: 'RE-LDN-01', amount: 80, type: 'TokenizedRealEstate' },
    feeStructure: { type: 'NegotiatedFee', value: 0.38 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin', 'TokenizedTreasury'],
      initialMarginPercent: 115,
      variationMarginPercent: 108,
      marginCallThreshold: 105,
      marginCallDeadlineHours: 72,
    },
    minLendDuration: 90,
    maxLendDuration: 365,
    isRecallable: false,
    recallNoticeDays: 0,
    createdAt: '2026-02-11T09:00:00.000Z',
  },
  {
    offerId: 'offer-carbon-037',
    lender: 'party::pension-fund-alpha',
    lenderCreditTier: 'Gold' as CreditTier,
    security: { symbol: 'CARBON-EU', amount: 10_000, type: 'TokenizedCommodity' },
    feeStructure: { type: 'FixedFee', value: 0.30 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin'],
      initialMarginPercent: 110,
      variationMarginPercent: 105,
      marginCallThreshold: 102,
      marginCallDeadlineHours: 24,
    },
    minLendDuration: 14,
    maxLendDuration: 90,
    isRecallable: true,
    recallNoticeDays: 5,
    createdAt: '2026-02-19T10:00:00.000Z',
  },

  // ── TIFA (Tokenized Receivables) ──────────────────────────────────────
  {
    offerId: 'offer-invsap-038',
    lender: 'party::institutional-lender-1',
    lenderCreditTier: 'Diamond' as CreditTier,
    security: { symbol: 'INV-SAP-Q1', amount: 2_000_000, type: 'TokenizedReceivable' },
    feeStructure: { type: 'FixedFee', value: 0.22 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin'],
      initialMarginPercent: 108,
      variationMarginPercent: 104,
      marginCallThreshold: 102,
      marginCallDeadlineHours: 48,
    },
    minLendDuration: 30,
    maxLendDuration: 90,
    isRecallable: false,
    recallNoticeDays: 0,
    createdAt: '2026-02-18T10:00:00.000Z',
  },
  {
    offerId: 'offer-invsiemens-039',
    lender: 'party::pension-fund-alpha',
    lenderCreditTier: 'Gold' as CreditTier,
    security: { symbol: 'INV-SIEMENS-Q1', amount: 3_000_000, type: 'TokenizedReceivable' },
    feeStructure: { type: 'FixedFee', value: 0.24 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin'],
      initialMarginPercent: 108,
      variationMarginPercent: 104,
      marginCallThreshold: 102,
      marginCallDeadlineHours: 48,
    },
    minLendDuration: 30,
    maxLendDuration: 90,
    isRecallable: false,
    recallNoticeDays: 0,
    createdAt: '2026-02-17T11:00:00.000Z',
  },
  {
    offerId: 'offer-scf-040',
    lender: 'party::sovereign-fund-beta',
    lenderCreditTier: 'Diamond' as CreditTier,
    security: { symbol: 'SCF-TRADE-01', amount: 5_000_000, type: 'TokenizedReceivable' },
    feeStructure: { type: 'FixedFee', value: 0.20 },
    collateralSchedule: {
      acceptedCollateralTypes: ['Stablecoin'],
      initialMarginPercent: 106,
      variationMarginPercent: 103,
      marginCallThreshold: 101,
      marginCallDeadlineHours: 48,
    },
    minLendDuration: 14,
    maxLendDuration: 60,
    isRecallable: false,
    recallNoticeDays: 0,
    createdAt: '2026-02-15T12:00:00.000Z',
  },
];

const MOCK_DEALS: SecLendingDealItem[] = [
  {
    dealId: 'deal-001',
    role: 'lender',
    security: { symbol: 'AAPL', amount: 2_000 },
    borrower: 'party::hedge-fund-delta',
    status: 'Active',
    feeAccrued: 1_245.80,
    collateralValueUSD: 382_200,
    securityValueUSD: 364_000,
    collateralRatio: 1.05,
    startDate: '2026-01-15T10:00:00.000Z',
    expectedEndDate: '2026-04-15T10:00:00.000Z',
    daysSinceStart: 38,
    corporateActions: [],
  },
  {
    dealId: 'deal-002',
    role: 'borrower',
    security: { symbol: 'TSLA', amount: 500 },
    borrower: 'party::current-user',
    status: 'Active',
    feeAccrued: 456.25,
    collateralValueUSD: 132_000,
    securityValueUSD: 125_000,
    collateralRatio: 1.056,
    startDate: '2026-02-01T08:30:00.000Z',
    expectedEndDate: '2026-05-01T08:30:00.000Z',
    daysSinceStart: 21,
    corporateActions: [],
  },
  {
    dealId: 'deal-003',
    role: 'lender',
    security: { symbol: 'US-T10Y', amount: 5_000_000 },
    borrower: 'party::bank-epsilon',
    status: 'RecallRequested',
    feeAccrued: 8_219.17,
    collateralValueUSD: 5_100_000,
    securityValueUSD: 5_000_000,
    collateralRatio: 1.02,
    startDate: '2025-11-01T09:00:00.000Z',
    expectedEndDate: '2026-05-01T09:00:00.000Z',
    daysSinceStart: 113,
    corporateActions: [],
  },
  {
    dealId: 'deal-004',
    role: 'lender',
    security: { symbol: 'NVDA', amount: 800 },
    borrower: 'party::hedge-fund-delta',
    status: 'Active',
    feeAccrued: 892.50,
    collateralValueUSD: 97_600,
    securityValueUSD: 88_000,
    collateralRatio: 1.109,
    startDate: '2026-02-10T09:00:00.000Z',
    expectedEndDate: '2026-04-10T09:00:00.000Z',
    daysSinceStart: 19,
    corporateActions: [],
  },
  {
    dealId: 'deal-005',
    role: 'borrower',
    security: { symbol: 'T-BILL-3M', amount: 2_000_000 },
    borrower: 'party::current-user',
    status: 'Active',
    feeAccrued: 328.77,
    collateralValueUSD: 2_020_000,
    securityValueUSD: 2_000_000,
    collateralRatio: 1.01,
    startDate: '2026-02-15T10:00:00.000Z',
    expectedEndDate: '2026-05-15T10:00:00.000Z',
    daysSinceStart: 14,
    corporateActions: [],
  },
  {
    dealId: 'deal-006',
    role: 'lender',
    security: { symbol: 'SOL', amount: 5_000 },
    borrower: 'party::market-maker-gamma',
    status: 'Active',
    feeAccrued: 1_876.40,
    collateralValueUSD: 780_000,
    securityValueUSD: 650_000,
    collateralRatio: 1.20,
    startDate: '2026-02-05T12:00:00.000Z',
    expectedEndDate: '2026-03-05T12:00:00.000Z',
    daysSinceStart: 24,
    corporateActions: [],
  },
  {
    dealId: 'deal-007',
    role: 'lender',
    security: { symbol: 'PAXG', amount: 100 },
    borrower: 'party::bank-epsilon',
    status: 'Active',
    feeAccrued: 412.30,
    collateralValueUSD: 210_000,
    securityValueUSD: 200_000,
    collateralRatio: 1.05,
    startDate: '2026-01-20T09:00:00.000Z',
    expectedEndDate: '2026-07-20T09:00:00.000Z',
    daysSinceStart: 40,
    corporateActions: [],
  },
  {
    dealId: 'deal-008',
    role: 'borrower',
    security: { symbol: 'MSFT-BOND-2028', amount: 1_000_000 },
    borrower: 'party::current-user',
    status: 'Active',
    feeAccrued: 575.34,
    collateralValueUSD: 1_030_000,
    securityValueUSD: 1_000_000,
    collateralRatio: 1.03,
    startDate: '2026-02-01T10:00:00.000Z',
    expectedEndDate: '2026-08-01T10:00:00.000Z',
    daysSinceStart: 28,
    corporateActions: [],
  },
];

export function listOffers(
  params: ListSecLendingOffersParams
): { data: SecLendingOfferItem[]; pagination: Pagination } {
  log.debug({ params }, 'Listing sec lending offers');

  let filtered = [...MOCK_OFFERS];

  if (params.assetType && params.assetType !== 'all') {
    const typeMap: Record<string, string | string[]> = {
      equity: 'TokenizedEquity',
      bond: 'TokenizedBond',
      treasury: 'TokenizedTreasury',
      crypto: 'CryptoCurrency',
      rwa: ['TokenizedCommodity', 'TokenizedRealEstate'],
      receivable: 'TokenizedReceivable',
    };
    const mapped = typeMap[params.assetType];
    if (mapped) {
      filtered = filtered.filter((o) =>
        Array.isArray(mapped) ? mapped.includes(o.security.type) : o.security.type === mapped
      );
    }
  }

  if (params.minFee !== undefined) {
    filtered = filtered.filter((o) => o.feeStructure.value >= (params.minFee as number));
  }
  if (params.maxFee !== undefined) {
    filtered = filtered.filter((o) => o.feeStructure.value <= (params.maxFee as number));
  }
  if (params.minDuration !== undefined) {
    filtered = filtered.filter((o) => o.maxLendDuration >= (params.minDuration as number));
  }

  if (params.sortBy) {
    const dir = 1; // default ascending
    filtered.sort((a, b) => {
      switch (params.sortBy) {
        case 'fee':
          return (a.feeStructure.value - b.feeStructure.value) * dir;
        case 'value':
          return (a.security.amount - b.security.amount) * dir;
        case 'duration':
          return (a.maxLendDuration - b.maxLendDuration) * dir;
        case 'created':
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
        default:
          return 0;
      }
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

export function createOffer(
  partyId: string,
  params: CreateSecLendingOfferRequest
): { data: CreateOfferResponse; transaction: TransactionMeta } {
  log.info({ partyId, security: params.security.symbol }, 'Creating sec lending offer');

  return {
    data: {
      offerId: `offer-${params.security.symbol.toLowerCase()}-${randomUUID().slice(0, 8)}`,
      status: 'Offered',
    },
    transaction: buildTransactionMeta(),
  };
}

export function acceptOffer(
  partyId: string,
  offerId: string,
  params: AcceptSecLendingOfferRequest
): { data: AcceptOfferResponse; transaction: TransactionMeta } {
  log.info({ partyId, offerId }, 'Accepting sec lending offer');

  const offer = MOCK_OFFERS.find((o) => o.offerId === offerId);
  if (!offer) {
    throw new Error(`Offer ${offerId} not found`);
  }

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + params.requestedDuration * 86_400_000);

  return {
    data: {
      dealId: `deal-${randomUUID().slice(0, 8)}`,
      status: 'Active',
      startDate: startDate.toISOString(),
      expectedEndDate: endDate.toISOString(),
    },
    transaction: buildTransactionMeta(),
  };
}

export function getDeals(
  partyId: string
): SecLendingDealItem[] {
  log.debug({ partyId }, 'Getting sec lending deals');
  return MOCK_DEALS;
}

export function recall(
  partyId: string,
  dealId: string
): { data: RecallResponse; transaction: TransactionMeta } {
  log.info({ partyId, dealId }, 'Recalling securities');

  const deal = MOCK_DEALS.find((d) => d.dealId === dealId);
  if (!deal) {
    throw new Error(`Deal ${dealId} not found`);
  }

  return {
    data: {
      dealId,
      status: 'RecallRequested',
      recallDate: new Date().toISOString(),
    },
    transaction: buildTransactionMeta(),
  };
}

export function returnSecurities(
  partyId: string,
  dealId: string
): { data: ReturnResponse; transaction: TransactionMeta } {
  log.info({ partyId, dealId }, 'Returning securities');

  const deal = MOCK_DEALS.find((d) => d.dealId === dealId);
  if (!deal) {
    throw new Error(`Deal ${dealId} not found`);
  }

  return {
    data: {
      dealId,
      status: 'Settled',
      totalFeePaid: deal.feeAccrued,
      collateralReturned: true,
    },
    transaction: buildTransactionMeta(),
  };
}

// ---------------------------------------------------------------------------
// Fractional offer support
// ---------------------------------------------------------------------------

interface FractionalOffer {
  offerId: string;
  lender: string;
  security: { symbol: string; amount: number; type: string };
  totalAmount: number;
  remainingAmount: number;
  minFillAmount: number;
  feeRate: number;
  fills: Array<{ filledBy: string; amount: number; filledAt: string }>;
  isActive: boolean;
  createdAt: string;
}

const MOCK_FRACTIONAL_OFFERS: FractionalOffer[] = [
  {
    offerId: 'frac-offer-001',
    lender: 'party::institutional-lender-1',
    security: { symbol: 'AAPL', amount: 50_000, type: 'TokenizedEquity' },
    totalAmount: 50_000,
    remainingAmount: 35_000,
    minFillAmount: 2_500,
    feeRate: 0.28,
    fills: [{ filledBy: 'party::hedge-fund-delta', amount: 15_000, filledAt: '2026-02-15T10:00:00.000Z' }],
    isActive: true,
    createdAt: '2026-02-10T08:00:00.000Z',
  },
  {
    offerId: 'frac-offer-002',
    lender: 'party::pension-fund-alpha',
    security: { symbol: 'NVDA', amount: 15_000, type: 'TokenizedEquity' },
    totalAmount: 15_000,
    remainingAmount: 12_000,
    minFillAmount: 500,
    feeRate: 0.48,
    fills: [{ filledBy: 'party::hedge-fund-delta', amount: 3_000, filledAt: '2026-02-20T11:00:00.000Z' }],
    isActive: true,
    createdAt: '2026-02-19T09:00:00.000Z',
  },
  {
    offerId: 'frac-offer-003',
    lender: 'party::sovereign-fund-beta',
    security: { symbol: 'T-BILL-3M', amount: 50_000_000, type: 'TokenizedTreasury' },
    totalAmount: 50_000_000,
    remainingAmount: 30_000_000,
    minFillAmount: 1_000_000,
    feeRate: 0.06,
    fills: [{ filledBy: 'party::institutional-lender-1', amount: 20_000_000, filledAt: '2026-02-18T10:00:00.000Z' }],
    isActive: true,
    createdAt: '2026-02-15T09:00:00.000Z',
  },
  {
    offerId: 'frac-offer-004',
    lender: 'party::market-maker-gamma',
    security: { symbol: 'SOL', amount: 100_000, type: 'CryptoCurrency' },
    totalAmount: 100_000,
    remainingAmount: 70_000,
    minFillAmount: 1_000,
    feeRate: 0.58,
    fills: [{ filledBy: 'party::hedge-fund-delta', amount: 30_000, filledAt: '2026-02-20T15:00:00.000Z' }],
    isActive: true,
    createdAt: '2026-02-19T12:00:00.000Z',
  },
];

export function listFractionalOffers(): FractionalOffer[] {
  log.debug('Listing fractional offers');
  return MOCK_FRACTIONAL_OFFERS.filter((o) => o.isActive);
}

export function createFractionalOffer(
  partyId: string,
  params: { security: { symbol: string; amount: number; type: string }; minFillAmount: number; feeRate: number },
): { data: FractionalOffer; transaction: TransactionMeta } {
  log.info({ partyId, symbol: params.security.symbol }, 'Creating fractional offer');

  const offer: FractionalOffer = {
    offerId: `frac-offer-${randomUUID().slice(0, 8)}`,
    lender: partyId,
    security: params.security,
    totalAmount: params.security.amount,
    remainingAmount: params.security.amount,
    minFillAmount: params.minFillAmount,
    feeRate: params.feeRate,
    fills: [],
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  MOCK_FRACTIONAL_OFFERS.push(offer);
  return { data: offer, transaction: buildTransactionMeta() };
}

export function fillFractionalOffer(
  partyId: string,
  offerId: string,
  amount: number,
): { data: { dealId: string; filledAmount: number; remainingAmount: number }; transaction: TransactionMeta } {
  log.info({ partyId, offerId, amount }, 'Filling fractional offer');

  const offer = MOCK_FRACTIONAL_OFFERS.find((o) => o.offerId === offerId);
  if (!offer) throw new Error(`Fractional offer ${offerId} not found`);
  if (amount < offer.minFillAmount) throw new Error(`Minimum fill is ${offer.minFillAmount}`);

  offer.fills.push({ filledBy: partyId, amount, filledAt: new Date().toISOString() });
  offer.remainingAmount -= amount;
  if (offer.remainingAmount <= 0) offer.isActive = false;

  return {
    data: {
      dealId: `deal-frac-${randomUUID().slice(0, 8)}`,
      filledAmount: amount,
      remainingAmount: Math.max(0, offer.remainingAmount),
    },
    transaction: buildTransactionMeta(),
  };
}

// ---------------------------------------------------------------------------
// Dynamic fee calculation
// ---------------------------------------------------------------------------

export function calculateDynamicFee(
  security: string,
  amount: number,
  durationDays: number,
): { suggestedFee: number; baseFee: number; demandMultiplier: number; durationFactor: number } {
  log.debug({ security, amount, durationDays }, 'Calculating dynamic fee');

  const baseFee = 0.25;
  const demandMultiplier = Math.min(2, 1 + (amount / 50_000) * 0.5);
  const durationFactor = 1 + (durationDays / 365) * 0.3;
  const suggestedFee = Number((baseFee * demandMultiplier * durationFactor).toFixed(4));

  return {
    suggestedFee,
    baseFee,
    demandMultiplier: Number(demandMultiplier.toFixed(4)),
    durationFactor: Number(durationFactor.toFixed(4)),
  };
}

// ---------------------------------------------------------------------------
// Netting proposals
// ---------------------------------------------------------------------------

interface NettingAgreement {
  agreementId: string;
  partyA: string;
  partyB: string;
  dealIds: string[];
  netAmount: number;
  netDirection: string;
  status: string;
  createdAt: string;
}

const MOCK_NETTING: NettingAgreement[] = [
  {
    agreementId: 'net-001',
    partyA: 'party::alice::1',
    partyB: 'party::bob::2',
    dealIds: ['deal-001', 'deal-002'],
    netAmount: 25_000,
    netDirection: 'partyA_owes',
    status: 'proposed',
    createdAt: '2026-02-20T10:00:00.000Z',
  },
];

export function proposeNetting(
  partyId: string,
  counterparty: string,
  dealIds: string[],
): { data: NettingAgreement; transaction: TransactionMeta } {
  log.info({ partyId, counterparty, dealIds }, 'Proposing netting');

  const agreement: NettingAgreement = {
    agreementId: `net-${randomUUID().slice(0, 8)}`,
    partyA: partyId,
    partyB: counterparty,
    dealIds,
    netAmount: Math.round(Math.random() * 50_000),
    netDirection: 'partyA_owes',
    status: 'proposed',
    createdAt: new Date().toISOString(),
  };

  MOCK_NETTING.push(agreement);
  return { data: agreement, transaction: buildTransactionMeta() };
}

export function executeNetting(
  partyId: string,
  agreementId: string,
): { data: { agreementId: string; status: string; settledAmount: number }; transaction: TransactionMeta } {
  log.info({ partyId, agreementId }, 'Executing netting');

  const agreement = MOCK_NETTING.find((n) => n.agreementId === agreementId);
  if (!agreement) throw new Error(`Netting agreement ${agreementId} not found`);

  agreement.status = 'settled';

  return {
    data: { agreementId, status: 'settled', settledAmount: agreement.netAmount },
    transaction: buildTransactionMeta(),
  };
}

export function getNettingAgreements(partyId: string): NettingAgreement[] {
  log.debug({ partyId }, 'Getting netting agreements');
  return MOCK_NETTING.filter((n) => n.partyA === partyId || n.partyB === partyId);
}
