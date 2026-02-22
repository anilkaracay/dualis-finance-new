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
  setPrivacyLevel,
  getPrivacyConfig,
  addDisclosureRule,
  removeDisclosureRule,
  checkAccess,
  getAuditLog,
} from '../privacy.service';

describe('setPrivacyLevel', () => {
  it('updates config level', () => {
    const partyId = 'party::test-privacy-level::1';

    const result = setPrivacyLevel(partyId, 'Maximum');

    expect(result.data.partyId).toBe(partyId);
    expect(result.data.privacyLevel).toBe('Maximum');
    expect(result.data).toHaveProperty('updatedAt');
    expect(result.transaction).toHaveProperty('id');
    expect(result.transaction.status).toBe('confirmed');

    // Verify the config was persisted
    const config = getPrivacyConfig(partyId);
    expect(config.privacyLevel).toBe('Maximum');
  });
});

describe('getPrivacyConfig', () => {
  it('returns default config for new user', () => {
    const config = getPrivacyConfig('party::brand-new-user::999');

    expect(config.partyId).toBe('party::brand-new-user::999');
    expect(config.privacyLevel).toBe('Public');
    expect(config.disclosureRules).toEqual([]);
    expect(config.auditTrailEnabled).toBe(true);
    expect(config).toHaveProperty('updatedAt');
  });
});

describe('addDisclosure', () => {
  it('creates disclosure rule', () => {
    const partyId = 'party::test-disclosure-add::1';

    const result = addDisclosureRule(partyId, {
      discloseTo: 'party::regulator::test',
      displayName: 'Test Regulator',
      dataScope: 'Positions',
      purpose: 'Regulatory compliance',
      expiresAt: null,
    });

    expect(result.data).toHaveProperty('id');
    expect(result.data.id).toMatch(/^rule-/);
    expect(result.data.discloseTo).toBe('party::regulator::test');
    expect(result.data.displayName).toBe('Test Regulator');
    expect(result.data.dataScope).toBe('Positions');
    expect(result.data.purpose).toBe('Regulatory compliance');
    expect(result.data.isActive).toBe(true);
    expect(result.data).toHaveProperty('createdAt');
    expect(result.transaction).toHaveProperty('id');
    expect(result.transaction.status).toBe('confirmed');

    // Verify the rule was added to the config
    const config = getPrivacyConfig(partyId);
    const found = config.disclosureRules.find((r) => r.id === result.data.id);
    expect(found).toBeDefined();
  });
});

describe('removeDisclosure', () => {
  it('removes disclosure rule', () => {
    const partyId = 'party::test-disclosure-remove::1';

    // Add a rule first
    const added = addDisclosureRule(partyId, {
      discloseTo: 'party::auditor::test',
      displayName: 'Test Auditor',
      dataScope: 'All',
      purpose: 'Annual audit',
      expiresAt: null,
    });
    const ruleId = added.data.id;

    // Verify the rule exists
    let config = getPrivacyConfig(partyId);
    expect(config.disclosureRules.some((r) => r.id === ruleId)).toBe(true);

    // Remove the rule
    const result = removeDisclosureRule(partyId, ruleId);
    expect(result.data.removed).toBe(true);
    expect(result.transaction).toHaveProperty('id');
    expect(result.transaction.status).toBe('confirmed');

    // Verify the rule was removed
    config = getPrivacyConfig(partyId);
    expect(config.disclosureRules.some((r) => r.id === ruleId)).toBe(false);
  });
});

describe('checkAccess', () => {
  it('user always has access to own data', () => {
    // A new user defaults to Public privacy level, so self-access is always granted
    const partyId = 'party::self-access-test::1';
    const result = checkAccess(partyId, partyId, 'All');

    expect(result.granted).toBe(true);
  });

  it('Public level grants all access', () => {
    // party::bob::2 has Public privacy level
    const result = checkAccess('party::bob::2', 'party::random-requester::1', 'Positions');

    expect(result.granted).toBe(true);
    expect(result.reason).toBe('Public privacy level');
  });

  it('Selective level checks disclosure rules', () => {
    // party::alice::1 has Selective level with a disclosure rule for party::regulator::sec (All scope)
    const grantedResult = checkAccess('party::alice::1', 'party::regulator::sec', 'Positions');
    expect(grantedResult.granted).toBe(true);
    expect(grantedResult.reason).toContain('SEC Reporting');

    // A requester not in alice's disclosure rules should be denied
    const deniedResult = checkAccess('party::alice::1', 'party::unknown::1', 'Positions');
    expect(deniedResult.granted).toBe(false);
    expect(deniedResult.reason).toContain('no disclosure rules match');
  });

  it('Maximum level requires explicit disclosure', () => {
    // party::carol::3 has Maximum privacy level with no disclosure rules
    const result = checkAccess('party::carol::3', 'party::auditor::deloitte', 'Positions');

    expect(result.granted).toBe(false);
    expect(result.reason).toContain('Maximum privacy');
    expect(result.reason).toContain('no disclosure rules match');
  });
});

describe('getAuditLog', () => {
  it('returns audit entries', () => {
    // The pre-populated audit log has entries for party::alice::1
    const entries = getAuditLog('party::alice::1');

    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);

    const entry = entries[0];
    expect(entry).toBeDefined();
    if (entry) {
      expect(entry).toHaveProperty('partyId', 'party::alice::1');
      expect(entry).toHaveProperty('requesterParty');
      expect(entry).toHaveProperty('dataScope');
      expect(entry).toHaveProperty('granted');
      expect(entry).toHaveProperty('reason');
      expect(entry).toHaveProperty('timestamp');
    }
  });
});
