import { createChildLogger } from '../config/logger.js';
import { randomUUID, createHash, randomBytes } from 'node:crypto';
import type {
  VerifiedInstitution,
  InstitutionalAPIKey,
  BulkOperation,
  SingleOp,
  BulkResult,
  FeeSchedule,
  KYBStatus,
  TransactionMeta,
} from '@dualis/shared';
import { notificationBus } from '../notification/notification.bus.js';

const log = createChildLogger('institutional-service');

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

const MOCK_INSTITUTIONS: Map<string, VerifiedInstitution> = new Map([
  [
    'party::inst_cayvox_001',
    {
      institutionParty: 'party::inst_cayvox_001',
      legalName: 'Cayvox Labs A.Ş.',
      registrationNo: 'TR-MKK-2024-001',
      jurisdiction: 'TR',
      kybStatus: 'Verified',
      kybLevel: 'Full',
      riskProfile: {
        riskCategory: 'low',
        maxSingleExposure: '50000000',
        maxTotalExposure: '200000000',
        allowedProducts: ['lending', 'secLending', 'staking', 'productive'],
        jurisdictionRules: ['TR', 'EU'],
      },
      subAccounts: ['party::sub-cv-001', 'party::sub-cv-002', 'party::sub-cv-003'],
      verifiedAt: '2025-12-20T10:00:00.000Z',
      expiresAt: '2026-12-20T10:00:00.000Z',
    },
  ],
  [
    'party::inst_goldman_001',
    {
      institutionParty: 'party::inst_goldman_001',
      legalName: 'Goldman Sachs Digital Assets',
      registrationNo: 'US-SEC-2024-GS-001',
      jurisdiction: 'US',
      kybStatus: 'Verified',
      kybLevel: 'Full',
      riskProfile: {
        riskCategory: 'low',
        maxSingleExposure: '100000000',
        maxTotalExposure: '500000000',
        allowedProducts: ['lending', 'secLending', 'staking', 'productive'],
        jurisdictionRules: ['US', 'EU', 'UK'],
      },
      subAccounts: ['party::sub-gs-001', 'party::sub-gs-002'],
      verifiedAt: '2025-11-15T09:00:00.000Z',
      expiresAt: '2026-11-15T09:00:00.000Z',
    },
  ],
  [
    'party::institution-tr-001',
    {
      institutionParty: 'party::institution-tr-001',
      legalName: 'Cayvox Capital A.Ş.',
      registrationNo: 'TR-MKK-2024-002',
      jurisdiction: 'TR',
      kybStatus: 'Verified',
      kybLevel: 'Full',
      riskProfile: {
        riskCategory: 'low',
        maxSingleExposure: '50000000',
        maxTotalExposure: '200000000',
        allowedProducts: ['lending', 'secLending', 'staking'],
        jurisdictionRules: ['TR', 'EU'],
      },
      subAccounts: ['party::sub-tr-001', 'party::sub-tr-002'],
      verifiedAt: '2025-12-20T10:00:00.000Z',
      expiresAt: '2026-12-20T10:00:00.000Z',
    },
  ],
  [
    'party::institution-us-001',
    {
      institutionParty: 'party::institution-us-001',
      legalName: 'Canton Trust LLC',
      registrationNo: 'US-SEC-2024-001',
      jurisdiction: 'US',
      kybStatus: 'Verified',
      kybLevel: 'Enhanced',
      riskProfile: {
        riskCategory: 'medium',
        maxSingleExposure: '25000000',
        maxTotalExposure: '100000000',
        allowedProducts: ['lending', 'secLending'],
        jurisdictionRules: ['US'],
      },
      subAccounts: [],
      verifiedAt: '2026-01-20T10:00:00.000Z',
      expiresAt: '2027-01-20T10:00:00.000Z',
    },
  ],
  [
    'party::institution-ch-001',
    {
      institutionParty: 'party::institution-ch-001',
      legalName: 'Helvetia Digital AG',
      registrationNo: 'CH-FINMA-2024-001',
      jurisdiction: 'CH',
      kybStatus: 'InReview',
      kybLevel: 'Basic',
      riskProfile: {
        riskCategory: 'low',
        maxSingleExposure: '100000000',
        maxTotalExposure: '500000000',
        allowedProducts: ['lending'],
        jurisdictionRules: ['CH', 'EU'],
      },
      subAccounts: [],
      verifiedAt: null,
      expiresAt: null,
    },
  ],
]);

const MOCK_API_KEYS: Map<string, InstitutionalAPIKey[]> = new Map();

