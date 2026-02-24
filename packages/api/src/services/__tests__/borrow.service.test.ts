import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/logger.js', () => ({
  createChildLogger: () => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  }),
}));

vi.mock('../compositeCredit.service.js', () => ({
  getCompositeScore: vi.fn(() => ({
    tier: 'Gold',
    totalScore: 750,
    benefits: { rateDiscount: 0.15, maxLTV: 0.78 },
  })),
}));

import { requestBorrow, getPositions, repay, addCollateral } from '../borrow.service';

describe('Borrow Service', () => {
  describe('requestBorrow', () => {
    it('returns borrow response with correct fields', () => {
      const result = requestBorrow('party::alice', {
        lendingPoolId: 'usdc-main',
        borrowAmount: '10000',
        collateralAssets: [
          { symbol: 'ETH', amount: '10' },
          { symbol: 'wBTC', amount: '0.5' },
        ],
      });
      expect(result.data).toHaveProperty('borrowPositionId');
      expect(result.data).toHaveProperty('collateralPositionId');
      expect(result.data).toHaveProperty('healthFactor');
      expect(result.data).toHaveProperty('creditTier');
      expect(result.data).toHaveProperty('borrowAPY');
      expect(result.transaction).toHaveProperty('id');
      expect(result.transaction.status).toBe('confirmed');
    });

    it('returns Gold tier when composite score is Gold', () => {
      const result = requestBorrow('party::alice', {
        lendingPoolId: 'usdc-main',
        borrowAmount: '10000',
        collateralAssets: [{ symbol: 'ETH', amount: '10' }],
      });
      expect(result.data.creditTier).toBe('Gold');
    });

    it('health factor is above 1.2', () => {
      const result = requestBorrow('party::alice', {
        lendingPoolId: 'usdc-main',
        borrowAmount: '5000',
        collateralAssets: [{ symbol: 'ETH', amount: '10' }],
      });
      expect(result.data.healthFactor.value).toBeGreaterThanOrEqual(1.2);
    });

    it('throws INSUFFICIENT_COLLATERAL when borrow exceeds max', () => {
      expect(() => requestBorrow('party::alice', {
        lendingPoolId: 'usdc-main',
        borrowAmount: '999999999',
        collateralAssets: [{ symbol: 'ETH', amount: '0.001' }],
      })).toThrow('INSUFFICIENT_COLLATERAL');
    });

    it('borrowAPY is a number > 0', () => {
      const result = requestBorrow('party::alice', {
        lendingPoolId: 'usdc-main',
        borrowAmount: '1000',
        collateralAssets: [{ symbol: 'ETH', amount: '10' }],
      });
      expect(result.data.borrowAPY).toBeGreaterThan(0);
    });

    it('handles different pools', () => {
      const result = requestBorrow('party::alice', {
        lendingPoolId: 'eth-main',
        borrowAmount: '1',
        collateralAssets: [{ symbol: 'USDC', amount: '100000' }],
      });
      expect(result.data.borrowPositionId).toBeDefined();
    });
  });

  describe('getPositions', () => {
    it('returns 3 mock positions', () => {
      const positions = getPositions('party::alice');
      expect(positions).toHaveLength(3);
    });
    it('each position has required fields', () => {
      const positions = getPositions('party::alice');
      for (const pos of positions) {
        expect(pos).toHaveProperty('positionId');
        expect(pos).toHaveProperty('lendingPoolId');
        expect(pos).toHaveProperty('borrowedAsset');
        expect(pos).toHaveProperty('currentDebt');
        expect(pos).toHaveProperty('healthFactor');
        expect(pos).toHaveProperty('creditTier');
        expect(pos).toHaveProperty('collateral');
      }
    });
  });

  describe('repay', () => {
    it('reduces remaining debt', () => {
      const result = repay('party::alice', 'borrow-pos-001', '10000');
      expect(result.data.remainingDebt).toBeLessThan(50_234.56);
    });
    it('full repayment floors debt at 0', () => {
      const result = repay('party::alice', 'borrow-pos-001', '999999');
      expect(result.data.remainingDebt).toBe(0);
    });
    it('throws for non-existent position', () => {
      expect(() => repay('party::alice', 'fake-pos', '100')).toThrow('not found');
    });
    it('returns transaction meta', () => {
      const result = repay('party::alice', 'borrow-pos-001', '100');
      expect(result.transaction).toHaveProperty('id');
      expect(result.transaction.status).toBe('confirmed');
    });
  });

  describe('addCollateral', () => {
    it('increases collateral value', () => {
      const result = addCollateral('party::alice', 'borrow-pos-001', {
        symbol: 'ETH', amount: '5',
      });
      expect(result.data.newCollateralValueUSD).toBeGreaterThan(92_925);
    });
    it('returns new health factor', () => {
      const result = addCollateral('party::alice', 'borrow-pos-001', {
        symbol: 'USDC', amount: '10000',
      });
      expect(result.data.newHealthFactor).toBeGreaterThan(0);
    });
    it('throws for non-existent position', () => {
      expect(() => addCollateral('party::alice', 'fake-pos', {
        symbol: 'ETH', amount: '1',
      })).toThrow('not found');
    });
  });
});
