import type { CreditTier } from '../types/core';

/** Standard pagination metadata */
export interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/** Standard transaction metadata */
export interface TransactionMeta {
  id: string;
  status: 'submitted' | 'confirmed' | 'failed';
  timestamp: string;
}

/** Standard success response wrapper */
export interface ApiResponse<T> {
  data: T;
  pagination?: Pagination;
  transaction?: TransactionMeta;
}

/** Standard error response */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId: string;
    timestamp: string;
  };
}

/** API error codes */
export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'POOL_NOT_FOUND'
  | 'POSITION_NOT_FOUND'
  | 'INSUFFICIENT_BALANCE'
  | 'INSUFFICIENT_COLLATERAL'
  | 'HEALTH_FACTOR_TOO_LOW'
  | 'POOL_INACTIVE'
  | 'PROTOCOL_PAUSED'
  | 'BORROW_CAP_REACHED'
  | 'FLASH_LOAN_REPAY_FAILED'
  | 'CREDIT_CHECK_FAILED'
  | 'OFFER_EXPIRED'
  | 'DEAL_NOT_ACTIVE'
  | 'RECALL_NOT_ALLOWED'
  | 'ORACLE_STALE'
  | 'CANTON_ERROR'
  | 'CANTON_CONFLICT'
  | 'CANTON_UNREACHABLE'
  | 'CANTON_CONNECTION_REFUSED'
  | 'CANTON_TIMEOUT'
  | 'CANTON_CONNECTION_RESET'
  | 'CANTON_CONTRACT_NOT_FOUND'
  | 'CANTON_CONTRACT_ARCHIVED'
  | 'CANTON_UNAVAILABLE'
  | 'SUPPLY_CAP_EXCEEDED'
  | 'INSUFFICIENT_LIQUIDITY'
  | 'REPAY_EXCEEDS_DEBT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'EMAIL_ALREADY_EXISTS'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_VERIFIED'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_DEACTIVATED'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'INVALID_NONCE'
  | 'NONCE_EXPIRED'
  | 'WALLET_ALREADY_LINKED'
  | 'WALLET_SIGNATURE_FAILED'
  | 'KYB_REQUIRED'
  | 'KYB_ALREADY_SUBMITTED'
  | 'PASSWORD_TOO_WEAK'
  | 'SESSION_EXPIRED'
  | 'MAX_SESSIONS_REACHED'
  | 'KYC_ALREADY_APPROVED'
  | 'KYC_MAX_ATTEMPTS'
  | 'COMPLIANCE_BLOCKED'
  | 'PRIVACY_CONFIG_NOT_FOUND';

/** Health check response */
export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  canton: 'connected' | 'disconnected';
  database: 'connected' | 'disconnected';
  redis: 'connected' | 'disconnected';
}

/** Pool asset info in API responses */
export interface PoolAssetInfo {
  symbol: string;
  type: string;
  priceUSD: number;
}

/** Pool list item */
export interface PoolListItem {
  poolId: string;
  asset: PoolAssetInfo;
  totalSupply: number;
  totalSupplyUSD: number;
  totalBorrow: number;
  totalBorrowUSD: number;
  totalReserves: number;
  utilization: number;
  supplyAPY: number;
  borrowAPY: number;
  isActive: boolean;
  contractId: string;
}

/** Detailed pool response */
export interface PoolDetail extends PoolListItem {
  available: number;
  interestRateModel: {
    type: string;
    baseRate: number;
    multiplier: number;
    kink: number;
    jumpMultiplier: number;
  };
  collateralConfig: {
    loanToValue: number;
    liquidationThreshold: number;
    liquidationPenalty: number;
    borrowCap: number;
  };
  accumulatedBorrowIndex: number;
  accumulatedSupplyIndex: number;
  lastAccrualTimestamp: string;
}

/** Pool history data point */
export interface PoolHistoryPoint {
  timestamp: string;
  totalSupply: number;
  totalBorrow: number;
  supplyAPY: number;
  borrowAPY: number;
  utilization: number;
  priceUSD: number;
}

/** Deposit response */
export interface DepositResponse {
  poolContractId: string;
  positionContractId: string;
  sharesReceived?: string;
  amountDeposited?: string;
}

/** Withdraw response */
export interface WithdrawResponse {
  withdrawnAmount: string;
  remainingShares: number;
  /** Canton transaction update ID — used for CCView transaction link */
  updateId?: string;
}

/** Health factor in API responses */
export interface HealthFactorResponse {
  value: number;
  collateralValueUSD: number;
  weightedCollateralValueUSD?: number;
  borrowValueUSD: number;
  weightedLTV: number;
}

/** Borrow request response */
export interface BorrowResponse {
  borrowPositionId: string;
  collateralPositionId: string;
  borrowedAmount: string;
  healthFactor: HealthFactorResponse;
  creditTier: CreditTier;
  borrowAPY: number;
}

/** Borrow position list item */
export interface BorrowPositionItem {
  positionId: string;
  lendingPoolId: string;
  borrowedAsset: PoolAssetInfo;
  borrowedAmountPrincipal: number;
  currentDebt: number;
  interestAccrued: number;
  healthFactor: HealthFactorResponse;
  creditTier: CreditTier;
  isLiquidatable: boolean;
  collateral: Array<{ symbol: string; amount: string; valueUSD: number }>;
  borrowTimestamp: string;
  contractId: string;
}

