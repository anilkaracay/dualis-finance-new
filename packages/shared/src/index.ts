// Core types
export type {
  InstrumentType,
  Asset,
  InterestRateModel,
  CollateralConfig,
  HealthFactor,
  CreditTier,
  CantonContract,
} from './types/core';

// Lending types
export type {
  LendingPool,
  LendingPosition,
  CollateralPosition,
  BorrowPosition,
} from './types/lending';

// Securities lending types
export type {
  SecLendingStatus,
  FeeStructure,
  CollateralSchedule,
  SecLendingOffer,
  CorporateActionType,
  CorporateActionRecord,
  SecLendingDeal,
} from './types/secLending';

// Credit types
export type {
  CreditProfile,
  CreditTierAttestation,
} from './types/credit';

// Liquidation types
export type {
  LiquidationTier,
  LiquidationTrigger,
  LiquidationResult,
} from './types/liquidation';

// Oracle types
export type {
  PriceFeed,
  AggregatedPriceFeed,
} from './types/oracle';

// Token types
export type {
  StakingPosition,
  DualToken,
  TokenAllocation,
} from './types/token';

// Governance types (MP23)
export {
  ProposalType,
  ProposalStatus,
  VoteDirection,
  DEFAULT_GOVERNANCE_CONFIG,
} from './types/governance';

export type {
  ProposalCategory,
  LegacyProposalStatus,
  ParameterChangePayload,
  NewPoolPayload,
  TreasurySpendPayload,
  EmergencyActionPayload,
  FeeChangePayload,
  ProposalPayload,
  GovernanceConfigData,
  GovernanceProposal,
  GovernanceVote,
  Delegation,
  TokenSnapshot,
  ExecutionQueueItem,
  DualTokenBalance,
  VoteResults,
  Proposal,
  ProposalAction,
  Vote,
} from './types/governance';

// Governance constants
export { GOVERNANCE } from './constants/governance';

// Protocol types
export type {
  ProtocolConfig,
  TIFACollateralBridge,
  BridgeStatus,
} from './types/protocol';

// Attestation types
export type {
  AttestationType,
  ZKProof,
  OffChainAttestation,
  AttestationBundle,
} from './types/attestation';

// Composite credit types
export type {
  OnChainBreakdown,
  OffChainBreakdown,
  EcosystemBreakdown,
  ScoreLayer,
  TierBenefits,
  CompositeScore,
} from './types/compositeCredit';

// Productive lending types
export type {
  ProjectCategory,
  ProjectStatus,
  ESGRating,
  CashflowStatus,
  ProductiveBorrowStatus,
  ProjectMetadata,
  CashflowEntry,
  HybridCollateral,
  ProductiveProject,
  ProductiveBorrow,
  ProductivePool,
  IoTReading,
} from './types/productive';

// Institutional types
export type {
  KYBStatus,
  KYBLevel,
  BulkStatus,
  InstitutionalRiskProfile,
  VerifiedInstitution,
  InstitutionalAPIKey,
  BulkOperation,
  SingleOp,
  BulkResult,
  FeeSchedule,
  FeeScheduleTier,
} from './types/institutional';

// Privacy types
export type {
  PrivacyLevel,
  DataScope,
  DisclosureRule,
  PrivacyConfig,
  PrivacyAuditEntry,
} from './types/privacy';

// Auth & Onboarding types
export type {
  UserRole,
  AccountStatus,
  AuthProvider,
  KYCVerificationStatus,
  InstitutionalKYBStatus,
  OnboardingStep,
  AuthUser,
  AuthSession,
  RetailProfileData,
  InstitutionData,
  BeneficialOwnerData,
  ComplianceDocumentData,
  InstitutionalOnboardingStatus,
  RegisterRetailRequest,
  RegisterInstitutionalRequest,
  LoginEmailRequest,
  LoginWalletRequest,
  WalletNonceRequest,
  WalletNonceResponse,
  RefreshTokenRequest,
  VerifyEmailRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  LinkWalletRequest,
  KYBSubmitRequest,
  KYBUpdateStepRequest,
  UBODeclarationRequest,
  DocumentUploadConfirmRequest,
  AdminRole,
  AdminAuditLog,
  AdminSession,
  ProtocolConfigData,
  PoolParameterChange,
  AdminDashboardStats,
  AdminPoolSummary,
  AdminUserSummary,
  AdminPoolParams,
} from './types/auth';

