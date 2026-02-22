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
    offerId: 'offer-tbill-003',
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
    offerId: 'offer-spy-004',
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
];

export function listOffers(
  params: ListSecLendingOffersParams
): { data: SecLendingOfferItem[]; pagination: Pagination } {
  log.debug({ params }, 'Listing sec lending offers');

  let filtered = [...MOCK_OFFERS];

  if (params.assetType && params.assetType !== 'all') {
    const typeMap: Record<string, string> = {
      equity: 'TokenizedEquity',
      bond: 'TokenizedBond',
      treasury: 'TokenizedTreasury',
    };
    const mapped = typeMap[params.assetType];
    if (mapped) {
      filtered = filtered.filter((o) => o.security.type === mapped);
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
