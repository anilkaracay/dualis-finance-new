export type KYBStatus = 'Pending' | 'InReview' | 'Verified' | 'Expired' | 'Rejected';
export type KYBLevel = 'Basic' | 'Enhanced' | 'Full';
export type BulkStatus = 'Pending' | 'Processing' | 'Completed' | 'PartialFail';

export interface InstitutionalRiskProfile {
  riskCategory: 'low' | 'medium' | 'high';
  maxSingleExposure: string;
  maxTotalExposure: string;
  allowedProducts: string[];
  jurisdictionRules: string[];
}

export interface VerifiedInstitution {
  institutionParty: string;
  legalName: string;
  registrationNo: string;
  jurisdiction: string;
  kybStatus: KYBStatus;
  kybLevel: KYBLevel;
  riskProfile: InstitutionalRiskProfile;
  subAccounts: string[];
  verifiedAt: string | null;
  expiresAt: string | null;
}

export interface InstitutionalAPIKey {
  id: string;
  name: string;
  keyPrefix: string; // First 8 chars for display
  permissions: string[];
  rateLimit: number;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export interface BulkOperation {
  opId: string;
  operations: SingleOp[];
  status: BulkStatus;
  results: BulkResult[];
  submittedAt: string;
}

export interface SingleOp {
  opType: 'deposit' | 'withdraw' | 'borrow';
  poolId: string;
  amount: string;
}

export interface BulkResult {
  index: number;
  success: boolean;
  transactionId: string | null;
  error: string | null;
}

export interface FeeSchedule {
  tiers: FeeScheduleTier[];
}

export interface FeeScheduleTier {
  volumeThreshold: string; // USD
  feeRate: number; // Decimal
}