// Notification types (MP20)
export type {
  NotificationCategory,
  NotificationType,
  NotificationSeverity,
  NotificationChannel,
  NotificationStatus,
  NotificationDisplayType,
  NotificationEvent,
  StoredNotification,
  UserNotificationPreferences,
  WebhookEndpoint,
  WebhookDeliveryLog,
  EmailDeliveryLog,
  WebhookPayload,
  NotificationListQuery,
  NotificationListResponse,
  UnreadCountResponse,
  CreateWebhookRequest,
  UpdateWebhookRequest,
  TestNotificationRequest,
  NotificationDefaults,
} from './types/notification';

export {
  NOTIFICATION_DEFAULTS,
  DEDUP_WINDOWS,
  DEFAULT_DEDUP_WINDOW_MS,
  notificationTypeToDisplayType,
} from './types/notification';

// Analytics & Reporting types (MP24)
export type {
  AnalyticsTimeRange,
  AnalyticsMetric,
  PoolSnapshot,
  ProtocolSnapshot,
  UserPositionSnapshot,
  AnalyticsEventType,
  AnalyticsEvent,
  HealthScoreRating,
  ProtocolHealthSnapshot,
  RevenueType,
  RevenueLogEntry,
  TimeSeriesPoint,
  PoolAnalyticsSummary,
  PoolRanking,
  SupplyPositionDetail,
  BorrowPositionDetail,
  UserPortfolio,
  UserTransaction,
  TaxReportEntry,
  TaxReportSummary,
  ProtocolStats,
  ProtocolPoolSummary,
  ProtocolHealthDashboard,
  HfDistributionBucket,
  RevenueSummary,
  RevenueBreakdown,
  RevenueByPool,
  AdminAnalyticsOverview,
  UserAnalytics,
  CohortRow,
  ExportFormat,
  ExportType,
  ExportRequest,
  InstitutionalPortfolio,
  InstitutionalRiskMetrics,
  PnlBreakdown,
} from './types/analytics';

export { getHealthScoreRating } from './types/analytics';

// Wallet & PartyLayer types
export type {
  WalletType,
  CustodyMode,
  TransactionRoutingMode,
  TransactionStatus,
  WalletConnection,
  PartyMapping,
  WalletPreferences,
  CustodialPartyInfo,
  TransactionLog,
  ConnectWalletRequest,
  DisconnectWalletRequest,
  UpdateWalletPreferencesRequest,
  SubmitTransactionRequest,
  SignTransactionRequest,
  TransactionResult,
} from './types/wallet';

// API request types
export type {
  ListPoolsParams,
  PoolHistoryParams,
  DepositRequest,
  WithdrawRequest,
  BorrowRequest,
  RepayRequest,
  AddCollateralRequest,
  ListSecLendingOffersParams,
  CreateSecLendingOfferRequest,
  AcceptSecLendingOfferRequest,
  CreditHistoryParams,
  OraclePriceParams,
  ListProposalsParams,
  CreateProposalRequest,
  CastVoteRequest,
  FlashLoanRequest,
  StakeRequest,
  UnstakeRequest,
  UpdateConfigRequest,
  AnalyticsHistoryParams,
} from './api/requests';

// API response types
export type {
  Pagination,
  TransactionMeta,
  ApiResponse,
  ApiError,
  ApiErrorCode,
  HealthResponse,
  PoolAssetInfo,
  PoolListItem,
  PoolDetail,
  PoolHistoryPoint,
  DepositResponse,
  WithdrawResponse,
  HealthFactorResponse,
  BorrowResponse,
  BorrowPositionItem,
  RepayResponse,
  AddCollateralResponse,
  SecLendingOfferItem,
  CreateOfferResponse,
  AcceptOfferResponse,
  SecLendingDealItem,
  RecallResponse,
  ReturnResponse,
  CreditScoreBreakdown,
  CreditScoreResponse,
  CreditHistoryPoint,
  OraclePriceItem,
  OraclePriceWithHistory,
  ProposalListItem,
  CreateProposalResponse,
  CastVoteResponse,
  FlashLoanResponse,
  StakingInfo,
  StakingPositionResponse,
  AnalyticsOverview,
  AnalyticsHistoryPoint,
} from './api/responses';

