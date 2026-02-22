import { createChildLogger } from '../config/logger.js';
import { randomUUID } from 'node:crypto';
import type {
  PrivacyConfig,
  PrivacyLevel,
  DisclosureRule,
  DataScope,
  PrivacyAuditEntry,
  TransactionMeta,
} from '@dualis/shared';

const log = createChildLogger('privacy-service');

function buildTransactionMeta(): TransactionMeta {
  return {
    id: `tx-${randomUUID()}`,
    status: 'confirmed',
    timestamp: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_CONFIGS: Map<string, PrivacyConfig> = new Map([
  [
    'party::alice::1',
    {
      partyId: 'party::alice::1',
      privacyLevel: 'Selective',
      disclosureRules: [
        {
          id: 'rule-001',
          discloseTo: 'party::regulator::sec',
          displayName: 'SEC Reporting',
          dataScope: 'All',
          purpose: 'Regulatory compliance',
          expiresAt: null,
          isActive: true,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'rule-002',
          discloseTo: 'party::auditor::kpmg',
          displayName: 'KPMG Audit',
          dataScope: 'Positions',
          purpose: 'Annual audit',
          expiresAt: '2026-12-31T23:59:59.000Z',
          isActive: true,
          createdAt: '2026-01-15T10:00:00.000Z',
        },
      ],
      auditTrailEnabled: true,
      updatedAt: '2026-02-01T00:00:00.000Z',
    },
  ],
  [
    'party::bob::2',
    {
      partyId: 'party::bob::2',
      privacyLevel: 'Public',
      disclosureRules: [],
      auditTrailEnabled: true,
      updatedAt: '2026-01-15T00:00:00.000Z',
    },
  ],
  [
    'party::carol::3',
    {
      partyId: 'party::carol::3',
      privacyLevel: 'Maximum',
      disclosureRules: [],
      auditTrailEnabled: true,
      updatedAt: '2026-02-10T00:00:00.000Z',
    },
  ],
  // Cross-referenced mock users
  [
    'party::retail_user_001',
    {
      partyId: 'party::retail_user_001',
      privacyLevel: 'Selective',
      disclosureRules: [
        {
          id: 'rule-r1-001',
          discloseTo: 'party::regulator::spk',
          displayName: 'SPK Denetim',
          dataScope: 'All',
          purpose: 'Sermaye Piyasası Kurulu regulatory compliance',
          expiresAt: null,
          isActive: true,
          createdAt: '2026-01-20T10:00:00.000Z',
        },
      ],
      auditTrailEnabled: true,
      updatedAt: '2026-01-20T10:00:00.000Z',
    },
  ],
  [
    'party::inst_cayvox_001',
    {
      partyId: 'party::inst_cayvox_001',
      privacyLevel: 'Selective',
      disclosureRules: [
        {
          id: 'rule-cv-001',
          discloseTo: 'party::regulator::spk',
          displayName: 'SPK Denetim',
          dataScope: 'All',
          purpose: 'Turkish capital markets authority',
          expiresAt: null,
          isActive: true,
          createdAt: '2025-12-20T10:00:00.000Z',
        },
        {
          id: 'rule-cv-002',
          discloseTo: 'party::auditor::pwc',
          displayName: 'PwC Audit',
          dataScope: 'Positions',
          purpose: 'Annual financial audit',
          expiresAt: '2026-12-31T23:59:59.000Z',
          isActive: true,
          createdAt: '2025-12-20T10:30:00.000Z',
        },
      ],
      auditTrailEnabled: true,
      updatedAt: '2025-12-20T10:30:00.000Z',
    },
  ],
  [
    'party::inst_goldman_001',
    {
      partyId: 'party::inst_goldman_001',
      privacyLevel: 'Maximum',
      disclosureRules: [
        {
          id: 'rule-gs-001',
          discloseTo: 'party::regulator::sec',
          displayName: 'SEC Reporting',
          dataScope: 'All',
          purpose: 'SEC regulatory compliance',
          expiresAt: null,
          isActive: true,
          createdAt: '2025-11-15T09:00:00.000Z',
        },
      ],
      auditTrailEnabled: true,
      updatedAt: '2025-11-15T09:00:00.000Z',
    },
  ],
  [
    'party::sme_konya_001',
    {
      partyId: 'party::sme_konya_001',
      privacyLevel: 'Selective',
      disclosureRules: [
        {
          id: 'rule-sme-001',
          discloseTo: 'party::tifa::bridge',
          displayName: 'TIFA Bridge',
          dataScope: 'CreditScore',
          purpose: 'TIFA cross-reference for receivable financing',
          expiresAt: '2026-08-01T00:00:00.000Z',
          isActive: true,
          createdAt: '2026-02-01T10:00:00.000Z',
        },
      ],
      auditTrailEnabled: true,
      updatedAt: '2026-02-01T10:00:00.000Z',
    },
  ],
]);

const MOCK_AUDIT_LOG: PrivacyAuditEntry[] = [
  {
    partyId: 'party::alice::1',
    requesterParty: 'party::regulator::sec',
    dataScope: 'All',
    granted: true,
    reason: 'Active disclosure rule: SEC Reporting',
    timestamp: '2026-02-20T14:00:00.000Z',
  },
  {
    partyId: 'party::carol::3',
    requesterParty: 'party::auditor::deloitte',
    dataScope: 'Positions',
    granted: false,
    reason: 'Maximum privacy — no disclosure rules match',
    timestamp: '2026-02-19T10:30:00.000Z',
  },
];

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

export function getPrivacyConfig(partyId: string): PrivacyConfig {
  log.debug({ partyId }, 'Getting privacy config');

  return MOCK_CONFIGS.get(partyId) ?? {
    partyId,
    privacyLevel: 'Public' as PrivacyLevel,
    disclosureRules: [],
    auditTrailEnabled: true,
    updatedAt: new Date().toISOString(),
  };
}

export function setPrivacyLevel(
  partyId: string,
  level: PrivacyLevel,
): { data: PrivacyConfig; transaction: TransactionMeta } {
  log.info({ partyId, level }, 'Setting privacy level');

  const config = getPrivacyConfig(partyId);
  config.privacyLevel = level;
  config.updatedAt = new Date().toISOString();
  MOCK_CONFIGS.set(partyId, config);

  return { data: config, transaction: buildTransactionMeta() };
}

export function addDisclosureRule(
  partyId: string,
  rule: {
    discloseTo: string;
    displayName: string;
    dataScope: DataScope;
    purpose: string;
    expiresAt: string | null;
  },
): { data: DisclosureRule; transaction: TransactionMeta } {
  log.info({ partyId, discloseTo: rule.discloseTo }, 'Adding disclosure rule');

  const newRule: DisclosureRule = {
    id: `rule-${randomUUID().slice(0, 8)}`,
    discloseTo: rule.discloseTo,
    displayName: rule.displayName,
    dataScope: rule.dataScope,
    purpose: rule.purpose,
    expiresAt: rule.expiresAt,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const config = getPrivacyConfig(partyId);
  config.disclosureRules.push(newRule);
  config.updatedAt = new Date().toISOString();
  MOCK_CONFIGS.set(partyId, config);

  return { data: newRule, transaction: buildTransactionMeta() };
}

export function removeDisclosureRule(
  partyId: string,
  ruleId: string,
): { data: { removed: boolean }; transaction: TransactionMeta } {
  log.info({ partyId, ruleId }, 'Removing disclosure rule');

  const config = MOCK_CONFIGS.get(partyId);
  if (config) {
    config.disclosureRules = config.disclosureRules.filter((r) => r.id !== ruleId);
    config.updatedAt = new Date().toISOString();
  }

  return { data: { removed: true }, transaction: buildTransactionMeta() };
}

export function checkAccess(
  ownerParty: string,
  requesterParty: string,
  scope: DataScope,
): { granted: boolean; reason: string } {
  log.debug({ ownerParty, requesterParty, scope }, 'Checking access');

  const config = getPrivacyConfig(ownerParty);

  // Public level — always grant
  if (config.privacyLevel === 'Public') {
    logAudit(ownerParty, requesterParty, scope, true, 'Public privacy level');
    return { granted: true, reason: 'Public privacy level' };
  }

  // Check disclosure rules
  const now = new Date();
  const matchingRule = config.disclosureRules.find(
    (r) =>
      r.isActive &&
      r.discloseTo === requesterParty &&
      (r.dataScope === 'All' || r.dataScope === scope) &&
      (r.expiresAt === null || new Date(r.expiresAt) > now),
  );

  if (matchingRule) {
    logAudit(ownerParty, requesterParty, scope, true, `Disclosure rule: ${matchingRule.displayName}`);
    return { granted: true, reason: `Active disclosure rule: ${matchingRule.displayName}` };
  }

  // Maximum or Selective with no matching rule — deny
  const reason = `${config.privacyLevel} privacy — no disclosure rules match`;
  logAudit(ownerParty, requesterParty, scope, false, reason);
  return { granted: false, reason };
}

export function getAuditLog(
  partyId: string,
  filters?: { scope?: DataScope; granted?: boolean },
): PrivacyAuditEntry[] {
  log.debug({ partyId, filters }, 'Getting audit log');

  let entries = MOCK_AUDIT_LOG.filter((e) => e.partyId === partyId);

  if (filters?.scope) {
    entries = entries.filter((e) => e.dataScope === filters.scope);
  }
  if (filters?.granted !== undefined) {
    entries = entries.filter((e) => e.granted === filters.granted);
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function logAudit(
  partyId: string,
  requesterParty: string,
  dataScope: DataScope,
  granted: boolean,
  reason: string,
): void {
  MOCK_AUDIT_LOG.push({
    partyId,
    requesterParty,
    dataScope,
    granted,
    reason,
    timestamp: new Date().toISOString(),
  });
}
