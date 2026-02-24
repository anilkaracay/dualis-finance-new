import { describe, it, expect } from 'vitest';
import {
  buildDepositCommand,
  buildWithdrawCommand,
  buildBorrowCommand,
  buildRepayCommand,
  buildAddCollateralCommand,
  buildCreateOfferCommand,
  buildAcceptOfferCommand,
  buildRecallCommand,
  buildReturnCommand,
  buildVoteCommand,
  buildFlashLoanCommand,
  buildEmergencyPauseCommand,
  buildResumeCommand,
  buildAddAttestationCommand,
  buildPruneExpiredCommand,
  buildRecalculateCompositeCommand,
  buildUpdateProjectStatusCommand,
  buildAddProductionAttestationCommand,
  buildCashflowRepaymentCommand,
  buildCheckProjectHealthCommand,
  buildAcceptFractionCommand,
  buildProcessCorporateActionCommand,
  buildExecuteNettingCommand,
  buildAddSubAccountCommand,
  buildRenewKYBCommand,
  buildSetPrivacyLevelCommand,
  buildAddDisclosureCommand,
  buildRemoveDisclosureCommand,
  buildCheckAccessCommand,
} from '../commands';

describe('Canton Command Builders', () => {
  describe('Lending Commands', () => {
    it('buildDepositCommand returns correct templateId and payload', () => {
      const cmd = buildDepositCommand('contract-1', 'party::alice', '5000');
      expect(cmd.templateId).toBe('Dualis.LendingPool:LendingPool');
      expect(cmd.choice).toBe('Deposit');
      expect(cmd.contractId).toBe('contract-1');
      expect(cmd.argument).toEqual({ depositor: 'party::alice', amount: '5000' });
    });

    it('buildWithdrawCommand returns correct choice and argument', () => {
      const cmd = buildWithdrawCommand('contract-1', 'party::alice', '100');
      expect(cmd.choice).toBe('Withdraw');
      expect(cmd.argument).toEqual({ depositor: 'party::alice', shares: '100' });
    });

    it('buildBorrowCommand includes collateral assets', () => {
      const collateral = [{ symbol: 'ETH', amount: '10' }];
      const cmd = buildBorrowCommand('contract-1', 'party::bob', '5000', collateral);
      expect(cmd.choice).toBe('Borrow');
      expect(cmd.argument).toEqual({
        borrower: 'party::bob',
        amount: '5000',
        collateralAssets: collateral,
      });
    });

    it('buildRepayCommand targets BorrowPosition template', () => {
      const cmd = buildRepayCommand('borrow-contract-1', 'party::bob', '2000');
      expect(cmd.templateId).toBe('Dualis.LendingPool:BorrowPosition');
      expect(cmd.choice).toBe('Repay');
      expect(cmd.argument).toEqual({ borrower: 'party::bob', amount: '2000' });
    });

    it('buildAddCollateralCommand targets CollateralPosition template', () => {
      const cmd = buildAddCollateralCommand('collateral-1', 'party::bob', { symbol: 'ETH', amount: '5' });
      expect(cmd.templateId).toBe('Dualis.LendingPool:CollateralPosition');
      expect(cmd.choice).toBe('AddCollateral');
      expect(cmd.argument.asset).toEqual({ symbol: 'ETH', amount: '5' });
    });
  });

  describe('Securities Lending Commands', () => {
    it('buildCreateOfferCommand includes fee and collateral schedule', () => {
      const cmd = buildCreateOfferCommand(
        'party::lender', { symbol: 'GOOG', amount: '1000' },
        'fixed', 0.30, ['cash'], 105, 7, 90, true, 3,
      );
      expect(cmd.templateId).toBe('Dualis.SecLending:SecLendingOffer');
      expect(cmd.choice).toBe('CreateOffer');
      expect(cmd.argument.lender).toBe('party::lender');
      expect(cmd.argument.feeStructure).toEqual({ type: 'fixed', value: 0.30 });
      expect(cmd.argument.collateralSchedule.acceptedCollateralTypes).toEqual(['cash']);
      expect(cmd.argument.isRecallable).toBe(true);
    });

    it('buildAcceptOfferCommand includes borrower and duration', () => {
      const cmd = buildAcceptOfferCommand(
        'offer-contract-1', 'party::borrower',
        [{ symbol: 'USDC', amount: '50000' }], 30,
      );
      expect(cmd.choice).toBe('AcceptOffer');
      expect(cmd.argument.borrower).toBe('party::borrower');
      expect(cmd.argument.requestedDuration).toBe(30);
    });

    it('buildRecallCommand targets SecLendingDeal template', () => {
      const cmd = buildRecallCommand('deal-contract-1', 'party::lender');
      expect(cmd.templateId).toBe('Dualis.SecLending:SecLendingDeal');
      expect(cmd.choice).toBe('Recall');
    });

    it('buildReturnCommand targets SecLendingDeal template', () => {
      const cmd = buildReturnCommand('deal-contract-1', 'party::borrower');
      expect(cmd.choice).toBe('Return');
      expect(cmd.argument.borrower).toBe('party::borrower');
    });
  });

  describe('Governance Commands', () => {
    it('buildVoteCommand includes voter and weight', () => {
      const cmd = buildVoteCommand('proposal-contract-1', 'party::voter', 'for', '1000000');
      expect(cmd.templateId).toBe('Dualis.Governance:Proposal');
      expect(cmd.choice).toBe('CastVote');
      expect(cmd.argument).toEqual({
        voter: 'party::voter',
        vote: 'for',
        weight: '1000000',
      });
    });
  });

  describe('Flash Loan Commands', () => {
    it('buildFlashLoanCommand includes callback data', () => {
      const callbacks = { operations: [{ type: 'swap', from: 'ETH', to: 'USDC' }] };
      const cmd = buildFlashLoanCommand('pool-contract-1', 'party::arb', '1000000', callbacks);
      expect(cmd.templateId).toBe('Dualis.FlashLoan:FlashLoan');
      expect(cmd.choice).toBe('ExecuteFlashLoan');
      expect(cmd.argument.callbackData).toBe(callbacks);
    });
  });

  describe('Admin / Emergency Commands', () => {
    it('buildEmergencyPauseCommand includes reason', () => {
      const cmd = buildEmergencyPauseCommand('config-1', 'party::admin', 'Security incident');
      expect(cmd.templateId).toBe('Dualis.Protocol:ProtocolConfig');
      expect(cmd.choice).toBe('EmergencyPause');
      expect(cmd.argument.reason).toBe('Security incident');
    });

    it('buildResumeCommand targets ProtocolConfig', () => {
      const cmd = buildResumeCommand('config-1', 'party::admin');
      expect(cmd.choice).toBe('Resume');
      expect(cmd.argument.operator).toBe('party::admin');
    });
  });

  describe('Credit Attestation Commands', () => {
    it('buildAddAttestationCommand includes attestation object', () => {
      const attestation = { provider: 'Chainlink', score: 85 };
      const cmd = buildAddAttestationCommand('bundle-1', attestation);
      expect(cmd.templateId).toBe('Dualis.Credit.Attestation:CreditAttestationBundle');
      expect(cmd.choice).toBe('AddAttestation');
      expect(cmd.argument.attestation).toBe(attestation);
    });

    it('buildPruneExpiredCommand includes currentTime', () => {
      const cmd = buildPruneExpiredCommand('bundle-1', '2026-01-01T00:00:00Z');
      expect(cmd.choice).toBe('PruneExpired');
      expect(cmd.argument.currentTime).toBe('2026-01-01T00:00:00Z');
    });
  });

  describe('Composite Score Commands', () => {
    it('buildRecalculateCompositeCommand includes all breakdowns', () => {
      const cmd = buildRecalculateCompositeCommand(
        'credit-1',
        { repayment: 95 },
        { bureau: 720 },
        { staking: 60 },
        '2026-01-01T00:00:00Z',
      );
      expect(cmd.templateId).toBe('Dualis.Credit.CompositeScore:CompositeCredit');
      expect(cmd.choice).toBe('RecalculateComposite');
      expect(cmd.argument.onChain).toEqual({ repayment: 95 });
      expect(cmd.argument.offChain).toEqual({ bureau: 720 });
      expect(cmd.argument.ecosystem).toEqual({ staking: 60 });
    });
  });

  describe('Productive Commands', () => {
    it('buildUpdateProjectStatusCommand includes new status', () => {
      const cmd = buildUpdateProjectStatusCommand('project-1', 'Active');
      expect(cmd.templateId).toBe('Dualis.Productive.Core:ProductiveProject');
      expect(cmd.choice).toBe('UpdateProjectStatus');
      expect(cmd.argument.newStatus).toBe('Active');
    });

    it('buildAddProductionAttestationCommand includes attestation ID', () => {
      const cmd = buildAddProductionAttestationCommand('project-1', 'att-001');
      expect(cmd.choice).toBe('AddProductionAttestation');
      expect(cmd.argument.attestationId).toBe('att-001');
    });

    it('buildCashflowRepaymentCommand includes entry', () => {
      const entry = { amount: '50000', period: 'Q1-2026' };
      const cmd = buildCashflowRepaymentCommand('borrow-1', entry);
      expect(cmd.templateId).toBe('Dualis.Productive.Core:ProductiveBorrow');
      expect(cmd.choice).toBe('CashflowRepayment');
      expect(cmd.argument.entry).toBe(entry);
    });

    it('buildCheckProjectHealthCommand includes actual and expected', () => {
      const cmd = buildCheckProjectHealthCommand('borrow-1', 80, 100);
      expect(cmd.choice).toBe('CheckProjectHealth');
      expect(cmd.argument).toEqual({ actual: 80, expected: 100 });
    });
  });

  describe('Advanced SecLending Commands', () => {
    it('buildAcceptFractionCommand includes borrower and amount', () => {
      const cmd = buildAcceptFractionCommand('frac-offer-1', 'party::borrower', 500);
      expect(cmd.templateId).toBe('Dualis.SecLending.Advanced:FractionalOffer');
      expect(cmd.choice).toBe('AcceptFraction');
      expect(cmd.argument).toEqual({ borrower: 'party::borrower', amount: 500 });
    });

    it('buildProcessCorporateActionCommand includes processing time', () => {
      const cmd = buildProcessCorporateActionCommand('handler-1', '2026-06-15T00:00:00Z');
      expect(cmd.templateId).toBe('Dualis.SecLending.Advanced:CorporateActionHandler');
      expect(cmd.choice).toBe('ProcessCorporateAction');
    });

    it('buildExecuteNettingCommand targets NettingAgreement', () => {
      const cmd = buildExecuteNettingCommand('netting-1', '2026-06-15T00:00:00Z');
      expect(cmd.templateId).toBe('Dualis.SecLending.Advanced:NettingAgreement');
      expect(cmd.choice).toBe('ExecuteNetting');
    });
  });

  describe('Institutional Commands', () => {
    it('buildAddSubAccountCommand includes sub-account party', () => {
      const cmd = buildAddSubAccountCommand('inst-1', 'party::sub-03');
      expect(cmd.templateId).toBe('Dualis.Institutional.Core:VerifiedInstitution');
      expect(cmd.choice).toBe('AddSubAccount');
      expect(cmd.argument.subAccountParty).toBe('party::sub-03');
    });

    it('buildRenewKYBCommand includes new expiry and renewal time', () => {
      const cmd = buildRenewKYBCommand('inst-1', '2027-01-01T00:00:00Z', '2026-01-01T00:00:00Z');
      expect(cmd.choice).toBe('RenewKYB');
      expect(cmd.argument.newExpiry).toBe('2027-01-01T00:00:00Z');
      expect(cmd.argument.renewalTime).toBe('2026-01-01T00:00:00Z');
    });
  });

  describe('Privacy Commands', () => {
    it('buildSetPrivacyLevelCommand includes new level and update time', () => {
      const cmd = buildSetPrivacyLevelCommand('config-1', 'Selective', '2026-01-01T00:00:00Z');
      expect(cmd.templateId).toBe('Dualis.Privacy.Config:PrivacyConfig');
      expect(cmd.choice).toBe('SetPrivacyLevel');
      expect(cmd.argument.newLevel).toBe('Selective');
    });

    it('buildAddDisclosureCommand includes rule and update time', () => {
      const rule = { counterparty: 'party::auditor', scope: 'CreditScore' };
      const cmd = buildAddDisclosureCommand('config-1', rule, '2026-01-01T00:00:00Z');
      expect(cmd.choice).toBe('AddDisclosure');
      expect(cmd.argument.rule).toBe(rule);
    });

    it('buildRemoveDisclosureCommand includes rule ID', () => {
      const cmd = buildRemoveDisclosureCommand('config-1', 'rule-01', '2026-01-01T00:00:00Z');
      expect(cmd.choice).toBe('RemoveDisclosure');
      expect(cmd.argument.ruleId).toBe('rule-01');
    });

    it('buildCheckAccessCommand includes requester and scope', () => {
      const cmd = buildCheckAccessCommand('config-1', 'party::auditor', 'CreditScore');
      expect(cmd.choice).toBe('CheckAccess');
      expect(cmd.argument).toEqual({
        requester: 'party::auditor',
        scope: 'CreditScore',
      });
    });
  });
});