// WebSocket types
export type {
  WsMessageType,
  WsMessage,
  WsAuthMessage,
  WsAuthSuccess,
  WsAuthError,
  WsSubscribeMessage,
  WsUnsubscribeMessage,
  WsSubscribedMessage,
  WsUnsubscribedMessage,
  WsDataMessage,
  WsErrorMessage,
  WsPingMessage,
  WsPongMessage,
  WsClientMessage,
  WsServerMessage,
  WsPricePayload,
  WsPoolPayload,
  WsPositionPayload,
  WsLiquidationPayload,
  WsSecLendingOfferPayload,
  WsSecLendingDealPayload,
  WsGovernancePayload,
  WsNotificationPayload,
  WsCompositeScorePayload,
  WsProductiveProjectStatusPayload,
  WsCorporateActionPendingPayload,
  WsKybStatusChangedPayload,
  WsPrivacyAccessAttemptPayload,
  WsInnovationEvent,
  WsInnovationEventType,
  WsChannel,
} from './api/ws';

// Utilities
export {
  formatCurrency,
  formatPercent,
  formatAddress,
  formatDate,
  formatNumber,
} from './utils/format';

export {
  // Legacy exports (backward compatible)
  calculateAPY,
  calculateUtilization,
  calculateBorrowRate,
  calculateSupplyRate,
  calculateHealthFactor,
  calculateWeightedLTV,
  calculateLiquidationPrice,
  calculateCreditScore,
  // New financial math engine exports
  calculateBorrowAPR,
  calculateSupplyAPR,
  calculateTierAdjustedBorrowAPR,
  calculatePoolAPY,
  aprToApy,
  apyToApr,
  annualToPerSecond,
  accrueInterest,
  calculateCurrentBalance,
  calculateInterestDelta,
  calculateMaxBorrowable,
  calculateLiquidation,
  generateRateCurve,
  simulatePriceImpact,
  findLiquidationPrice,
  formatRatePercent,
  formatUSD,
  formatHealthFactor,
  // Constants
  SECONDS_PER_YEAR,
  CLOSE_FACTOR_NORMAL,
  CLOSE_FACTOR_CRITICAL,
  CRITICAL_HF_THRESHOLD,
  RESERVE_SPLIT_LIQUIDATOR,
  RESERVE_SPLIT_PROTOCOL,
} from './utils/math';

export type {
  InterestRateModelConfig,
  CollateralPositionInput,
  DebtPositionInput,
  HealthFactorResult,
  HealthFactorStatus,
  LiquidationCalcResult,
  AccrualResult,
} from './utils/math';

export {
  CREDIT_TIER_THRESHOLDS,
  CREDIT_TIER_PARAMS,
  LIQUIDATION_TIERS,
  TIFA_HAIRCUTS,
  DUAL_TOKEN,
  ORACLE_FEEDS,
  PROTOCOL_DEFAULTS,
  SCORE_MAXES,
} from './utils/constants';

// Config exports (rate models, collateral params, credit tiers)
export {
  RATE_MODELS,
  getRateModel,
  COLLATERAL_PARAMS,
  getCollateralParams,
  CREDIT_TIER_MATH,
  ALERT_THRESHOLDS,
  HF_COLORS,
  getEffectiveLTV,
  getAlertLevel,
  mapCantonToPool,
  mapPoolToCanton,
  getKnownCantonSymbols,
  SPLICE_TEMPLATE_HINTS,
} from './config';

export type {
  CollateralParamsConfig,
  CreditTierMathConfig,
} from './config';

// Composite credit constants
export { TIER_BENEFITS } from './types/compositeCredit';

// Productive lending constants
export { PRODUCTIVE_RATE_DISCOUNTS, ESG_BONUSES } from './types/productive';

// Compliance types (MP21 KYC/AML)
export type {
  KYCProvider,
  KYCVerificationStatus as ComplianceKYCStatus,
  SumsubReviewResult,
  SumsubEventType,
  AMLScreeningStatus,
  AMLScreeningType,
  WalletRiskCategory,
  SanctionsCheckResult,
  PEPCheckResult,
  PEPLevel,
  SanctionsListSource,
  ScreeningMatchType,
  RiskLevel,
  ComplianceDecision,
  RiskFactor,
  ComplianceAction,
  ComplianceAuditCategory,
  JurisdictionCode,
  JurisdictionConfig,
  GDPRRequestType,
  GDPRRequestStatus,
  KYCVerificationRecord,
  AMLScreeningRecord,
  RiskAssessmentRecord,
  ComplianceAuditEntry,
  SanctionsMatchResult,
  PEPScreeningResult,
  SumsubAccessTokenResponse,
  SumsubWebhookEvent,
  SumsubWidgetConfig,
  DataDeletionRequestRecord,
} from './types/compliance';

export { RISK_WEIGHTS } from './types/compliance';
