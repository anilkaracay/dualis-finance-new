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
  lendingPool: 'Dualis.Lending.Pool:LendingPool',
  borrowPosition: 'Dualis.Lending.Borrow:BorrowPosition',
  collateralPosition: 'Dualis.Lending.Collateral:CollateralVault',
  secLendingOffer: 'Dualis.SecLending.Advanced:FractionalOffer',
  secLendingDeal: 'Dualis.SecLending.Advanced:NettingAgreement',
  governance: 'Dualis.Governance.Proposal:Proposal',
  flashLoan: 'Dualis.Liquidation.Engine:FlashLiquidation',
  protocolConfig: 'Dualis.Core.Config:ProtocolConfig',
  creditAttestationBundle: 'Dualis.Credit.Attestation:CreditAttestationBundle',
  compositeCredit: 'Dualis.Credit.CompositeScore:CompositeCredit',
  productiveProject: 'Dualis.Productive.Core:ProductiveProject',
  productiveBorrow: 'Dualis.Productive.Core:ProductiveBorrow',
  productivePool: 'Dualis.Productive.Core:ProductiveLendingPool',
  fractionalOffer: 'Dualis.SecLending.Advanced:FractionalOffer',
  corporateActionHandler: 'Dualis.SecLending.Advanced:CorporateActionHandler',
  nettingAgreement: 'Dualis.SecLending.Advanced:NettingAgreement',
  verifiedInstitution: 'Dualis.Institutional.Core:VerifiedInstitution',
  institutionalPool: 'Dualis.Institutional.Core:InstitutionalPool',
  bulkOperation: 'Dualis.Institutional.Core:BulkOperation',
  privacyConfig: 'Dualis.Privacy.Config:PrivacyConfig',
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

// ---------------------------------------------------------------------------
// Credit Attestation commands
// ---------------------------------------------------------------------------

/** Build a command to add an attestation to an attestation bundle. */
export function buildAddAttestationCommand(
  bundleContractId: string,
  attestation: Record<string, unknown>,
): CantonCommand {
  return {
    templateId: TEMPLATES.creditAttestationBundle,
    choice: 'AddAttestation',
    contractId: bundleContractId,
    argument: { attestation },
  };
}

/** Build a command to prune expired attestations from a bundle. */
export function buildPruneExpiredCommand(
  bundleContractId: string,
  currentTime: string,
): CantonCommand {
  return {
    templateId: TEMPLATES.creditAttestationBundle,
    choice: 'PruneExpired',
    contractId: bundleContractId,
    argument: { currentTime },
  };
}

// ---------------------------------------------------------------------------
// Composite Score commands
// ---------------------------------------------------------------------------

/** Build a command to recalculate a composite credit score. */
export function buildRecalculateCompositeCommand(
  creditContractId: string,
  onChain: Record<string, unknown>,
  offChain: Record<string, unknown>,
  ecosystem: Record<string, unknown>,
  calculationTime: string,
): CantonCommand {
  return {
    templateId: TEMPLATES.compositeCredit,
    choice: 'RecalculateComposite',
    contractId: creditContractId,
    argument: { onChain, offChain, ecosystem, calculationTime },
  };
}

// ---------------------------------------------------------------------------
// Productive commands
// ---------------------------------------------------------------------------

/** Build a command to update a productive project's status. */
export function buildUpdateProjectStatusCommand(
  projectContractId: string,
  newStatus: string,
): CantonCommand {
  return {
    templateId: TEMPLATES.productiveProject,
    choice: 'UpdateProjectStatus',
    contractId: projectContractId,
    argument: { newStatus },
  };
}

/** Build a command to add a production attestation to a project. */
export function buildAddProductionAttestationCommand(
  projectContractId: string,
  attestationId: string,
): CantonCommand {
  return {
    templateId: TEMPLATES.productiveProject,
    choice: 'AddProductionAttestation',
    contractId: projectContractId,
    argument: { attestationId },
  };
}

/** Build a command to record a cashflow repayment on a productive borrow. */
export function buildCashflowRepaymentCommand(
  borrowContractId: string,
  entry: Record<string, unknown>,
): CantonCommand {
  return {
    templateId: TEMPLATES.productiveBorrow,
    choice: 'CashflowRepayment',
    contractId: borrowContractId,
    argument: { entry },
  };
}