const MOCK_FEE_SCHEDULES: Map<string, FeeSchedule> = new Map([
  [
    'party::institution-tr-001',
    {
      tiers: [
        { volumeThreshold: '0', feeRate: 0.001 },
        { volumeThreshold: '10000000', feeRate: 0.0008 },
        { volumeThreshold: '50000000', feeRate: 0.0005 },
      ],
    },
  ],
]);

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

export function startOnboarding(institutionData: {
  legalName: string;
  registrationNo: string;
  jurisdiction: string;
}): { data: VerifiedInstitution; transaction: TransactionMeta } {
  log.info({ legalName: institutionData.legalName }, 'Starting institutional onboarding');

  const partyId = `party::institution-${institutionData.jurisdiction.toLowerCase()}-${randomUUID().slice(0, 6)}`;
  const institution: VerifiedInstitution = {
    institutionParty: partyId,
    legalName: institutionData.legalName,
    registrationNo: institutionData.registrationNo,
    jurisdiction: institutionData.jurisdiction,
    kybStatus: 'Pending',
    kybLevel: 'Basic',
    riskProfile: {
      riskCategory: 'medium',
      maxSingleExposure: '10000000',
      maxTotalExposure: '50000000',
      allowedProducts: ['lending'],
      jurisdictionRules: [institutionData.jurisdiction],
    },
    subAccounts: [],
    verifiedAt: null,
    expiresAt: null,
  };

  MOCK_INSTITUTIONS.set(partyId, institution);
  return { data: institution, transaction: buildTransactionMeta() };
}

export function submitKYB(
  partyId: string,
  _documents: Record<string, unknown>,
): { data: { status: KYBStatus }; transaction: TransactionMeta } {
  log.info({ partyId }, 'Submitting KYB documents');

  const inst = MOCK_INSTITUTIONS.get(partyId);
  if (inst) {
    inst.kybStatus = 'InReview';
  }

  // MP20: Notify institution that KYB documents were received
  notificationBus.emit({
    type: 'KYB_RECEIVED',
    category: 'compliance',
    severity: 'info',
    partyId,
    title: 'KYB Documents Received',
    message: 'Your KYB verification documents have been received and are under review.',
    data: { legalName: inst?.legalName ?? partyId },
    deduplicationKey: `kyb-received:${partyId}`,
    link: '/institutional/onboard',
  }).catch((err) => log.warn({ err }, 'KYB received notification failed'));

  return {
    data: { status: 'InReview' },
    transaction: buildTransactionMeta(),
  };
}

export function verifyKYB(
  partyId: string,
  result: { approved: boolean; level: 'Basic' | 'Enhanced' | 'Full' },
): { data: { status: KYBStatus }; transaction: TransactionMeta } {
  log.info({ partyId, approved: result.approved }, 'Verifying KYB');

  const inst = MOCK_INSTITUTIONS.get(partyId);
  if (inst) {
    inst.kybStatus = result.approved ? 'Verified' : 'Rejected';
    inst.kybLevel = result.level;
    if (result.approved) {
      inst.verifiedAt = new Date().toISOString();
      inst.expiresAt = new Date(Date.now() + 365 * 86_400_000).toISOString();
    }
  }

  // MP20: Notify institution of KYB result
  const kybType = result.approved ? 'KYB_APPROVED' as const : 'KYB_REJECTED' as const;
  notificationBus.emit({
    type: kybType,
    category: 'compliance',
    severity: result.approved ? 'info' : 'warning',
    partyId,
    title: result.approved ? 'KYB Verification Approved' : 'KYB Verification Rejected',
    message: result.approved
      ? `Your KYB verification has been approved at level "${result.level}". Full platform access is now available.`
      : 'Your KYB verification has been rejected. Please review the requirements and resubmit.',
    data: {
      legalName: inst?.legalName ?? partyId,
      approved: result.approved,
      level: result.level,
    },
    deduplicationKey: `kyb-result:${partyId}:${kybType}`,
    link: '/institutional/onboard',
  }).catch((err) => log.warn({ err }, 'KYB result notification failed'));

  return {
    data: { status: result.approved ? 'Verified' : 'Rejected' },
    transaction: buildTransactionMeta(),
  };
}

export function getInstitutionStatus(partyId: string): VerifiedInstitution | null {
  log.debug({ partyId }, 'Getting institution status');
  return MOCK_INSTITUTIONS.get(partyId) ?? null;
}

