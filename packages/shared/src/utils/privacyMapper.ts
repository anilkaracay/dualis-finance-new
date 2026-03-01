/**
 * Bidirectional mapping between TypeScript privacy types and DAML privacy types.
 *
 * DAML uses different enum constructor names (e.g. PLPublic vs Public)
 * and different field names (e.g. ruleId vs id). These helpers bridge
 * the two representations.
 */

import type { PrivacyLevel, DataScope, DisclosureRule, PrivacyConfig } from '../types/privacy';

// ---------------------------------------------------------------------------
// PrivacyLevel mapping
// ---------------------------------------------------------------------------

const TS_TO_DAML_LEVEL: Record<PrivacyLevel, string> = {
  Public: 'PLPublic',
  Selective: 'PLSelective',
  Maximum: 'PLMaximum',
};

const DAML_TO_TS_LEVEL: Record<string, PrivacyLevel> = {
  PLPublic: 'Public',
  PLSelective: 'Selective',
  PLMaximum: 'Maximum',
};

export function toDamlPrivacyLevel(level: PrivacyLevel): string {
  return TS_TO_DAML_LEVEL[level] ?? 'PLPublic';
}

export function fromDamlPrivacyLevel(damlLevel: string): PrivacyLevel {
  return DAML_TO_TS_LEVEL[damlLevel] ?? 'Public';
}

// ---------------------------------------------------------------------------
// DataScope mapping
// ---------------------------------------------------------------------------

const TS_TO_DAML_SCOPE: Record<DataScope, string> = {
  Positions: 'Positions',
  Transactions: 'Transactions',
  CreditScore: 'CreditScore',
  SecLendingDeals: 'SecLendingDeals',
  All: 'AllData',
};

const DAML_TO_TS_SCOPE: Record<string, DataScope> = {
  Positions: 'Positions',
  Transactions: 'Transactions',
  CreditScore: 'CreditScore',
  SecLendingDeals: 'SecLendingDeals',
  AllData: 'All',
};

export function toDamlDataScope(scope: DataScope): string {
  return TS_TO_DAML_SCOPE[scope] ?? scope;
}

export function fromDamlDataScope(damlScope: string): DataScope {
  return DAML_TO_TS_SCOPE[damlScope] ?? (damlScope as DataScope);
}

// ---------------------------------------------------------------------------
// DisclosureRule mapping
// ---------------------------------------------------------------------------

/** Convert a TS DisclosureRule to a DAML DisclosureRule record */
export function toDamlDisclosureRule(rule: DisclosureRule): Record<string, unknown> {
  return {
    ruleId: rule.id,
    discloseTo: rule.discloseTo,
    displayName: rule.displayName,
    dataScope: toDamlDataScope(rule.dataScope),
    purpose: rule.purpose,
    expiresAt: rule.expiresAt ?? null, // DAML Optional Text
    isActive: rule.isActive,
    createdAt: rule.createdAt,
  };
}

/** Convert a DAML DisclosureRule record to a TS DisclosureRule */
export function fromDamlDisclosureRule(daml: Record<string, unknown>): DisclosureRule {
  return {
    id: (daml.ruleId as string) ?? '',
    discloseTo: (daml.discloseTo as string) ?? '',
    displayName: (daml.displayName as string) ?? '',
    dataScope: fromDamlDataScope((daml.dataScope as string) ?? ''),
    purpose: (daml.purpose as string) ?? '',
    expiresAt: (daml.expiresAt as string) ?? null,
    isActive: (daml.isActive as boolean) ?? true,
    createdAt: (daml.createdAt as string) ?? new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// PrivacyConfig mapping
// ---------------------------------------------------------------------------

/** Convert a DAML PrivacyConfig contract payload to a TS PrivacyConfig */
export function fromDamlPrivacyConfig(
  payload: Record<string, unknown>,
  contractId?: string,
): PrivacyConfig {
  const user = (payload.user as string) ?? '';
  const rules = (payload.disclosureRules as Record<string, unknown>[]) ?? [];

  const config: PrivacyConfig = {
    partyId: user,
    privacyLevel: fromDamlPrivacyLevel((payload.privacyLevel as string) ?? ''),
    disclosureRules: rules.map(fromDamlDisclosureRule),
    auditTrailEnabled: (payload.auditTrailEnabled as boolean) ?? true,
    updatedAt: (payload.updatedAt as string) ?? '',
  };
  if (contractId) {
    config.contractId = contractId;
  }
  return config;
}
