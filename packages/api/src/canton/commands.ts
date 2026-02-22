/**
 * Canton command builders.
 *
 * Each function returns a CantonCommand that can be submitted to the Canton
 * JSON API via CantonClient.exerciseChoice() or CantonClient.createContract().
 */
import type { CantonCommand } from './types.js';

// ---------------------------------------------------------------------------
// Template IDs (Daml qualified names)
// ---------------------------------------------------------------------------

const TEMPLATES = {
  lendingPool: 'Dualis.LendingPool:LendingPool',
  borrowPosition: 'Dualis.LendingPool:BorrowPosition',
  collateralPosition: 'Dualis.LendingPool:CollateralPosition',
  secLendingOffer: 'Dualis.SecLending:SecLendingOffer',
  secLendingDeal: 'Dualis.SecLending:SecLendingDeal',
  governance: 'Dualis.Governance:Proposal',
  flashLoan: 'Dualis.FlashLoan:FlashLoan',
  protocolConfig: 'Dualis.Protocol:ProtocolConfig',
} as const;

// ---------------------------------------------------------------------------
// Lending commands
// ---------------------------------------------------------------------------

/** Build a deposit command for a lending pool. */
export function buildDepositCommand(
  poolContractId: string,
  depositor: string,
  amount: string,
): CantonCommand {
  return {
    templateId: TEMPLATES.lendingPool,
    choice: 'Deposit',
    contractId: poolContractId,
    argument: { depositor, amount },
  };
}

/** Build a withdraw command for a lending pool. */
export function buildWithdrawCommand(
  poolContractId: string,
  depositor: string,
  shares: string,
): CantonCommand {
  return {
    templateId: TEMPLATES.lendingPool,
    choice: 'Withdraw',
    contractId: poolContractId,
    argument: { depositor, shares },
  };
}

/** Build a borrow command. */
export function buildBorrowCommand(
  poolContractId: string,
  borrower: string,
  amount: string,
  collateralAssets: Array<{ symbol: string; amount: string }>,
): CantonCommand {
  return {
    templateId: TEMPLATES.lendingPool,
    choice: 'Borrow',
    contractId: poolContractId,
    argument: { borrower, amount, collateralAssets },
  };
}

/** Build a repay command for a borrow position. */
export function buildRepayCommand(
  borrowPositionContractId: string,
  borrower: string,
  amount: string,
): CantonCommand {
  return {
    templateId: TEMPLATES.borrowPosition,
    choice: 'Repay',
    contractId: borrowPositionContractId,
    argument: { borrower, amount },
  };
}

/** Build an add-collateral command for a collateral position. */
export function buildAddCollateralCommand(
  collateralPositionContractId: string,
  borrower: string,
  asset: { symbol: string; amount: string },
): CantonCommand {
  return {
    templateId: TEMPLATES.collateralPosition,
    choice: 'AddCollateral',
    contractId: collateralPositionContractId,
    argument: { borrower, asset },
  };
}

// ---------------------------------------------------------------------------
// Securities lending commands
// ---------------------------------------------------------------------------

/** Build a create-offer command for securities lending. */
export function buildCreateOfferCommand(
  lender: string,
  security: { symbol: string; amount: string },
  feeType: string,
  feeValue: number,
  acceptedCollateralTypes: string[],
  initialMarginPercent: number,
  minLendDuration: number,
  maxLendDuration: number | null,
  isRecallable: boolean,
  recallNoticeDays: number,
): CantonCommand {
  return {
    templateId: TEMPLATES.secLendingOffer,
    choice: 'CreateOffer',
    argument: {
      lender,
      security,
      feeStructure: { type: feeType, value: feeValue },
      collateralSchedule: {
        acceptedCollateralTypes,
        initialMarginPercent,
        variationMarginPercent: initialMarginPercent * 0.95,
        marginCallThreshold: initialMarginPercent * 0.9,
        marginCallDeadlineHours: 24,
      },
      minLendDuration,
      maxLendDuration,
      isRecallable,
      recallNoticeDays,
    },
  };
}

/** Build an accept-offer command for a securities lending offer. */
export function buildAcceptOfferCommand(
  offerContractId: string,
  borrower: string,
  collateral: Array<{ symbol: string; amount: string }>,
  requestedDuration: number,
): CantonCommand {
  return {
    templateId: TEMPLATES.secLendingOffer,
    choice: 'AcceptOffer',
    contractId: offerContractId,
    argument: { borrower, collateral, requestedDuration },
  };
}

/** Build a recall command for an active securities lending deal. */
export function buildRecallCommand(
  dealContractId: string,
  lender: string,
): CantonCommand {
  return {
    templateId: TEMPLATES.secLendingDeal,
    choice: 'Recall',
    contractId: dealContractId,
    argument: { lender },
  };
}

/** Build a return command for an active securities lending deal. */
export function buildReturnCommand(
  dealContractId: string,
  borrower: string,
): CantonCommand {
  return {
    templateId: TEMPLATES.secLendingDeal,
    choice: 'Return',
    contractId: dealContractId,
    argument: { borrower },
  };
}

// ---------------------------------------------------------------------------
// Governance commands
// ---------------------------------------------------------------------------

/** Build a vote command for a governance proposal. */
export function buildVoteCommand(
  proposalContractId: string,
  voter: string,
  vote: 'for' | 'against' | 'abstain',
  weight: string,
): CantonCommand {
  return {
    templateId: TEMPLATES.governance,
    choice: 'CastVote',
    contractId: proposalContractId,
    argument: { voter, vote, weight },
  };
}

// ---------------------------------------------------------------------------
// Flash loan commands
// ---------------------------------------------------------------------------

/** Build a flash loan command. */
export function buildFlashLoanCommand(
  poolContractId: string,
  borrower: string,
  amount: string,
  callbackData: { operations: Array<{ type: string; [key: string]: unknown }> },
): CantonCommand {
  return {
    templateId: TEMPLATES.flashLoan,
    choice: 'ExecuteFlashLoan',
    contractId: poolContractId,
    argument: { borrower, amount, callbackData },
  };
}

// ---------------------------------------------------------------------------
// Admin / emergency commands
// ---------------------------------------------------------------------------

/** Build an emergency pause command. */
export function buildEmergencyPauseCommand(
  configContractId: string,
  operator: string,
  reason: string,
): CantonCommand {
  return {
    templateId: TEMPLATES.protocolConfig,
    choice: 'EmergencyPause',
    contractId: configContractId,
    argument: { operator, reason },
  };
}

/** Build a resume command to unpause the protocol. */
export function buildResumeCommand(
  configContractId: string,
  operator: string,
): CantonCommand {
  return {
    templateId: TEMPLATES.protocolConfig,
    choice: 'Resume',
    contractId: configContractId,
    argument: { operator },
  };
}