export function createAPIKey(
  partyId: string,
  name: string,
  permissions: string[],
): { data: { key: string; keyId: string; keyPrefix: string }; transaction: TransactionMeta } {
  log.info({ partyId, name }, 'Creating institutional API key');

  const rawKey = `dsk_${randomBytes(32).toString('hex')}`;
  const keyHash = createHash('sha256').update(rawKey).digest('hex');
  const keyPrefix = rawKey.slice(0, 12);
  const keyId = `key-${randomUUID().slice(0, 8)}`;

  const apiKey: InstitutionalAPIKey = {
    id: keyId,
    name,
    keyPrefix,
    permissions,
    rateLimit: 5000,
    isActive: true,
    lastUsedAt: null,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 86_400_000).toISOString(),
  };

  const existing = MOCK_API_KEYS.get(partyId) ?? [];
  existing.push(apiKey);
  MOCK_API_KEYS.set(partyId, existing);

  // Store hash in real DB; here we just log
  log.debug({ keyId, keyHash: keyHash.slice(0, 8) }, 'API key created');

  return {
    data: { key: rawKey, keyId, keyPrefix },
    transaction: buildTransactionMeta(),
  };
}

export function revokeAPIKey(
  partyId: string,
  keyId: string,
): { data: { revoked: boolean }; transaction: TransactionMeta } {
  log.info({ partyId, keyId }, 'Revoking API key');

  const keys = MOCK_API_KEYS.get(partyId);
  if (keys) {
    const key = keys.find((k) => k.id === keyId);
    if (key) key.isActive = false;
  }

  return { data: { revoked: true }, transaction: buildTransactionMeta() };
}

export function executeBulkDeposit(
  partyId: string,
  operations: SingleOp[],
): BulkOperation {
  log.info({ partyId, count: operations.length }, 'Executing bulk deposit');
  return executeBulkOps(partyId, operations);
}

export function executeBulkWithdraw(
  partyId: string,
  operations: SingleOp[],
): BulkOperation {
  log.info({ partyId, count: operations.length }, 'Executing bulk withdraw');
  return executeBulkOps(partyId, operations);
}

function executeBulkOps(_partyId: string, operations: SingleOp[]): BulkOperation {
  const results: BulkResult[] = operations.map((_op, index) => ({
    index,
    success: Math.random() > 0.05, // 95% success rate
    transactionId: `tx-${randomUUID().slice(0, 8)}`,
    error: null,
  }));

  const hasFailure = results.some((r) => !r.success);

  return {
    opId: `bulk-${randomUUID().slice(0, 8)}`,
    operations,
    status: hasFailure ? 'PartialFail' : 'Completed',
    results,
    submittedAt: new Date().toISOString(),
  };
}

export function getRiskReport(partyId: string): {
  institution: string;
  totalExposure: string;
  positionCount: number;
  avgHealthFactor: number;
  riskCategory: string;
  concentrationRisk: Record<string, string>;
} {
  log.debug({ partyId }, 'Generating risk report');

  return {
    institution: partyId,
    totalExposure: '45000000.00',
    positionCount: 12,
    avgHealthFactor: 1.85,
    riskCategory: 'low',
    concentrationRisk: {
      USDC: '40.5%',
      ETH: '25.3%',
      'T-BILL': '20.1%',
      wBTC: '14.1%',
    },
  };
}

export function exportCompliance(
  partyId: string,
  format: 'csv' | 'xml',
): { data: string; contentType: string } {
  log.info({ partyId, format }, 'Exporting compliance report');

  if (format === 'csv') {
    return {
      data: 'date,type,amount,pool,status\n2026-02-20,deposit,1000000,usdc-main,confirmed\n2026-02-19,borrow,500000,eth-main,confirmed',
      contentType: 'text/csv',
    };
  }

  return {
    data: '<compliance><report party="' + partyId + '"><transaction type="deposit" amount="1000000" /></report></compliance>',
    contentType: 'application/xml',
  };
}

export function createSubAccount(
  parentParty: string,
  subAccountData: { name: string },
): { data: { subAccountId: string; parentParty: string }; transaction: TransactionMeta } {
  log.info({ parentParty, name: subAccountData.name }, 'Creating sub-account');

  const subAccountId = `party::sub-${randomUUID().slice(0, 8)}`;
  const inst = MOCK_INSTITUTIONS.get(parentParty);
  if (inst) {
    inst.subAccounts.push(subAccountId);
  }

  return {
    data: { subAccountId, parentParty },
    transaction: buildTransactionMeta(),
  };
}

export function getFeeSchedule(partyId: string): FeeSchedule {
  log.debug({ partyId }, 'Getting fee schedule');
  return MOCK_FEE_SCHEDULES.get(partyId) ?? {
    tiers: [{ volumeThreshold: '0', feeRate: 0.001 }],
  };
}

export function listInstitutions(): VerifiedInstitution[] {
  return Array.from(MOCK_INSTITUTIONS.values());
}
