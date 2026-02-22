import { describe, it, expect, vi } from 'vitest';

// Mock the logger before importing the service
vi.mock('../../config/logger.js', () => ({
  createChildLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import * as institutionalService from '../institutional.service';

describe('Institutional Onboarding Flow', () => {
  it('complete lifecycle: onboard -> verify -> manage', () => {
    // -----------------------------------------------------------------------
    // 1. Start onboarding
    // -----------------------------------------------------------------------
    const onboardResult = institutionalService.startOnboarding({
      legalName: 'Integration Test Holdings AG',
      registrationNo: 'CH-FINMA-2026-TEST',
      jurisdiction: 'CH',
    });

    expect(onboardResult.data.legalName).toBe('Integration Test Holdings AG');
    expect(onboardResult.data.registrationNo).toBe('CH-FINMA-2026-TEST');
    expect(onboardResult.data.jurisdiction).toBe('CH');
    expect(onboardResult.data.institutionParty).toMatch(/^party::institution-ch-/);
    expect(onboardResult.transaction.status).toBe('confirmed');

    const partyId = onboardResult.data.institutionParty;

    // -----------------------------------------------------------------------
    // 2. Check initial status is Pending
    // -----------------------------------------------------------------------
    expect(onboardResult.data.kybStatus).toBe('Pending');
    expect(onboardResult.data.kybLevel).toBe('Basic');
    expect(onboardResult.data.verifiedAt).toBeNull();
    expect(onboardResult.data.expiresAt).toBeNull();
    expect(onboardResult.data.subAccounts).toEqual([]);
    expect(onboardResult.data.riskProfile.riskCategory).toBe('medium');
    expect(onboardResult.data.riskProfile.allowedProducts).toContain('lending');

    // -----------------------------------------------------------------------
    // 3. Get institution data via getInstitutionStatus
    // -----------------------------------------------------------------------
    const statusCheck = institutionalService.getInstitutionStatus(partyId);

    expect(statusCheck).not.toBeNull();
    expect(statusCheck!.institutionParty).toBe(partyId);
    expect(statusCheck!.legalName).toBe('Integration Test Holdings AG');
    expect(statusCheck!.kybStatus).toBe('Pending');

    // Non-existent institution returns null
    const missing = institutionalService.getInstitutionStatus('party::does-not-exist');
    expect(missing).toBeNull();

    // -----------------------------------------------------------------------
    // 4. Submit KYB documents (transitions to InReview)
    // -----------------------------------------------------------------------
    const kybSubmitResult = institutionalService.submitKYB(partyId, {
      registrationCertificate: 'cert-data-base64',
      articlesOfAssociation: 'articles-data-base64',
      beneficialOwnership: 'ubo-data-base64',
    });

    expect(kybSubmitResult.data.status).toBe('InReview');
    expect(kybSubmitResult.transaction.status).toBe('confirmed');

    // Verify status is now InReview
    const afterSubmit = institutionalService.getInstitutionStatus(partyId);
    expect(afterSubmit!.kybStatus).toBe('InReview');

    // -----------------------------------------------------------------------
    // 5. Verify KYB (approve with Full level)
    // -----------------------------------------------------------------------
    const kybVerifyResult = institutionalService.verifyKYB(partyId, {
      approved: true,
      level: 'Full',
    });

    expect(kybVerifyResult.data.status).toBe('Verified');
    expect(kybVerifyResult.transaction.status).toBe('confirmed');

    // Check status is now Verified
    const afterVerify = institutionalService.getInstitutionStatus(partyId);
    expect(afterVerify!.kybStatus).toBe('Verified');
    expect(afterVerify!.kybLevel).toBe('Full');
    expect(afterVerify!.verifiedAt).toBeTruthy();
    expect(afterVerify!.expiresAt).toBeTruthy();

    // Verify expiration is ~1 year in the future
    const expiresAt = new Date(afterVerify!.expiresAt!);
    const now = new Date();
    const diffDays = (expiresAt.getTime() - now.getTime()) / 86_400_000;
    expect(diffDays).toBeGreaterThan(360);
    expect(diffDays).toBeLessThanOrEqual(366);

    // -----------------------------------------------------------------------
    // 6. Create API key
    // -----------------------------------------------------------------------
    const apiKeyResult = institutionalService.createAPIKey(
      partyId,
      'Production Trading Key',
      ['read', 'trade', 'withdraw'],
    );

    expect(apiKeyResult.data.key).toMatch(/^dsk_/);
    expect(apiKeyResult.data.keyId).toMatch(/^key-/);
    expect(apiKeyResult.data.keyPrefix).toBeTruthy();
    expect(apiKeyResult.data.keyPrefix.length).toBeGreaterThan(0);
    expect(apiKeyResult.transaction.status).toBe('confirmed');

    // Create a second API key
    const apiKey2Result = institutionalService.createAPIKey(
      partyId,
      'Read-Only Key',
      ['read'],
    );

    expect(apiKey2Result.data.key).toMatch(/^dsk_/);
    expect(apiKey2Result.data.keyId).not.toBe(apiKeyResult.data.keyId);

    // -----------------------------------------------------------------------
    // 7. Add sub-account
    // -----------------------------------------------------------------------
    const subAccountResult = institutionalService.createSubAccount(partyId, {
      name: 'Trading Desk Alpha',
    });

    expect(subAccountResult.data.subAccountId).toMatch(/^party::sub-/);
    expect(subAccountResult.data.parentParty).toBe(partyId);
    expect(subAccountResult.transaction.status).toBe('confirmed');

    // Verify sub-account was added to the institution
    const afterSubAccount = institutionalService.getInstitutionStatus(partyId);
    expect(afterSubAccount!.subAccounts).toContain(subAccountResult.data.subAccountId);
    expect(afterSubAccount!.subAccounts.length).toBe(1);

    // Add a second sub-account
    const subAccount2 = institutionalService.createSubAccount(partyId, {
      name: 'Trading Desk Beta',
    });

    const afterSecondSub = institutionalService.getInstitutionStatus(partyId);
    expect(afterSecondSub!.subAccounts.length).toBe(2);
    expect(afterSecondSub!.subAccounts).toContain(subAccount2.data.subAccountId);

    // -----------------------------------------------------------------------
    // 8. Revoke an API key
    // -----------------------------------------------------------------------
    const revokeResult = institutionalService.revokeAPIKey(partyId, apiKeyResult.data.keyId);

    expect(revokeResult.data.revoked).toBe(true);
    expect(revokeResult.transaction.status).toBe('confirmed');
  });

  it('KYB rejection flow: onboard -> submit -> reject', () => {
    const onboardResult = institutionalService.startOnboarding({
      legalName: 'Rejected Corp LLC',
      registrationNo: 'US-SEC-2026-REJECT',
      jurisdiction: 'US',
    });

    const partyId = onboardResult.data.institutionParty;
    expect(onboardResult.data.kybStatus).toBe('Pending');

    // Submit KYB
    institutionalService.submitKYB(partyId, { documents: 'incomplete' });

    const afterSubmit = institutionalService.getInstitutionStatus(partyId);
    expect(afterSubmit!.kybStatus).toBe('InReview');

    // Reject KYB
    const rejectResult = institutionalService.verifyKYB(partyId, {
      approved: false,
      level: 'Basic',
    });

    expect(rejectResult.data.status).toBe('Rejected');

    const afterReject = institutionalService.getInstitutionStatus(partyId);
    expect(afterReject!.kybStatus).toBe('Rejected');
    expect(afterReject!.verifiedAt).toBeNull();
    expect(afterReject!.expiresAt).toBeNull();
  });

  it('risk report and compliance export for verified institution', () => {
    // Use a pre-existing verified institution from mock data
    const partyId = 'party::institution-tr-001';

    // Verify the institution is already verified
    const status = institutionalService.getInstitutionStatus(partyId);
    expect(status).not.toBeNull();
    expect(status!.kybStatus).toBe('Verified');

    // Get risk report
    const riskReport = institutionalService.getRiskReport(partyId);

    expect(riskReport.institution).toBe(partyId);
    expect(riskReport).toHaveProperty('totalExposure');
    expect(riskReport).toHaveProperty('positionCount');
    expect(riskReport).toHaveProperty('avgHealthFactor');
    expect(riskReport).toHaveProperty('riskCategory');
    expect(riskReport).toHaveProperty('concentrationRisk');
    expect(riskReport.avgHealthFactor).toBeGreaterThan(1);
    expect(riskReport.positionCount).toBeGreaterThan(0);

    // Export compliance as CSV
    const csvExport = institutionalService.exportCompliance(partyId, 'csv');
    expect(csvExport.contentType).toBe('text/csv');
    expect(csvExport.data).toContain('date,type,amount,pool,status');

    // Export compliance as XML
    const xmlExport = institutionalService.exportCompliance(partyId, 'xml');
    expect(xmlExport.contentType).toBe('application/xml');
    expect(xmlExport.data).toContain('<compliance>');
    expect(xmlExport.data).toContain(partyId);
  });

  it('fee schedule retrieval', () => {
    // Pre-existing institution with a fee schedule
    const feeSchedule = institutionalService.getFeeSchedule('party::institution-tr-001');

    expect(feeSchedule).toHaveProperty('tiers');
    expect(Array.isArray(feeSchedule.tiers)).toBe(true);
    expect(feeSchedule.tiers.length).toBeGreaterThan(0);

    // Fees should have volume-based tiers
    feeSchedule.tiers.forEach((tier) => {
      expect(tier).toHaveProperty('volumeThreshold');
      expect(tier).toHaveProperty('feeRate');
      expect(tier.feeRate).toBeGreaterThan(0);
    });

    // Higher volume tiers should have lower fees
    if (feeSchedule.tiers.length > 1) {
      const firstTier = feeSchedule.tiers[0]!;
      const lastTier = feeSchedule.tiers[feeSchedule.tiers.length - 1]!;
      expect(lastTier.feeRate).toBeLessThan(firstTier.feeRate);
    }

    // Default fee schedule for unknown institution
    const defaultFee = institutionalService.getFeeSchedule('party::unknown');
    expect(defaultFee.tiers.length).toBe(1);
    expect(defaultFee.tiers[0]!.feeRate).toBe(0.001);
  });

  it('listInstitutions returns all registered institutions', () => {
    const institutions = institutionalService.listInstitutions();

    expect(Array.isArray(institutions)).toBe(true);
    // Should include at least the pre-populated mock institutions
    expect(institutions.length).toBeGreaterThanOrEqual(3);

    // Verify structure
    const first = institutions[0]!;
    expect(first).toHaveProperty('institutionParty');
    expect(first).toHaveProperty('legalName');
    expect(first).toHaveProperty('registrationNo');
    expect(first).toHaveProperty('jurisdiction');
    expect(first).toHaveProperty('kybStatus');
    expect(first).toHaveProperty('kybLevel');
    expect(first).toHaveProperty('riskProfile');
    expect(first).toHaveProperty('subAccounts');
  });

  it('bulk deposit operations', () => {
    const partyId = 'party::institution-tr-001';

    const bulkResult = institutionalService.executeBulkDeposit(partyId, [
      { opType: 'deposit' as const, poolId: 'usdc-main', amount: '1000000.00' },
      { opType: 'deposit' as const, poolId: 'eth-main', amount: '500000.00' },
      { opType: 'deposit' as const, poolId: 'tbill-short', amount: '2000000.00' },
    ]);

    expect(bulkResult.opId).toMatch(/^bulk-/);
    expect(bulkResult.operations.length).toBe(3);
    expect(bulkResult.results.length).toBe(3);
    expect(['Completed', 'PartialFail']).toContain(bulkResult.status);
    expect(bulkResult).toHaveProperty('submittedAt');

    // Each result has the expected structure
    bulkResult.results.forEach((result, index) => {
      expect(result.index).toBe(index);
      expect(typeof result.success).toBe('boolean');
      expect(result).toHaveProperty('transactionId');
    });
  });
});
