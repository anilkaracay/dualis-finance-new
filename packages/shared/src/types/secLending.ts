import type { Asset, InstrumentType } from './core';

/** Securities lending deal status */
export type SecLendingStatus =
  | 'Offered'
  | 'Matched'
  | 'Active'
  | 'RecallRequested'
  | 'Returning'
  | 'Settled'
  | 'Defaulted';

/** Fee structure for securities lending */
export type FeeStructure =
  | { type: 'FixedFee'; value: string }
  | { type: 'FloatingFee'; benchmark: string; spread: string }
  | { type: 'NegotiatedFee'; value: string };

/** Collateral schedule for securities lending */
export interface CollateralSchedule {
  /** Accepted collateral instrument types */
  acceptedCollateralTypes: InstrumentType[];
  /** Initial margin requirement (e.g., 1.05 = 105%) */
  initialMarginPercent: string;
  /** Variation margin requirement */
  variationMarginPercent: string;
  /** Margin call trigger threshold */
  marginCallThreshold: string;
  /** Hours to meet margin call */
  marginCallDeadlineHours: number;
}

/** Securities lending offer */
export interface SecLendingOffer {
  /** Unique offer identifier */
  offerId: string;
  /** Protocol operator party */
  protocolOperator: string;
  /** Lender party */
  lender: string;
  /** Security being offered for lending */
  security: Asset;
  /** Fee terms */
  feeStructure: FeeStructure;
  /** Collateral requirements */
  collateralSchedule: CollateralSchedule;
  /** Minimum lending duration in days */
  minLendDuration: number;
  /** Maximum lending duration in days, null if unlimited */
  maxLendDuration: number | null;
  /** Whether lender can recall securities */
  isRecallable: boolean;
  /** Recall notice period in days */
  recallNoticeDays: number;
  /** Offer creation timestamp (ISO 8601) */
  createdAt: string;
}

/** Corporate action type */
export type CorporateActionType =
  | 'Dividend'
  | 'CouponPayment'
  | 'StockSplit'
  | 'VotingRight'
  | 'MandatoryAction';

/** Record of a corporate action processed during a deal */
export interface CorporateActionRecord {
  /** Type of corporate action */
  actionType: CorporateActionType;
  /** Action details */
  details: string;
  /** USD value of the action, null if not monetary */
  valueUSD: string | null;
  /** Processing timestamp (ISO 8601) */
  processedAt: string;
  /** Whether compensation was paid */
  compensated: boolean;
}

/** Active securities lending deal */
export interface SecLendingDeal {
  /** Deal identifier (format: "{offerId}-{borrowerParty}") */
  dealId: string;
  /** Protocol operator party */
  protocolOperator: string;
  /** Lender party */
  lender: string;
  /** Borrower party */
  borrower: string;
  /** Security being lent */
  security: Asset;
  /** Fee terms */
  feeStructure: FeeStructure;
  /** Collateral schedule */
  collateralSchedule: CollateralSchedule;
  /** Posted collateral assets */
  collateral: Asset[];
  /** Collateral value in USD */
  collateralValueUSD: string;
  /** Security value in USD */
  securityValueUSD: string;
  /** Accumulated fees */
  currentFeeAccrued: string;
  /** Current deal status */
  status: SecLendingStatus;
  /** Deal start date (ISO 8601) */
  startDate: string;
  /** Expected end date (ISO 8601) */
  expectedEndDate: string;
  /** Recall date if recall requested (ISO 8601), null otherwise */
  recallDate: string | null;
  /** Last mark-to-market timestamp (ISO 8601) */
  lastMarkToMarket: string;
  /** Corporate actions processed during the deal */
  corporateActions: CorporateActionRecord[];
}
