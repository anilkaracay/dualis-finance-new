import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/logger.js', () => ({
  createChildLogger: () => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  }),
}));

import {
  listOffers,
  createOffer,
  acceptOffer,
  getDeals,
  recall,
  returnSecurities,
  calculateDynamicFee,
  listFractionalOffers,
  createFractionalOffer,
  fillFractionalOffer,
  proposeNetting,
  executeNetting,
  getNettingAgreements,
} from '../secLending.service';

describe('Securities Lending Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Offer → Accept → Deal → Recall → Return', () => {
    it('creates an offer and gets back offerId', () => {
      const result = createOffer('party::lender', {
        security: { symbol: 'GOOG', amount: '1000' },
        feeType: 'fixed',
        feeValue: 0.30,
        acceptedCollateralTypes: ['cash'],
        initialMarginPercent: 105,
        minLendDuration: 7,
        isRecallable: true,
        recallNoticeDays: 3,
      });

      expect(result.data).toHaveProperty('offerId');
      expect(result.data.status).toBe('Offered');
      expect(result.transaction).toHaveProperty('id');
    });

    it('accepts an offer and creates a deal', () => {
      // Use a known mock offer ID
      const offers = listOffers({});
      expect(offers.data.length).toBeGreaterThan(0);
      const offerId = offers.data[0].offerId;

      const deal = acceptOffer('party::borrower', offerId, { requestedDuration: 30 });
      expect(deal.data).toHaveProperty('dealId');
      expect(deal.data).toHaveProperty('expectedEndDate');
    });

    it('lists deals for authenticated user', () => {
      const deals = getDeals('party::borrower');
      expect(deals.length).toBeGreaterThan(0);
      deals.forEach((deal) => {
        expect(deal).toHaveProperty('dealId');
        expect(deal).toHaveProperty('status');
      });
    });

    it('recall throws for non-existent deal', () => {
      expect(() => recall('party::lender', 'non-existent-deal')).toThrow('not found');
    });

    it('return throws for non-existent deal', () => {
      expect(() => returnSecurities('party::borrower', 'non-existent-deal')).toThrow('not found');
    });
  });

  describe('Dynamic Fee Calculation', () => {
    it('returns fee breakdown with suggestedFee', () => {
      const result = calculateDynamicFee('GOOG', 0, 30);
      expect(result).toHaveProperty('suggestedFee');
      expect(result).toHaveProperty('baseFee');
      expect(result).toHaveProperty('demandMultiplier');
      expect(result).toHaveProperty('durationFactor');
      expect(result.suggestedFee).toBeGreaterThan(0);
    });

    it('caps demand multiplier at 2', () => {
      const result = calculateDynamicFee('GOOG', 1_000_000, 30);
      expect(result.demandMultiplier).toBeLessThanOrEqual(2);
    });

    it('longer duration increases fee', () => {
      const short = calculateDynamicFee('GOOG', 10000, 7);
      const long = calculateDynamicFee('GOOG', 10000, 90);
      expect(long.suggestedFee).toBeGreaterThan(short.suggestedFee);
    });
  });

  describe('Fractional Offers', () => {
    it('lists fractional offers', () => {
      const offers = listFractionalOffers();
      expect(Array.isArray(offers)).toBe(true);
    });

    it('creates a fractional offer', () => {
      const result = createFractionalOffer('party::lender', {
        security: { symbol: 'SPY', amount: 10000, type: 'TokenizedEquity' },
        minFillAmount: 100,
        feeRate: 0.015,
      });
      expect(result.data).toHaveProperty('offerId');
      expect(result.data.totalAmount).toBe(10000);
    });

    it('fills a fraction of the offer', () => {
      const offers = listFractionalOffers();
      if (offers.length > 0) {
        const result = fillFractionalOffer('party::borrower', offers[0].offerId, 5000);
        expect(result.data).toHaveProperty('dealId');
        expect(result.data).toHaveProperty('filledAmount');
      }
    });
  });

  describe('Netting', () => {
    it('proposes a netting agreement', () => {
      const result = proposeNetting('party::a', 'party::b', ['deal-1', 'deal-2']);
      expect(result.data).toHaveProperty('agreementId');
      expect(result.data.status).toBe('proposed');
    });

    it('executes a netting agreement', () => {
      // First propose one to get a known ID
      const proposed = proposeNetting('party::x', 'party::y', ['deal-3']);
      const result = executeNetting('party::x', proposed.data.agreementId);
      expect(result.data.status).toBe('settled');
    });

    it('filters netting agreements by partyId', () => {
      proposeNetting('party::filter-test', 'party::other', ['deal-99']);
      const agreements = getNettingAgreements('party::filter-test');
      agreements.forEach((a) => {
        expect(a.partyA === 'party::filter-test' || a.partyB === 'party::filter-test').toBe(true);
      });
    });
  });
});
