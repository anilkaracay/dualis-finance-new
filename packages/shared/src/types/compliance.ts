// ---------------------------------------------------------------------------
// Compliance Type System — MP21 KYC/AML
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// KYC Types
// ---------------------------------------------------------------------------

export type KYCProvider = 'sumsub' | 'onfido' | 'manual';

export type KYCVerificationStatus =
  | 'not_started'
  | 'token_generated'
  | 'in_progress'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'retry_needed'
  | 'expired';

export type SumsubReviewResult = 'GREEN' | 'RED' | 'YELLOW';

export type SumsubEventType =
  | 'applicantCreated'
  | 'applicantPending'
  | 'applicantReviewed'
  | 'applicantOnHold'
  | 'applicantActionPending'
  | 'applicantPersonalInfoChanged'
  | 'applicantDeleted';

// ---------------------------------------------------------------------------
// AML Types
// ---------------------------------------------------------------------------

export type AMLScreeningStatus = 'clean' | 'flagged' | 'high_risk' | 'blocked';

export type AMLScreeningType = 'wallet' | 'sanctions' | 'pep' | 'adverse_media';

export type WalletRiskCategory =
  | 'clean'
  | 'exchange'
  | 'defi'
  | 'mixer'
  | 'darknet'
  | 'sanctions'
  | 'scam'
  | 'unknown';

// ---------------------------------------------------------------------------
// Sanctions & PEP Types
// ---------------------------------------------------------------------------

export type SanctionsCheckResult = 'clear' | 'potential_match' | 'confirmed_match';

export type PEPCheckResult = 'not_pep' | 'pep_level_1' | 'pep_level_2' | 'pep_level_3';

export type PEPLevel = 'not_pep' | 'level1' | 'level2' | 'level3';

export type SanctionsListSource = 'ofac_sdn' | 'eu_sanctions' | 'un_sanctions' | 'masak' | 'pep';

export type ScreeningMatchType = 'exact' | 'fuzzy' | 'alias' | 'partial';

// ---------------------------------------------------------------------------
// Risk Types
// ---------------------------------------------------------------------------

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical' | 'blocked';

export type ComplianceDecision = 'auto_approved' | 'manual_review' | 'rejected' | 'blocked';

export interface RiskFactor {
  category: string;
  description: string;
  score: number;
  weight: number;
}

/** Risk weight constants for composite score calculation */
export const RISK_WEIGHTS = {
  kyc: 0.25,
  aml: 0.30,
  pep: 0.15,
  geographic: 0.20,
  behavioral: 0.10,
} as const;

// ---------------------------------------------------------------------------
// Compliance Action Types (Audit Log)
// ---------------------------------------------------------------------------

export type ComplianceAction =
  | 'kyc_initiated'
  | 'kyc_completed'
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'kyc_expired'
  | 'kyc_retry'
  | 'kyb_submitted'
  | 'kyb_approved'
  | 'kyb_rejected'
  | 'aml_screening_performed'
  | 'aml_flag_raised'
  | 'sanctions_check_performed'
  | 'sanctions_match_found'
  | 'pep_check_performed'
  | 'pep_match_found'
  | 'wallet_screened'
  | 'wallet_blocked'
  | 'risk_assessment_calculated'
  | 'risk_level_changed'
  | 'manual_review_started'
  | 'manual_review_completed'
  | 'document_verified'
  | 'document_rejected'
  | 'user_blocked'
  | 'user_unblocked'
  | 'data_export_requested'
  | 'data_deletion_requested'
  | 'data_deletion_executed'
  | 'periodic_rescreening'
  | 'sanctions_list_updated'
  | 'sib_created'
  | 'user_auto_approved'
  | 'manual_review_required'
  | 'gdpr_data_exported'
  | 'gdpr_deletion_requested'
  | 'gdpr_deletion_completed'
  | 'gdpr_deletion_rejected'
  | 'masak_sib_created';

export type ComplianceAuditCategory = 'kyc' | 'aml' | 'pep' | 'risk' | 'gdpr' | 'sanctions' | 'admin' | 'decision' | 'masak';

// ---------------------------------------------------------------------------
// Jurisdiction Types
// ---------------------------------------------------------------------------

export type JurisdictionCode = 'TR' | 'EU' | 'GLOBAL';

