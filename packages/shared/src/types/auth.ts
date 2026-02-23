// ============================================================
// Auth & Onboarding Types
// ============================================================

export type UserRole = 'retail' | 'institutional' | 'admin' | 'compliance_officer' | 'viewer';

/** Roles that can access the admin panel */
export type AdminRole = 'admin' | 'compliance_officer' | 'viewer';

export type AccountStatus =
  | 'pending_verification'
  | 'active'
  | 'suspended'
  | 'deactivated'
  | 'blacklisted';

export type AuthProvider = 'email' | 'wallet';

export type KYCVerificationStatus =
  | 'not_started'
  | 'identity_submitted'
  | 'under_review'
  | 'approved'
  | 'rejected';

export type InstitutionalKYBStatus =
  | 'not_started'
  | 'documents_submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'requires_additional_info';

export type OnboardingStep =
  | 'account_created'
  | 'email_verified'
  | 'company_info'
  | 'documents_uploaded'
  | 'kyc_completed'
  | 'ubo_declared'
  | 'review_submitted'
  | 'approved';

// ---- Core user shape returned by API ----

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  walletAddress: string | null;
  partyId: string;
  displayName: string | null;
  authProvider: AuthProvider;
  kycStatus: KYCVerificationStatus;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: AuthUser;
}

// ---- Retail ----

export interface RetailProfileData {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  country: string | null;
  kycStatus: KYCVerificationStatus;
  onboardingCompleted: boolean;
}

// ---- Institutional ----

export interface InstitutionData {
  institutionId: string;
  userId: string;
  companyName: string;
  companyLegalName: string | null;
  registrationNumber: string | null;
  taxId: string | null;
  jurisdiction: string;
  companyType: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  repFirstName: string;
  repLastName: string;
  repTitle: string;
  repEmail: string;
  repPhone: string | null;
  kybStatus: InstitutionalKYBStatus;
  onboardingStep: number;
  createdAt: string;
}

export interface BeneficialOwnerData {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  nationality: string | null;
  ownershipPercent: number;
  isPEP: boolean;
  idDocumentType: string | null;
  idVerified: boolean;
}

export interface ComplianceDocumentData {
  id: string;
  documentType: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status: 'pending' | 'verified' | 'rejected';
  uploadedAt: string;
  reviewedAt: string | null;
}

export interface InstitutionalOnboardingStatus {
  currentStep: number;
  totalSteps: number;
  institution: InstitutionData | null;
  documents: ComplianceDocumentData[];
  beneficialOwners: BeneficialOwnerData[];
  kybStatus: InstitutionalKYBStatus;
  kycStatus: KYCVerificationStatus;
}

// ---- API Request Types ----

export interface RegisterRetailRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface RegisterInstitutionalRequest {
  email: string;
  password: string;
  companyName: string;
  repFirstName: string;
  repLastName: string;
  repTitle: string;
}

export interface LoginEmailRequest {
  email: string;
  password: string;
}

export interface LoginWalletRequest {
  walletAddress: string;
  signature: string;
  nonce: string;
}

export interface WalletNonceRequest {
  walletAddress: string;
}

export interface WalletNonceResponse {
  nonce: string;
  expiresAt: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface LinkWalletRequest {
  walletAddress: string;
  signature: string;
  nonce: string;
}

// ---- KYB Submit ----

export interface KYBSubmitRequest {
  companyLegalName?: string;
  registrationNumber?: string;
  taxId?: string;
  companyType?: string;
  jurisdiction: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  repFirstName: string;
  repLastName: string;
  repTitle: string;
  repEmail: string;
  repPhone?: string;
}

export interface KYBUpdateStepRequest {
  step: number;
  data: Record<string, unknown>;
}

export interface UBODeclarationRequest {
  beneficialOwners: Array<{
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    nationality?: string;
    ownershipPercent: number;
    isPEP: boolean;
    idDocumentType?: string;
  }>;
  confirmationChecked: boolean;
}

export interface DocumentUploadConfirmRequest {
  documentType: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
}

// ============================================================
// Admin Panel Types (MP19)
// ============================================================

export interface AdminAuditLog {
  id: number;
  userId: number;
  adminName: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string | null;
  oldValue: unknown | null;
  newValue: unknown | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AdminSession {
  id: number;
  userId: number;
  loginAt: string;
  logoutAt: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  isActive: boolean;
  lastActivityAt: string;
}

export interface ProtocolConfigData {
  id: number;
  protocolFeeRate: number;
  liquidationIncentiveRate: number;
  flashLoanFeeRate: number;
  minBorrowAmount: number;
  maxBorrowAmount: number;
  isPaused: boolean;
  pausedAt: string | null;
  pausedBy: number | null;
  pauseReason: string | null;
  updatedAt: string;
  updatedBy: number | null;
}

export interface PoolParameterChange {
  id: number;
  poolId: string;
  parameterName: string;
  oldValue: string;
  newValue: string;
  changedBy: number;
  changedAt: string;
  reason: string | null;
}

export interface AdminDashboardStats {
  totalTVL: number;
  tvlDelta24h: number;
  activeLoans: number;
  totalBorrowValue: number;
  totalUsers: number;
  newUsersThisWeek: number;
  protocolRevenue: number;
  revenueThisMonth: number;
}

export interface AdminPoolSummary {
  poolId: string;
  name: string;
  asset: string;
  status: 'active' | 'paused' | 'archived';
  tvl: number;
  totalBorrow: number;
  utilization: number;
  supplyAPY: number;
  borrowAPY: number;
  maxLTV: number;
  liquidationThreshold: number;
  createdAt: string;
}

export interface AdminUserSummary {
  id: number;
  userId: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  accountStatus: AccountStatus;
  kycStatus: string;
  isAdminActive: boolean;
  totalSupplied: number;
  totalBorrowed: number;
  minHealthFactor: number | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AdminPoolParams {
  baseRatePerYear: number;
  multiplierPerYear: number;
  jumpMultiplierPerYear: number;
  kink: number;
  maxLTV: number;
  liquidationThreshold: number;
  liquidationPenalty: number;
  liquidationBonus: number;
  supplyCap: number;
  borrowCap: number;
}
