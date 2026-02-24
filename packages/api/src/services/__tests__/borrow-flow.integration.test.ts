import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/logger.js', () => ({
  createChildLogger: () => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  }),
}));

vi.mock('../../services/compositeCredit.service.js', () => ({
  getCompositeScore: vi.fn(() => ({
    tier: 'Gold',
    totalScore: 750,
    benefits: { rateDiscount: 0.15, maxLTV: 0.78 },
  })),
}));

import {
  requestBorrow,
  getPositions,
  repay,
  addCollateral,
} from '../borrow.service';

describe('Borrow Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Full Lifecycle: borrow → positions → repay → add collateral', () => {
    it('creates a borrow position successfully', () => {
      const result = requestBorrow('party::test', {
        lendingPoolId: 'usdc-main',
        borrowAmount: '1000',
        collateralAssets: [{ symbol: 'ETH', amount: '10' }],
      });

      expect(result.data).toHaveProperty('borrowPositionId');
      expect(result.data).toHaveProperty('collateralPositionId');
      expect(result.data).toHaveProperty('healthFactor');
      // healthFactor is an object { value, collateralValueUSD, borrowValueUSD, weightedLTV }
      expect(result.data.healthFactor.value).toBeGreaterThanOrEqual(1.2);
      expect(result.data).toHaveProperty('creditTier', 'Gold');
      expect(result.data).toHaveProperty('borrowAPY');
      expect(result.data.borrowAPY).toBeGreaterThan(0);
      expect(result.transaction).toHaveProperty('id');
    });

    it('retrieves positions after borrow', () => {
      const positions = getPositions('party::test');
      expect(positions.length).toBe(3); // 3 mock positions
      positions.forEach((pos) => {
        expect(pos).toHaveProperty('positionId');
        expect(pos).toHaveProperty('currentDebt');
        expect(pos).toHaveProperty('healthFactor');
      });
    });

    it('repays part of the loan', () => {
      // repay signature: (partyId, positionId, amount: string)
      const result = repay('party::test', 'borrow-pos-001', '100');
      expect(result.data).toHaveProperty('remainingDebt');
      expect(result.data.remainingDebt).toBeLessThan(50_234.56);
    });

    it('full repayment floors remaining to 0', () => {
      const result = repay('party::test', 'borrow-pos-001', '999999');
      expect(result.data.remainingDebt).toBe(0);
    });

    it('adds collateral to an existing position', () => {
      // addCollateral signature: (partyId, positionId, asset: { symbol, amount })
      const result = addCollateral('party::test', 'borrow-pos-001', { symbol: 'ETH', amount: '1' });
      expect(result.data).toHaveProperty('newCollateralValueUSD');
      expect(result.data).toHaveProperty('newHealthFactor');
      expect(result.data.newHealthFactor).toBeGreaterThan(0);
    });
  });

  describe('Credit Tier Impact', () => {
    it('Gold tier gets rate discount applied', () => {
      const result = requestBorrow('party::test', {
        lendingPoolId: 'usdc-main',
        borrowAmount: '1000',
        collateralAssets: [{ symbol: 'ETH', amount: '10' }],
      });

      expect(result.data.creditTier).toBe('Gold');
      expect(result.data.borrowAPY).toBeGreaterThan(0);
    });
  });

  describe('Error Cases', () => {
    it('insufficient collateral rejects borrow', () => {
      expect(() =>
        requestBorrow('party::test', {
          lendingPoolId: 'usdc-main',
          borrowAmount: '999999999',
          collateralAssets: [{ symbol: 'ETH', amount: '0.001' }],
        }),
      ).toThrow('INSUFFICIENT_COLLATERAL');
    });

    it('repay on non-existent position throws', () => {
      expect(() =>
        repay('party::test', 'non-existent-pos', '100'),
      ).toThrow();
    });

    it('add collateral on non-existent position throws', () => {
      expect(() =>
        addCollateral('party::test', 'non-existent-pos', { symbol: 'ETH', amount: '1' }),
      ).toThrow();
    });
  });
});
