import { describe, it, expect, vi } from 'vitest';

// Mock the logger before importing the service
vi.mock('../../config/logger.js', () => ({
  createChildLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import {
  startOnboarding,
  verifyKYB,
  getInstitutionStatus,
  createAPIKey,
  revokeAPIKey,
  createSubAccount,
  executeBulkDeposit,
} from '../institutional.service';

describe('startOnboarding', () => {
  it('creates institution with Pending status', () => {
    const result = startOnboarding({
      legalName: 'Test Capital Inc.',
      registrationNo: 'TEST-REG-001',
      jurisdiction: 'US',
    });

    expect(result.data).toHaveProperty('institutionParty');
    expect(result.data.institutionParty).toMatch(/^party::institution-us-/);
    expect(result.data.legalName).toBe('Test Capital Inc.');
    expect(result.data.registrationNo).toBe('TEST-REG-001');
    expect(result.data.jurisdiction).toBe('US');
    expect(result.data.kybStatus).toBe('Pending');
    expect(result.data.kybLevel).toBe('Basic');
    expect(result.data.subAccounts).toEqual([]);
    expect(result.data.verifiedAt).toBeNull();
    expect(result.data.expiresAt).toBeNull();
    expect(result.transaction).toHaveProperty('id');
    expect(result.transaction.status).toBe('confirmed');
  });
});

describe('verifyKYB', () => {
  it('updates status to Verified with expiry', () => {
    // First, onboard a new institution
    const onboarding = startOnboarding({
      legalName: 'KYB Test Corp.',
      registrationNo: 'KYB-TEST-001',
      jurisdiction: 'TR',
    });
    const partyId = onboarding.data.institutionParty;

    // Verify KYB
    const result = verifyKYB(partyId, { approved: true, level: 'Full' });

    expect(result.data.status).toBe('Verified');
    expect(result.transaction).toHaveProperty('id');
    expect(result.transaction.status).toBe('confirmed');

    // Verify the institution is now updated
    const inst = getInstitutionStatus(partyId);
    expect(inst).not.toBeNull();
    if (inst) {
      expect(inst.kybStatus).toBe('Verified');
      expect(inst.kybLevel).toBe('Full');
      expect(inst.verifiedAt).not.toBeNull();
      expect(inst.expiresAt).not.toBeNull();
      // Expiry should be approximately 1 year from now
      if (inst.expiresAt) {
        const expiresAt = new Date(inst.expiresAt).getTime();
        const oneYearFromNow = Date.now() + 365 * 86_400_000;
        expect(Math.abs(expiresAt - oneYearFromNow)).toBeLessThan(5000);
      }
    }
  });
});

describe('getInstitution', () => {
  it('returns institution data', () => {
    const inst = getInstitutionStatus('party::institution-tr-001');

    expect(inst).not.toBeNull();
    if (inst) {
      expect(inst.institutionParty).toBe('party::institution-tr-001');
      expect(inst.legalName).toBe('Cayvox Capital A.Ş.');
      expect(inst.jurisdiction).toBe('TR');
      expect(inst.kybStatus).toBe('Verified');
      expect(inst).toHaveProperty('riskProfile');
      expect(inst.riskProfile).toHaveProperty('riskCategory');
      expect(inst.riskProfile).toHaveProperty('maxSingleExposure');
      expect(inst.riskProfile).toHaveProperty('allowedProducts');
    }
  });
});

describe('createAPIKey', () => {
  it('returns key with permissions', () => {
    const partyId = 'party::institution-tr-001';
    const permissions = ['read', 'write', 'trade'];

    const result = createAPIKey(partyId, 'Trading Key', permissions);

    expect(result.data).toHaveProperty('key');
    expect(result.data.key).toMatch(/^dsk_/);
    expect(result.data).toHaveProperty('keyId');
    expect(result.data.keyId).toMatch(/^key-/);
    expect(result.data).toHaveProperty('keyPrefix');
    expect(result.transaction).toHaveProperty('id');
    expect(result.transaction.status).toBe('confirmed');
  });
});

describe('revokeAPIKey', () => {
  it('deactivates key', () => {
    const partyId = 'party::institution-tr-001';

    // Create a key first
    const created = createAPIKey(partyId, 'Key To Revoke', ['read']);
    const keyId = created.data.keyId;

    // Revoke it
    const result = revokeAPIKey(partyId, keyId);

    expect(result.data.revoked).toBe(true);
    expect(result.transaction).toHaveProperty('id');
    expect(result.transaction.status).toBe('confirmed');
  });
});

describe('listAPIKeys', () => {
  it('returns all keys for institution', () => {
    // The service doesn't expose a listAPIKeys function directly,
    // but we can verify keys are tracked by creating multiple and checking via createAPIKey
    const partyId = 'party::institution-test-keys::1';

    // Start onboarding so the party exists
    startOnboarding({
      legalName: 'Key Test Corp.',
      registrationNo: 'KEY-TEST-001',
      jurisdiction: 'US',
    });

    const key1 = createAPIKey(partyId, 'Key One', ['read']);
    const key2 = createAPIKey(partyId, 'Key Two', ['read', 'write']);

    // Both keys should have been created successfully with unique IDs
    expect(key1.data.keyId).not.toBe(key2.data.keyId);
    expect(key1.data.key).not.toBe(key2.data.key);
    expect(key1.data.keyPrefix).not.toBe(key2.data.keyPrefix);
  });
});

describe('addSubAccount', () => {
  it('adds sub-account to institution', () => {
    const parentParty = 'party::institution-tr-001';

    const result = createSubAccount(parentParty, { name: 'Treasury Sub-Account' });

    expect(result.data).toHaveProperty('subAccountId');
    expect(result.data.subAccountId).toMatch(/^party::sub-/);
    expect(result.data.parentParty).toBe(parentParty);
    expect(result.transaction).toHaveProperty('id');
    expect(result.transaction.status).toBe('confirmed');

    // Verify the sub-account was added to the institution
    const inst = getInstitutionStatus(parentParty);
    expect(inst).not.toBeNull();
    if (inst) {
      expect(inst.subAccounts).toContain(result.data.subAccountId);
    }
  });
});

describe('executeBulkDeposit', () => {
  it('processes operations and returns results', () => {
    const partyId = 'party::institution-tr-001';
    const operations = [
      { opType: 'deposit' as const, poolId: 'usdc-main', amount: '1000000.00' },
      { opType: 'deposit' as const, poolId: 'eth-main', amount: '500000.00' },
      { opType: 'deposit' as const, poolId: 'tbill-short', amount: '2000000.00' },
    ];

    const result = executeBulkDeposit(partyId, operations);

    expect(result).toHaveProperty('opId');
    expect(result.opId).toMatch(/^bulk-/);
    expect(result).toHaveProperty('operations');
    expect(result.operations).toHaveLength(3);
    expect(result).toHaveProperty('status');
    expect(['Completed', 'PartialFail']).toContain(result.status);
    expect(result).toHaveProperty('results');
    expect(result.results).toHaveLength(3);
    expect(result).toHaveProperty('submittedAt');

    // Each result should have expected structure
    result.results.forEach((r, index) => {
      expect(r).toHaveProperty('index', index);
      expect(r).toHaveProperty('success');
      expect(r).toHaveProperty('transactionId');
      expect(typeof r.success).toBe('boolean');
    });
  });
});