export interface JurisdictionConfig {
  code: JurisdictionCode;
  name: string;
  kycLevelName: string;
  documentRetentionYears: number;
  reScreeningPeriods: { low: number; medium: number; high: number; critical: number };
  reportingThresholds: {
    dailyLimitWithoutFullKYC: number;
    suspiciousTransactionReport: number;
    travelRule: number;
  };
  requiredDocuments: string[];
  pepCheckRequired: boolean;
  sanctionsLists: string[];
  eddThreshold: number;
}

// ---------------------------------------------------------------------------
// GDPR Types
// ---------------------------------------------------------------------------

export type GDPRRequestType = 'data_export' | 'data_deletion' | 'data_rectification';

export type GDPRRequestStatus = 'pending' | 'processing' | 'completed' | 'denied';

// ---------------------------------------------------------------------------
// Data Structures (API response shapes)
// ---------------------------------------------------------------------------

export interface KYCVerificationRecord {
  id: string;
  verificationId: string;
  userId: string;
  provider: KYCProvider;
  externalApplicantId: string | null;
  status: KYCVerificationStatus;
  reviewAnswer: SumsubReviewResult | null;
  rejectionReason: string | null;
  rejectionLabels: string[];
  documentTypes: string[];
  checkResults: {
    documentCheck: 'passed' | 'failed' | 'pending';
    facialCheck: 'passed' | 'failed' | 'pending';
    livenessCheck: 'passed' | 'failed' | 'pending';
    addressCheck: 'passed' | 'failed' | 'pending' | 'not_required';
  } | null;
  attemptCount: number;
  verifiedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AMLScreeningRecord {
  id: string;
  screeningId: string;
  userId: string;
  screeningType: AMLScreeningType;
  provider: string;
  externalId: string | null;
  status: AMLScreeningStatus;
  riskScore: number;
  walletAddress: string | null;
  riskCategory: WalletRiskCategory | null;
  flagReasons: string[];
  reviewedBy: string | null;
  reviewNote: string | null;
  screenedAt: string;
  nextScreeningAt: string | null;
  createdAt: string;
}

export interface RiskAssessmentRecord {
  id: string;
  assessmentId: string;
  userId: string;
  kycScore: number;
  amlScore: number;
  pepScore: number;
  geoScore: number;
  behavioralScore: number;
  compositeScore: number;
  riskLevel: RiskLevel;
  factors: RiskFactor[];
  decision: ComplianceDecision;
  decisionReason: string;
  triggeredBy: string;
  validUntil: string;
  createdAt: string;
}

export interface ComplianceAuditEntry {
  id: string;
  eventId: string;
  userId: string | null;
  action: ComplianceAction;
  actorId: string | null;
  actorType: 'system' | 'admin' | 'user' | 'webhook';
  category: ComplianceAuditCategory;
  description: string;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}

export interface SanctionsMatchResult {
  matched: boolean;
  result: SanctionsCheckResult;
  matches: Array<{
    entryId: string;
    fullName: string;
    listSource: SanctionsListSource;
    matchType: ScreeningMatchType;
    confidence: number;
    nationality: string | null;
    dateOfBirth: string | null;
  }>;
}

export interface PEPScreeningResult {
  isPEP: boolean;
  level: PEPLevel;
  score: number;
  matches: Array<{
    entryId: string;
    fullName: string;
    position: string;
    level: PEPLevel;
    confidence: number;
    nationality: string | null;
    dateOfBirth: string | null;
  }>;
}

export interface SumsubAccessTokenResponse {
  token: string;
  applicantId: string;
}

export interface SumsubWebhookEvent {
  applicantId: string;
  inspectionId: string;
  correlationId: string;
  externalUserId: string;
  type: SumsubEventType;
  reviewResult?: {
    reviewAnswer: SumsubReviewResult;
    rejectLabels?: string[];
    moderationComment?: string;
    clientComment?: string;
  };
  reviewStatus?: string;
  createdAtMs: string;
}

export interface DataDeletionRequestRecord {
  id: string;
  requestId: string;
  userId: string;
  requestType: GDPRRequestType;
  status: GDPRRequestStatus;
  reason: string | null;
  retentionEndDate: string | null;
  processedBy: string | null;
  processedAt: string | null;
  exportFileKey: string | null;
  completedAt: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Sumsub Widget Config (Frontend)
// ---------------------------------------------------------------------------

export interface SumsubWidgetConfig {
  accessToken: string;
  lang: 'tr' | 'en';
  theme: 'light' | 'dark';
}
