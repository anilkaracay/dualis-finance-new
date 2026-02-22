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

// Governance types
export type {
  ProposalStatus,
  ProposalCategory,
  VoteDirection,
  Proposal,
  ProposalAction,
  Vote,
} from './types/governance';

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
  calculateAPY,
  calculateUtilization,
  calculateBorrowRate,
  calculateSupplyRate,
  calculateHealthFactor,
  calculateWeightedLTV,
  calculateLiquidationPrice,
  calculateCreditScore,
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

// Composite credit constants
export { TIER_BENEFITS } from './types/compositeCredit';

// Productive lending constants
export { PRODUCTIVE_RATE_DISCOUNTS, ESG_BONUSES } from './types/productive';
