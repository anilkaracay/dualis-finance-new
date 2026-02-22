/** Query parameters for listing pools */
export interface ListPoolsParams {
  assetType?: 'stablecoin' | 'crypto' | 'treasury' | 'rwa' | 'all';
  sortBy?: 'tvl' | 'supplyApy' | 'borrowApy' | 'utilization';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/** Pool history query parameters */
export interface PoolHistoryParams {
  period?: '7d' | '30d' | '90d' | '1y' | 'all';
}

/** Deposit into a lending pool */
export interface DepositRequest {
  amount: string;
}

/** Withdraw from a lending pool */
export interface WithdrawRequest {
  shares: string;
}

/** Request a new borrow */
export interface BorrowRequest {
  lendingPoolId: string;
  borrowAmount: string;
  collateralAssets: Array<{ symbol: string; amount: string }>;
}

/** Repay a loan */
export interface RepayRequest {
  amount: string;
}

/** Add collateral to existing position */
export interface AddCollateralRequest {
  asset: { symbol: string; amount: string };
}

/** Query parameters for sec lending offers */
export interface ListSecLendingOffersParams {
  assetType?: 'equity' | 'bond' | 'treasury' | 'all';
  minFee?: number;
  maxFee?: number;
  minDuration?: number;
  sortBy?: 'fee' | 'value' | 'duration' | 'created';
  limit?: number;
  offset?: number;
}

/** Create a new sec lending offer */
export interface CreateSecLendingOfferRequest {
  security: { symbol: string; amount: string };
  feeType: 'fixed' | 'floating' | 'negotiated';
  feeValue: number;
  acceptedCollateralTypes: string[];
  initialMarginPercent: number;
  minLendDuration: number;
  maxLendDuration?: number;
  isRecallable: boolean;
  recallNoticeDays: number;
}

/** Accept a sec lending offer */
export interface AcceptSecLendingOfferRequest {
  collateral: Array<{ symbol: string; amount: string }>;
  requestedDuration: number;
}

/** Credit score history query parameters */
export interface CreditHistoryParams {
  period?: '3m' | '6m' | '1y' | 'all';
}

/** Oracle price history query parameters */
export interface OraclePriceParams {
  history?: boolean;
  period?: '1h' | '24h' | '7d' | '30d';
}

/** Query parameters for governance proposals */
export interface ListProposalsParams {
  status?: 'active' | 'passed' | 'rejected' | 'executed' | 'all';
  limit?: number;
  offset?: number;
}

/** Create a governance proposal */
export interface CreateProposalRequest {
  title: string;
  description: string;
  category: string;
  actions: Array<{ type: string; params: Record<string, unknown> }>;
}

/** Cast a governance vote */
export interface CastVoteRequest {
  vote: 'for' | 'against' | 'abstain';
  weight: string;
}

/** Execute a flash loan */
export interface FlashLoanRequest {
  poolId: string;
  amount: string;
  callbackData: {
    operations: Array<{ type: string; [key: string]: unknown }>;
  };
}

/** Stake DUAL tokens */
export interface StakeRequest {
  amount: string;
  safetyModule: boolean;
}

/** Unstake DUAL tokens */
export interface UnstakeRequest {
  amount: string;
}

/** Update protocol config (admin) */
export interface UpdateConfigRequest {
  collateralConfigs?: Array<Record<string, unknown>>;
  protocolFeeRate?: number;
  flashLoanFeeRate?: number;
  minCollateralRatio?: number;
}

/** Analytics history query parameters */
export interface AnalyticsHistoryParams {
  metric?: 'tvl' | 'borrowed' | 'fees' | 'users' | 'liquidations';
  period?: '7d' | '30d' | '90d' | '1y';
}
