import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/logger.js', () => ({
  createChildLogger: () => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  }),
}));

vi.mock('../../config/env.js', () => ({
  env: {
    CANTON_MOCK: true,
    CANTON_JSON_API_URL: 'http://localhost:7575',
    CANTON_ENV: 'sandbox',
  },
}));

// Reset singleton before importing queries
import { CantonClient } from '../client';

import {
  getAllPools,
  getPoolByKey,
  getUserPositions,
  getActiveBorrows,
  getCreditProfile,
  getSecLendingOffers,
  getActiveDeals,
  getPriceFeed,
  getProtocolConfig,
  getAttestationBundle,
  getCompositeScore,
  getProductiveProjects,
  getProductiveProjectByKey,
  getProductiveBorrows,
  getProductivePools,
  getVerifiedInstitution,
  getPrivacyConfig,
} from '../queries';

beforeEach(() => {
  // Reset singleton so mock mode is clean
  (CantonClient as any).instance = null;
});

describe('Canton Queries', () => {
  describe('Lending Pool Queries', () => {
    it('getAllPools returns pool contracts', async () => {
      const pools = await getAllPools();
      expect(pools.length).toBeGreaterThan(0);
      expect(pools[0].templateId).toBe('Dualis.LendingPool:LendingPool');
    });

    it('getPoolByKey returns a single pool', async () => {
      const pool = await getPoolByKey('pool-usdc');
      expect(pool).not.toBeNull();
      expect(pool!.payload).toHaveProperty('poolId');
    });
  });

  describe('Borrow / Position Queries', () => {
    it('getUserPositions queries with borrower filter', async () => {
      const spy = vi.spyOn(CantonClient.getInstance(), 'queryContracts');
      await getUserPositions('party::alice');
      expect(spy).toHaveBeenCalledWith(
        'Dualis.LendingPool:BorrowPosition',
        { borrower: 'party::alice' },
      );
      spy.mockRestore();
    });

    it('getActiveBorrows queries all borrows without pool filter', async () => {
      const spy = vi.spyOn(CantonClient.getInstance(), 'queryContracts');
      await getActiveBorrows();
      expect(spy).toHaveBeenCalledWith('Dualis.LendingPool:BorrowPosition', undefined);
      spy.mockRestore();
    });

    it('getActiveBorrows queries with pool filter', async () => {
      const spy = vi.spyOn(CantonClient.getInstance(), 'queryContracts');
      await getActiveBorrows('usdc-main');
      expect(spy).toHaveBeenCalledWith(
        'Dualis.LendingPool:BorrowPosition',
        { lendingPoolId: 'usdc-main' },
      );
      spy.mockRestore();
    });
  });

  describe('Credit Queries', () => {
    it('getCreditProfile queries by borrower key', async () => {
      const spy = vi.spyOn(CantonClient.getInstance(), 'queryContractByKey');
      await getCreditProfile('party::alice');
      expect(spy).toHaveBeenCalledWith(
        'Dualis.Credit:CreditProfile',
        { borrower: 'party::alice' },
      );
      spy.mockRestore();
    });
  });

  describe('Securities Lending Queries', () => {
    it('getSecLendingOffers returns offers without filter', async () => {
      const spy = vi.spyOn(CantonClient.getInstance(), 'queryContracts');
      await getSecLendingOffers();
      expect(spy).toHaveBeenCalledWith('Dualis.SecLending:SecLendingOffer', undefined);
      spy.mockRestore();
    });

    it('getSecLendingOffers filters by asset type', async () => {
      const spy = vi.spyOn(CantonClient.getInstance(), 'queryContracts');
      await getSecLendingOffers('equity');
      expect(spy).toHaveBeenCalledWith(
        'Dualis.SecLending:SecLendingOffer',
        { 'security.instrumentType': 'equity' },
      );
      spy.mockRestore();
    });

    it('getSecLendingOffers ignores "all" filter', async () => {
      const spy = vi.spyOn(CantonClient.getInstance(), 'queryContracts');
      await getSecLendingOffers('all');
      expect(spy).toHaveBeenCalledWith('Dualis.SecLending:SecLendingOffer', undefined);
      spy.mockRestore();
    });

    it('getActiveDeals queries with $or for lender/borrower', async () => {
      const spy = vi.spyOn(CantonClient.getInstance(), 'queryContracts');
      await getActiveDeals('party::alice');
      expect(spy).toHaveBeenCalledWith(
        'Dualis.SecLending:SecLendingDeal',
        { $or: [{ lender: 'party::alice' }, { borrower: 'party::alice' }] },
      );
      spy.mockRestore();
    });
  });

  describe('Oracle Queries', () => {
    it('getPriceFeed returns price feeds', async () => {
      const feeds = await getPriceFeed();
      expect(feeds.length).toBeGreaterThan(0);
      expect(feeds[0].payload).toHaveProperty('asset');
    });
  });

  describe('Protocol Config Queries', () => {
    it('getProtocolConfig returns first config or null', async () => {
      // Default returns empty for unknown template
      const config = await getProtocolConfig();
      // In mock mode ProtocolConfig isn't a generated mock template, so null
      expect(config).toBeNull();
    });
  });

  describe('Credit Attestation Queries', () => {
    it('getAttestationBundle queries by owner key', async () => {
      const bundle = await getAttestationBundle('party::alice');
      expect(bundle).not.toBeNull();
      expect(bundle!.payload).toHaveProperty('attestations');
    });

    it('getCompositeScore queries by owner key', async () => {
      const score = await getCompositeScore('party::alice');
      expect(score).not.toBeNull();
      expect(score!.payload).toHaveProperty('compositeScore');
    });
  });

  describe('Productive Queries', () => {
    it('getProductiveProjects returns projects', async () => {
      const projects = await getProductiveProjects();
      expect(projects.length).toBe(2);
    });

    it('getProductiveProjects passes filters', async () => {
      const spy = vi.spyOn(CantonClient.getInstance(), 'queryContracts');
      await getProductiveProjects({ status: 'Active' });
      expect(spy).toHaveBeenCalledWith(
        'Dualis.Productive.Core:ProductiveProject',
        { status: 'Active' },
      );
      spy.mockRestore();
    });

    it('getProductiveProjectByKey returns project', async () => {
      const project = await getProductiveProjectByKey('proj-solar-01');
      expect(project).not.toBeNull();
    });

    it('getProductiveBorrows returns borrows', async () => {
      const borrows = await getProductiveBorrows();
      expect(borrows.length).toBe(2);
    });

    it('getProductivePools returns pools', async () => {
      const pools = await getProductivePools();
      expect(pools.length).toBe(1);
    });
  });

  describe('Institutional Queries', () => {
    it('getVerifiedInstitution queries by institution key', async () => {
      const inst = await getVerifiedInstitution('party::inst');
      expect(inst).not.toBeNull();
      expect(inst!.payload).toHaveProperty('kybStatus');
    });
  });

  describe('Privacy Queries', () => {
    it('getPrivacyConfig queries by user key', async () => {
      const config = await getPrivacyConfig('party::user');
      expect(config).not.toBeNull();
      expect(config!.payload).toHaveProperty('privacyLevel');
    });
  });
});
