export type PrivacyLevel = 'Public' | 'Selective' | 'Maximum';

export type DataScope =
  | 'Positions'
  | 'Transactions'
  | 'CreditScore'
  | 'SecLendingDeals'
  | 'All';

export interface DisclosureRule {
  id: string;
  discloseTo: string; // Party ID
  displayName: string; // "SEC Reporting", "KPMG Audit"
  dataScope: DataScope;
  purpose: string;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface PrivacyConfig {
  partyId: string;
  privacyLevel: PrivacyLevel;
  disclosureRules: DisclosureRule[];
  auditTrailEnabled: boolean;
  updatedAt: string;
}

export interface PrivacyAuditEntry {
  partyId: string;
  requesterParty: string;
  dataScope: DataScope;
  granted: boolean;
  reason: string | null;
  timestamp: string;
}
