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

import { CantonClient } from '../client';

describe('CantonClient (mock mode)', () => {
  let client: CantonClient;

  beforeEach(() => {
    // Reset singleton for clean state
    (CantonClient as any).instance = null;
    client = CantonClient.getInstance();
  });

  describe('getInstance', () => {
    it('returns a singleton instance', () => {
      const a = CantonClient.getInstance();
      const b = CantonClient.getInstance();
      expect(a).toBe(b);
    });
  });

  describe('queryContracts', () => {
    it('returns mock LendingPool contracts', async () => {
      const pools = await client.queryContracts('Dualis.LendingPool:LendingPool');
      expect(pools.length).toBeGreaterThan(0);
      expect(pools[0].templateId).toBe('Dualis.LendingPool:LendingPool');
      expect(pools[0].payload).toHaveProperty('poolId');
    });

    it('returns mock PriceFeed contracts', async () => {
      const feeds = await client.queryContracts('Dualis.Oracle:PriceFeed');
      expect(feeds.length).toBeGreaterThan(0);
      expect(feeds[0].payload).toHaveProperty('asset');
      expect(feeds[0].payload).toHaveProperty('price');
    });

    it('returns mock CreditAttestationBundle', async () => {
      const bundles = await client.queryContracts('Dualis.Credit.Attestation:CreditAttestationBundle');
      expect(bundles.length).toBe(1);
      expect(bundles[0].payload).toHaveProperty('attestations');
    });

    it('returns mock CompositeCredit', async () => {
      const scores = await client.queryContracts('Dualis.Credit.CompositeScore:CompositeCredit');
      expect(scores.length).toBe(1);
      expect(scores[0].payload).toHaveProperty('compositeScore');
    });

    it('returns mock ProductiveProject contracts', async () => {
      const projects = await client.queryContracts('Dualis.Productive.Core:ProductiveProject');
      expect(projects.length).toBe(2);
    });

    it('returns mock FractionalOffer', async () => {
      const offers = await client.queryContracts('Dualis.SecLending.Advanced:FractionalOffer');
      expect(offers.length).toBe(1);
      expect(offers[0].payload).toHaveProperty('remainingAmount');
    });

    it('returns mock VerifiedInstitution', async () => {
      const insts = await client.queryContracts('Dualis.Institutional.Core:VerifiedInstitution');
      expect(insts.length).toBe(1);
      expect(insts[0].payload).toHaveProperty('kybStatus');
    });

    it('returns mock PrivacyConfig', async () => {
      const configs = await client.queryContracts('Dualis.Privacy.Config:PrivacyConfig');
      expect(configs.length).toBe(1);
      expect(configs[0].payload).toHaveProperty('privacyLevel');
    });

    it('returns empty array for unknown template', async () => {
      const result = await client.queryContracts('Unknown:Template');
      expect(result).toEqual([]);
    });
  });

  describe('queryContractByKey', () => {
    it('returns first mock contract for known template', async () => {
      const pool = await client.queryContractByKey('Dualis.LendingPool:LendingPool', { poolId: 'pool-usdc' });
      expect(pool).not.toBeNull();
      expect(pool!.payload).toHaveProperty('poolId');
    });

    it('returns null for unknown template', async () => {
      const result = await client.queryContractByKey('Unknown:Template', { key: 'value' });
      expect(result).toBeNull();
    });
  });

  describe('exerciseChoice', () => {
    it('returns mock success result', async () => {
      const result = await client.exerciseChoice(
        'Dualis.LendingPool:LendingPool',
        'contract-1',
        'Deposit',
        { depositor: 'party::alice', amount: '1000' },
      );
      expect(result).toHaveProperty('exerciseResult');
      expect(result.exerciseResult).toEqual({ status: 'success' });
      expect(result.events).toEqual([]);
    });
  });

  describe('createContract', () => {
    it('returns mock contract ID', async () => {
      const result = await client.createContract('Dualis.LendingPool:LendingPool', {
        poolId: 'test-pool',
      });
      expect(result).toHaveProperty('contractId');
      expect(result.contractId).toMatch(/^#canton-mock-/);
      expect(result.templateId).toBe('Dualis.LendingPool:LendingPool');
    });
  });

  describe('Convenience methods — Credit Attestation', () => {
    it('createAttestationBundle returns contract ID', async () => {
      const result = await client.createAttestationBundle('party::alice');
      expect(result.contractId).toMatch(/^#canton-mock-/);
    });

    it('addAttestation returns success', async () => {
      const result = await client.addAttestation('bundle-1', { provider: 'Chainlink', score: 90 });
      expect(result.exerciseResult).toEqual({ status: 'success' });
    });

    it('pruneExpiredAttestations returns success', async () => {
      const result = await client.pruneExpiredAttestations('bundle-1');
      expect(result.exerciseResult).toEqual({ status: 'success' });
    });
  });

  describe('Convenience methods — Composite Score', () => {
    it('createCompositeCredit returns contract ID', async () => {
      const result = await client.createCompositeCredit('party::alice');
      expect(result.contractId).toMatch(/^#canton-mock-/);
    });

    it('recalculateComposite returns success', async () => {
      const result = await client.recalculateComposite('credit-1', {
        onChain: { repayment: 95 },
        offChain: { bureau: 720 },
        ecosystem: { staking: 60 },
      });
      expect(result.exerciseResult).toEqual({ status: 'success' });
    });
  });

  describe('Convenience methods — Productive', () => {
    it('createProductiveProject returns contract ID', async () => {
      const result = await client.createProductiveProject({ projectId: 'proj-test', name: 'Test' });
      expect(result.contractId).toMatch(/^#canton-mock-/);
    });

    it('updateProjectStatus returns success', async () => {
      const result = await client.updateProjectStatus('project-1', 'Active');
      expect(result.exerciseResult).toEqual({ status: 'success' });
    });

    it('checkProjectHealth returns success', async () => {
      const result = await client.checkProjectHealth('borrow-1', 80, 100);
      expect(result.exerciseResult).toEqual({ status: 'success' });
    });
  });

  describe('Convenience methods — Advanced SecLending', () => {
    it('createFractionalOffer returns contract ID', async () => {
      const result = await client.createFractionalOffer({ security: 'SPY', totalAmount: '10000' });
      expect(result.contractId).toMatch(/^#canton-mock-/);
    });

    it('acceptFraction returns success', async () => {
      const result = await client.acceptFraction('frac-1', 'party::borrower', 500);
      expect(result.exerciseResult).toEqual({ status: 'success' });
    });

    it('proposeNetting returns contract ID', async () => {
      const result = await client.proposeNetting('party::a', 'party::b', ['deal-1', 'deal-2']);
      expect(result.contractId).toMatch(/^#canton-mock-/);
    });

    it('executeNetting returns success', async () => {
      const result = await client.executeNetting('netting-1');
      expect(result.exerciseResult).toEqual({ status: 'success' });
    });
  });

  describe('Convenience methods — Institutional', () => {
    it('createVerifiedInstitution returns contract ID', async () => {
      const result = await client.createVerifiedInstitution({ institution: 'party::inst', name: 'Acme' });
      expect(result.contractId).toMatch(/^#canton-mock-/);
    });

    it('addSubAccount returns success', async () => {
      const result = await client.addSubAccount('inst-1', 'party::sub-03');
      expect(result.exerciseResult).toEqual({ status: 'success' });
    });

    it('renewKYB returns success', async () => {
      const result = await client.renewKYB('inst-1', '2027-01-01T00:00:00Z');
      expect(result.exerciseResult).toEqual({ status: 'success' });
    });
  });

  describe('Convenience methods — Privacy', () => {
    it('createPrivacyConfig returns contract ID', async () => {
      const result = await client.createPrivacyConfig('party::user');
      expect(result.contractId).toMatch(/^#canton-mock-/);
    });

    it('setPrivacyLevel returns success', async () => {
      const result = await client.setPrivacyLevel('config-1', 'Selective');
      expect(result.exerciseResult).toEqual({ status: 'success' });
    });

    it('addDisclosure returns success', async () => {
      const result = await client.addDisclosure('config-1', { counterparty: 'party::auditor', scope: 'CreditScore' });
      expect(result.exerciseResult).toEqual({ status: 'success' });
    });

    it('removeDisclosure returns success', async () => {
      const result = await client.removeDisclosure('config-1', 'party::auditor');
      expect(result.exerciseResult).toEqual({ status: 'success' });
    });

    it('checkAccess returns true in mock mode', async () => {
      const result = await client.checkAccess('config-1', 'party::auditor', 'CreditScore');
      expect(result).toBe(true);
    });
  });
});
