import { createChildLogger } from '../config/logger.js';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { cantonConfig } from '../config/canton-env.js';
import { CantonClient } from '../canton/client.js';
import * as cantonQueries from '../canton/queries.js';
import {
  fromDamlPrivacyConfig,
  toDamlDataScope,
  toDamlDisclosureRule,
  fromDamlDataScope,
} from '@dualis/shared';
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
// Mock data (used when env.CANTON_MOCK is true)
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
// Canton helpers
// ---------------------------------------------------------------------------

/** Extract new PrivacyConfig contractId from exercise result events. */
function extractPrivacyConfigId(
  events: unknown[] | undefined,
  fallbackId: string,
): string {
  for (const event of events ?? []) {
    const created = (event as Record<string, unknown>).CreatedEvent as Record<string, unknown> | undefined;
    if (!created) continue;
    const tid = (created.templateId as string) ?? '';
    if (tid.includes('PrivacyConfig')) {
      return (created.contractId as string) ?? fallbackId;
    }
  }
  return fallbackId;
}

/** Log an audit entry to Canton (fire-and-forget). Falls back to in-memory. */
async function logAuditToCanton(
  partyId: string,
  requesterParty: string,
  dataScope: DataScope,
  granted: boolean,
  reason: string,
): Promise<void> {
  if (!env.CANTON_MOCK) {
    try {
      const client = CantonClient.getInstance();
      const operatorParty = cantonConfig().parties.operator;
      await client.createContract('Dualis.Privacy.AuditLog:PrivacyAuditEntry', {
        operator: operatorParty,
        ownerParty: partyId,
        requesterParty,
        dataScope: toDamlDataScope(dataScope),
        granted,
        reason,
        timestamp: new Date().toISOString(),
      });
      return;
    } catch (err) {
      log.warn({ err }, 'Failed to log audit entry to Canton — falling back to in-memory');
    }
  }

  // Mock / fallback
  MOCK_AUDIT_LOG.push({
    partyId,
    requesterParty,
    dataScope,
    granted,
    reason,
    timestamp: new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

export async function getPrivacyConfig(partyId: string): Promise<PrivacyConfig> {
  log.debug({ partyId }, 'Getting privacy config');

  if (!env.CANTON_MOCK) {
    // Query Canton for existing PrivacyConfig contract
    const contract = await cantonQueries.getPrivacyConfig(partyId);

    if (contract) {
      return fromDamlPrivacyConfig(
        contract.payload as unknown as Record<string, unknown>,
        contract.contractId,
      );
    }

    // No config exists yet — create one on Canton
    log.info({ partyId }, 'No privacy config found — creating default on Canton');
    const client = CantonClient.getInstance();
    const result = await client.createPrivacyConfig(partyId);

    return {
      partyId,
      privacyLevel: 'Public',
      disclosureRules: [],
      auditTrailEnabled: true,
      updatedAt: new Date().toISOString(),
      contractId: result.contractId,
    };
  }

  // Mock mode
  return MOCK_CONFIGS.get(partyId) ?? {
    partyId,
    privacyLevel: 'Public' as PrivacyLevel,
    disclosureRules: [],
    auditTrailEnabled: true,
    updatedAt: new Date().toISOString(),
  };
}

export async function setPrivacyLevel(
  partyId: string,
  level: PrivacyLevel,
): Promise<{ data: PrivacyConfig; transaction: TransactionMeta }> {
  log.info({ partyId, level }, 'Setting privacy level');

  if (!env.CANTON_MOCK) {
    const config = await getPrivacyConfig(partyId);
    if (!config.contractId) {
      throw new Error('Privacy config contract not found on Canton');
    }

    const client = CantonClient.getInstance();
    const result = await client.setPrivacyLevel(config.contractId, level);

    // Exercise archives old contract, creates new one — extract new ID
    const newContractId = extractPrivacyConfigId(result.events, config.contractId);

    // Re-query for fresh state
    let fresh: PrivacyConfig;
    try {
      const freshContract = await cantonQueries.getPrivacyConfig(partyId);
      fresh = freshContract
        ? fromDamlPrivacyConfig(freshContract.payload as unknown as Record<string, unknown>, freshContract.contractId)
        : { ...config, privacyLevel: level, contractId: newContractId, updatedAt: new Date().toISOString() };
    } catch {
      fresh = { ...config, privacyLevel: level, contractId: newContractId, updatedAt: new Date().toISOString() };
    }

    return { data: fresh, transaction: buildTransactionMeta() };
  }

  // Mock mode
  const config = await getPrivacyConfig(partyId);
  config.privacyLevel = level;
  config.updatedAt = new Date().toISOString();
  MOCK_CONFIGS.set(partyId, config);

  return { data: config, transaction: buildTransactionMeta() };
}

export async function addDisclosureRule(
  partyId: string,
  rule: {
    discloseTo: string;
    displayName: string;
    dataScope: DataScope;
    purpose: string;
    expiresAt: string | null;
  },
): Promise<{ data: DisclosureRule; transaction: TransactionMeta }> {
  log.info({ partyId, discloseTo: rule.discloseTo }, 'Adding disclosure rule');

  const newRuleId = `rule-${randomUUID().slice(0, 8)}`;
  const newRule: DisclosureRule = {
    id: newRuleId,
    discloseTo: rule.discloseTo,
    displayName: rule.displayName,
    dataScope: rule.dataScope,
    purpose: rule.purpose,
    expiresAt: rule.expiresAt,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  if (!env.CANTON_MOCK) {
    const config = await getPrivacyConfig(partyId);
    if (!config.contractId) {
      throw new Error('Privacy config contract not found on Canton');
    }

    const client = CantonClient.getInstance();
    const damlRule = toDamlDisclosureRule(newRule);
    const result = await client.addDisclosure(config.contractId, damlRule);

    // Extract new contractId
    extractPrivacyConfigId(result.events, config.contractId);

    return { data: newRule, transaction: buildTransactionMeta() };
  }

  // Mock mode
  const config = await getPrivacyConfig(partyId);
  config.disclosureRules.push(newRule);
  config.updatedAt = new Date().toISOString();
  MOCK_CONFIGS.set(partyId, config);

  return { data: newRule, transaction: buildTransactionMeta() };
}

export async function removeDisclosureRule(
  partyId: string,
  ruleId: string,
): Promise<{ data: { removed: boolean }; transaction: TransactionMeta }> {
  log.info({ partyId, ruleId }, 'Removing disclosure rule');

  if (!env.CANTON_MOCK) {
    const config = await getPrivacyConfig(partyId);
    if (!config.contractId) {
      throw new Error('Privacy config contract not found on Canton');
    }

    const client = CantonClient.getInstance();
    await client.removeDisclosure(config.contractId, ruleId);

    return { data: { removed: true }, transaction: buildTransactionMeta() };
  }

  // Mock mode
  const config = MOCK_CONFIGS.get(partyId);
  if (config) {
    config.disclosureRules = config.disclosureRules.filter((r) => r.id !== ruleId);
    config.updatedAt = new Date().toISOString();
  }

  return { data: { removed: true }, transaction: buildTransactionMeta() };
}

export async function checkAccess(
  ownerParty: string,
  requesterParty: string,
  scope: DataScope,
): Promise<{ granted: boolean; reason: string }> {
  log.debug({ ownerParty, requesterParty, scope }, 'Checking access');

  const config = await getPrivacyConfig(ownerParty);

  // Public level — always grant
  if (config.privacyLevel === 'Public') {
    void logAuditToCanton(ownerParty, requesterParty, scope, true, 'Public privacy level');
    return { granted: true, reason: 'Public privacy level' };
  }

  // Check disclosure rules (DAML does not check expiry — TS handles it)
  const now = new Date();
  const matchingRule = config.disclosureRules.find(
    (r) =>
      r.isActive &&
      r.discloseTo === requesterParty &&
      (r.dataScope === 'All' || r.dataScope === scope) &&
      (r.expiresAt === null || new Date(r.expiresAt) > now),
  );

  if (matchingRule) {
    void logAuditToCanton(ownerParty, requesterParty, scope, true, `Disclosure rule: ${matchingRule.displayName}`);
    return { granted: true, reason: `Active disclosure rule: ${matchingRule.displayName}` };
  }

  // Maximum or Selective with no matching rule — deny
  const reason = `${config.privacyLevel} privacy — no disclosure rules match`;
  void logAuditToCanton(ownerParty, requesterParty, scope, false, reason);
  return { granted: false, reason };
}

export async function getAuditLog(
  partyId: string,
  filters?: { scope?: DataScope; granted?: boolean },
): Promise<PrivacyAuditEntry[]> {
  log.debug({ partyId, filters }, 'Getting audit log');

  if (!env.CANTON_MOCK) {
    try {
      const contracts = await cantonQueries.getPrivacyAuditEntries(partyId);
      let entries: PrivacyAuditEntry[] = contracts.map((c) => {
        const p = c.payload as unknown as Record<string, unknown>;
        return {
          partyId: (p.ownerParty as string) ?? partyId,
          requesterParty: (p.requesterParty as string) ?? '',
          dataScope: fromDamlDataScope((p.dataScope as string) ?? '') as DataScope,
          granted: (p.granted as boolean) ?? false,
          reason: (p.reason as string) ?? null,
          timestamp: (p.timestamp as string) ?? '',
        };
      });

      if (filters?.scope) {
        entries = entries.filter((e) => e.dataScope === filters.scope);
      }
      if (filters?.granted !== undefined) {
        entries = entries.filter((e) => e.granted === filters.granted);
      }

      // Sort newest first
      entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return entries;
    } catch (err) {
      log.warn({ err }, 'Failed to query audit log from Canton — falling back to mock');
    }
  }

  // Mock mode / fallback
  let entries = MOCK_AUDIT_LOG.filter((e) => e.partyId === partyId);

  if (filters?.scope) {
    entries = entries.filter((e) => e.dataScope === filters.scope);
  }
  if (filters?.granted !== undefined) {
    entries = entries.filter((e) => e.granted === filters.granted);
  }

  return entries;
}
