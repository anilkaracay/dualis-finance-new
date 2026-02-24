import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/logger.js', () => ({
  createChildLogger: () => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  }),
}));

import {
  listOffers, createOffer, acceptOffer, getDeals, recall, returnSecurities,
  listFractionalOffers, createFractionalOffer, fillFractionalOffer,
  calculateDynamicFee, proposeNetting, executeNetting, getNettingAgreements,
} from '../secLending.service';

describe('SecLending Service', () => {
  describe('listOffers', () => {
    it('returns all offers with default params', () => {
      const result = listOffers({});
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.pagination).toHaveProperty('total');
      expect(result.pagination).toHaveProperty('hasMore');
    });
    it('filters by assetType equity', () => {
      const result = listOffers({ assetType: 'equity' });
      result.data.forEach(o => {
        expect(o.security.type).toBe('TokenizedEquity');
      });
    });
    it('filters by assetType bond', () => {
      const result = listOffers({ assetType: 'bond' });
      result.data.forEach(o => {
        expect(o.security.type).toBe('TokenizedBond');
      });
    });
    it('filters by minFee', () => {
      const result = listOffers({ minFee: 0.30 });
      result.data.forEach(o => {
        expect(o.feeStructure.value).toBeGreaterThanOrEqual(0.30);
      });
    });
    it('paginates correctly', () => {
      const result = listOffers({ limit: 2, offset: 0 });
      expect(result.data.length).toBeLessThanOrEqual(2);
      expect(result.pagination.limit).toBe(2);
    });
  });

  describe('createOffer', () => {
    it('returns offerId and Offered status', () => {
      const result = createOffer('party::alice', {
        security: { symbol: 'GOOG', amount: '1000' },
        feeType: 'fixed',
        feeValue: 0.30,
        acceptedCollateralTypes: ['cash'],
        initialMarginPercent: 105,
        minLendDuration: 7,
        isRecallable: true,
        recallNoticeDays: 3,
      });
      expect(result.data.offerId).toBeDefined();
      expect(result.data.status).toBe('Offered');
      expect(result.transaction.status).toBe('confirmed');
    });
  });

  describe('acceptOffer', () => {
    it('returns dealId with Active status', () => {
      const result = acceptOffer('party::bob', 'offer-aapl-001', {
        collateral: [{ symbol: 'USDC', amount: '500000' }],
        requestedDuration: 30,
      });
      expect(result.data.dealId).toBeDefined();
      expect(result.data.status).toBe('Active');
      expect(result.data.expectedEndDate).toBeDefined();
    });
    it('throws for non-existent offer', () => {
      expect(() => acceptOffer('party::bob', 'fake-offer', {
        collateral: [{ symbol: 'USDC', amount: '100' }],
        requestedDuration: 7,
      })).toThrow();
    });
  });

  describe('getDeals', () => {
    it('returns mock deals', () => {
      const deals = getDeals('party::alice');
      expect(deals.length).toBeGreaterThan(0);
      expect(deals[0]).toHaveProperty('dealId');
      expect(deals[0]).toHaveProperty('security');
      expect(deals[0]).toHaveProperty('status');
    });
  });

  describe('recall', () => {
    it('returns RecallRequested status', () => {
      const result = recall('party::alice', 'deal-001');
      expect(result.data.status).toBe('RecallRequested');
    });
    it('throws for non-existent deal', () => {
      expect(() => recall('party::alice', 'fake-deal')).toThrow();
    });
  });

  describe('returnSecurities', () => {
    it('returns Settled status', () => {
      const result = returnSecurities('party::bob', 'deal-002');
      expect(result.data.status).toBe('Settled');
      expect(result.data.collateralReturned).toBe(true);
    });
    it('throws for non-existent deal', () => {
      expect(() => returnSecurities('party::bob', 'fake-deal')).toThrow();
    });
  });

  describe('calculateDynamicFee', () => {
    it('returns fee components', () => {
      const result = calculateDynamicFee('AAPL', 10000, 30);
      expect(result).toHaveProperty('suggestedFee');
      expect(result).toHaveProperty('baseFee', 0.25);
      expect(result).toHaveProperty('demandMultiplier');
      expect(result).toHaveProperty('durationFactor');
    });
    it('baseFee is 0.25', () => {
      const result = calculateDynamicFee('TEST', 1, 1);
      expect(result.baseFee).toBe(0.25);
    });
    it('demand multiplier increases with amount', () => {
      const small = calculateDynamicFee('TEST', 1000, 30);
      const large = calculateDynamicFee('TEST', 100000, 30);
      expect(large.demandMultiplier).toBeGreaterThan(small.demandMultiplier);
    });
    it('demand multiplier capped at 2', () => {
      const result = calculateDynamicFee('TEST', 10_000_000, 30);
      expect(result.demandMultiplier).toBeLessThanOrEqual(2);
    });
    it('duration factor increases with days', () => {
      const short = calculateDynamicFee('TEST', 10000, 7);
      const long = calculateDynamicFee('TEST', 10000, 365);
      expect(long.durationFactor).toBeGreaterThan(short.durationFactor);
    });
  });

  describe('Fractional Offers', () => {
    it('lists active fractional offers', () => {
      const offers = listFractionalOffers();
      expect(offers.length).toBeGreaterThan(0);
      offers.forEach(o => expect(o.isActive).toBe(true));
    });
    it('creates a fractional offer', () => {
      const result = createFractionalOffer('party::alice', {
        security: { symbol: 'MSFT', amount: 20000, type: 'TokenizedEquity' },
        minFillAmount: 1000,
        feeRate: 0.30,
      });
      expect(result.data.totalAmount).toBe(20000);
      expect(result.data.remainingAmount).toBe(20000);
    });
  });

  describe('Netting', () => {
    it('proposes netting agreement', () => {
      const result = proposeNetting('alice', 'bob', ['deal-001']);
      expect(result.data.status).toBe('proposed');
      expect(result.data.partyA).toBe('alice');
      expect(result.data.partyB).toBe('bob');
    });
    it('gets netting agreements for party', () => {
      const agreements = getNettingAgreements('alice');
      expect(agreements.length).toBeGreaterThan(0);
    });
  });
});