/** Build a command to check project health on a productive borrow. */
export function buildCheckProjectHealthCommand(
  borrowContractId: string,
  actual: number,
  expected: number,
): CantonCommand {
  return {
    templateId: TEMPLATES.productiveBorrow,
    choice: 'CheckProjectHealth',
    contractId: borrowContractId,
    argument: { actual, expected },
  };
}

// ---------------------------------------------------------------------------
// Advanced SecLending commands
// ---------------------------------------------------------------------------

/** Build a command to accept a fraction of a fractional offer. */
export function buildAcceptFractionCommand(
  offerContractId: string,
  borrower: string,
  amount: number,
): CantonCommand {
  return {
    templateId: TEMPLATES.fractionalOffer,
    choice: 'AcceptFraction',
    contractId: offerContractId,
    argument: { borrower, amount },
  };
}

/** Build a command to process a corporate action. */
export function buildProcessCorporateActionCommand(
  handlerContractId: string,
  processingTime: string,
): CantonCommand {
  return {
    templateId: TEMPLATES.corporateActionHandler,
    choice: 'ProcessCorporateAction',
    contractId: handlerContractId,
    argument: { processingTime },
  };
}

/** Build a command to execute netting on a netting agreement. */
export function buildExecuteNettingCommand(
  nettingContractId: string,
  executionTime: string,
): CantonCommand {
  return {
    templateId: TEMPLATES.nettingAgreement,
    choice: 'ExecuteNetting',
    contractId: nettingContractId,
    argument: { executionTime },
  };
}

// ---------------------------------------------------------------------------
// Institutional commands
// ---------------------------------------------------------------------------

/** Build a command to add a sub-account to a verified institution. */
export function buildAddSubAccountCommand(
  institutionContractId: string,
  subAccountParty: string,
): CantonCommand {
  return {
    templateId: TEMPLATES.verifiedInstitution,
    choice: 'AddSubAccount',
    contractId: institutionContractId,
    argument: { subAccountParty },
  };
}

/** Build a command to renew KYB for a verified institution. */
export function buildRenewKYBCommand(
  institutionContractId: string,
  newExpiry: string,
  renewalTime: string,
): CantonCommand {
  return {
    templateId: TEMPLATES.verifiedInstitution,
    choice: 'RenewKYB',
    contractId: institutionContractId,
    argument: { newExpiry, renewalTime },
  };
}

// ---------------------------------------------------------------------------
// Privacy commands
// ---------------------------------------------------------------------------

/** Build a command to set the privacy level on a privacy config. */
export function buildSetPrivacyLevelCommand(
  configContractId: string,
  newLevel: string,
  updateTime: string,
): CantonCommand {
  return {
    templateId: TEMPLATES.privacyConfig,
    choice: 'SetPrivacyLevel',
    contractId: configContractId,
    argument: { newLevel, updateTime },
  };
}

/** Build a command to add a disclosure rule to a privacy config. */
export function buildAddDisclosureCommand(
  configContractId: string,
  rule: Record<string, unknown>,
  updateTime: string,
): CantonCommand {
  return {
    templateId: TEMPLATES.privacyConfig,
    choice: 'AddDisclosure',
    contractId: configContractId,
    argument: { rule, updateTime },
  };
}

/** Build a command to remove a disclosure rule from a privacy config. */
export function buildRemoveDisclosureCommand(
  configContractId: string,
  ruleId: string,
  updateTime: string,
): CantonCommand {
  return {
    templateId: TEMPLATES.privacyConfig,
    choice: 'RemoveDisclosure',
    contractId: configContractId,
    argument: { ruleId, updateTime },
  };
}

/** Build a command to check access on a privacy config. */
export function buildCheckAccessCommand(
  configContractId: string,
  requester: string,
  scope: string,
): CantonCommand {
  return {
    templateId: TEMPLATES.privacyConfig,
    choice: 'CheckAccess',
    contractId: configContractId,
    argument: { requester, scope },
  };
}