/** Repay response */
export interface RepayResponse {
  remainingDebt: number;
  newHealthFactor: number;
}

/** Add collateral response */
export interface AddCollateralResponse {
  newCollateralValueUSD: number;
  newHealthFactor: number;
}

/** Sec lending offer list item */
export interface SecLendingOfferItem {
  offerId: string;
  lender: string;
  lenderCreditTier: CreditTier;
  security: { symbol: string; amount: number; type: string };
  feeStructure: { type: string; value: number };
  collateralSchedule: {
    acceptedCollateralTypes: string[];
    initialMarginPercent: number;
    variationMarginPercent: number;
    marginCallThreshold: number;
    marginCallDeadlineHours: number;
  };
  minLendDuration: number;
  maxLendDuration: number;
  isRecallable: boolean;
  recallNoticeDays: number;
  createdAt: string;
}

/** Create offer response */
export interface CreateOfferResponse {
  offerId: string;
  status: string;
}

/** Accept offer response */
export interface AcceptOfferResponse {
  dealId: string;
  status: string;
  startDate: string;
  expectedEndDate: string;
}

/** Sec lending deal list item */
export interface SecLendingDealItem {
  dealId: string;
  role: 'lender' | 'borrower';
  security: { symbol: string; amount: number };
  borrower: string;
  status: string;
  feeAccrued: number;
  collateralValueUSD: number;
  securityValueUSD: number;
  collateralRatio: number;
  startDate: string;
  expectedEndDate: string;
  daysSinceStart: number;
  corporateActions: unknown[];
}

/** Recall response */
export interface RecallResponse {
  dealId: string;
  status: string;
  recallDate: string;
}

/** Return response */
export interface ReturnResponse {
  dealId: string;
  status: string;
  totalFeePaid: number;
  collateralReturned: boolean;
}

/** Credit score breakdown */
export interface CreditScoreBreakdown {
  loanCompletion: { score: number; max: number; loansCompleted: number; loansDefaulted: number };
  repaymentTimeliness: { score: number; max: number; onTime: number; late: number };
  volumeHistory: { score: number; max: number; totalVolumeRepaid: number };
  collateralHealth: { score: number; max: number; lowestHealthFactor: number };
  securitiesLending: { score: number; max: number; dealsCompleted: number };
}

/** Credit score response */
export interface CreditScoreResponse {
  rawScore: number;
  creditTier: CreditTier;
  breakdown: CreditScoreBreakdown;
  tierBenefits: { minCollateralRatio: number; maxLTV: number; rateDiscount: number };
  nextTier: { tier: CreditTier; scoreRequired: number; pointsNeeded: number } | null;
  lastUpdated: string;
}

/** Credit history data point */
export interface CreditHistoryPoint {
  timestamp: string;
  score: number;
  tier: CreditTier;
  event: string;
}

/** Oracle price item */
export interface OraclePriceItem {
  asset: string;
  quoteCurrency: string;
  price: number;
  confidence: number;
  source: string;
  timestamp: string;
  change24h: number;
  change24hPercent: number;
}

/** Oracle price with history */
export interface OraclePriceWithHistory {
  current: OraclePriceItem;
  history: Array<{ timestamp: string; price: number }>;
}

/** Governance proposal list item */
export interface ProposalListItem {
  proposalId: string;
  title: string;
  description: string;
  proposer: string;
  category: string;
  status: string;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  quorum: number;
  quorumReached: boolean;
  startTime: string;
  endTime: string;
  timeRemaining: string;
}

/** Create proposal response */
export interface CreateProposalResponse {
  proposalId: string;
  status: string;
}

/** Cast vote response */
export interface CastVoteResponse {
  recorded: boolean;
  newForVotes: number;
}

/** Flash loan response */
export interface FlashLoanResponse {
  borrowed: number;
  fee: number;
  returned: number;
  operations: Array<{ type: string; status: string }>;
}

/** Staking info */
export interface StakingInfo {
  totalStaked: number;
  stakingAPY: number;
  safetyModuleSize: number;
  safetyModuleAPY: number;
  rewardsDistributed24h: number;
  totalStakers: number;
}

/** Staking position */
export interface StakingPositionResponse {
  stakedAmount: number;
  safetyModuleStake: number;
  pendingRewards: number;
  claimableRewards: number;
  stakingSince: string;
  cooldownEnd: string | null;
  votingPower: number;
}

/** Analytics overview */
export interface AnalyticsOverview {
  tvl: number;
  totalBorrowed: number;
  totalFees24h: number;
  totalFees7d: number;
  totalLiquidations24h: number;
  uniqueUsers24h: number;
  totalTransactions24h: number;
  avgHealthFactor: number;
  secLendingVolume24h: number;
  activeSecLendingDeals: number;
  flashLoanVolume24h: number;
  protocolRevenue30d: number;
}

/** Analytics history data point */
export interface AnalyticsHistoryPoint {
  timestamp: string;
  value: number;
}
