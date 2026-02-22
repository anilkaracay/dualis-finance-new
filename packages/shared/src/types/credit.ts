import type { CreditTier } from './core';

/** Full credit profile for a borrower */
export interface CreditProfile {
  /** Credit profile identifier */
  profileId: string;
  /** Protocol operator party */
  protocolOperator: string;
  /** Borrower party */
  borrower: string;
  /** Credit assessor party */
  creditAssessor: string;
  /** Total loans completed successfully */
  totalLoansCompleted: number;
  /** Total loans defaulted */
  totalLoansDefaulted: number;
  /** Total volume borrowed (Decimal as string) */
  totalVolumeBorrowed: string;
  /** Total volume repaid (Decimal as string) */
  totalVolumeRepaid: string;
  /** Total interest paid (Decimal as string) */
  totalInterestPaid: string;
  /** Number of on-time repayments */
  onTimeRepayments: number;
  /** Number of late repayments */
  lateRepayments: number;
  /** Average repayment duration in days (Decimal as string) */
  averageRepaymentDays: string;
  /** Lowest health factor ever recorded (Decimal as string) */
  lowestHealthFactorEver: string;
  /** Number of liquidations */
  liquidationCount: number;
  /** Securities lending deals completed */
  secLendingDealsCompleted: number;
  /** Securities lending timely returns */
  secLendingTimelyReturns: number;
  /** Raw credit score (0-1000, Decimal as string) */
  rawScore: string;
  /** Current credit tier */
  creditTier: CreditTier;
  /** Last score update timestamp (ISO 8601) */
  lastUpdated: string;
}

/** Credit tier attestation on-chain */
export interface CreditTierAttestation {
  /** Protocol operator party */
  protocolOperator: string;
  /** Credit assessor party */
  creditAssessor: string;
  /** Borrower party */
  borrower: string;
  /** Attested credit tier */
  creditTier: CreditTier;
  /** Attestation timestamp (ISO 8601) */
  attestedAt: string;
  /** Attestation validity end (ISO 8601) */
  validUntil: string;
}
