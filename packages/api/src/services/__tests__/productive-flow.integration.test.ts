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

import * as productiveService from '../productive.service';

describe('Productive Lending Flow', () => {
  it('complete lifecycle: submit → list → detail → borrow → repay', () => {
    // -----------------------------------------------------------------------
    // 1. Submit a new project
    // -----------------------------------------------------------------------
    const submitResult = productiveService.submitProject('party::test::1', {
      category: 'SolarEnergy',
      metadata: {
        location: 'Ankara, TR',
        capacity: '10 MW',
        offTaker: 'National Grid Corp',
        insurancePolicy: 'POL-test-001',
        independentValue: '6000000.00',
        expectedIRR: 0.12,
        constructionPeriod: 12,
        operationalLife: 25,
        esgRating: 'A',
        iotFeedId: null,
      },
      requestedAmount: '5000000.00',
    });

    expect(submitResult.data.status).toBe('Proposed');
    expect(submitResult.data.projectId).toBeTruthy();
    expect(submitResult.data.projectId).toMatch(/^proj-/);
    expect(submitResult.data.ownerPartyId).toBe('party::test::1');
    expect(submitResult.data.category).toBe('SolarEnergy');
    expect(submitResult.data.requestedAmount).toBe('5000000.00');
    expect(submitResult.data.fundedAmount).toBe('0');
    expect(submitResult.transaction.status).toBe('confirmed');

    // -----------------------------------------------------------------------
    // 2. List projects includes the submitted one (from mock data)
    // -----------------------------------------------------------------------
    const projects = productiveService.listProjects();

    expect(projects.data.length).toBeGreaterThan(0);
    expect(projects.pagination).toHaveProperty('total');
    expect(projects.pagination).toHaveProperty('limit');
    expect(projects.pagination).toHaveProperty('offset');
    expect(projects.pagination).toHaveProperty('hasMore');

    // Filter by category to verify SolarEnergy projects exist
    const solarProjects = productiveService.listProjects({ category: 'SolarEnergy' });
    expect(solarProjects.data.length).toBeGreaterThan(0);
    solarProjects.data.forEach((p) => {
      expect(p.category).toBe('SolarEnergy');
    });

    // -----------------------------------------------------------------------
    // 3. Get existing project detail (use known mock projectId)
    // -----------------------------------------------------------------------
    const detail = productiveService.getProjectDetail('proj-001');

    expect(detail).not.toBeNull();
    expect(detail!.project.projectId).toBe('proj-001');
    expect(detail!.project.category).toBe('SolarEnergy');
    expect(detail!.project.status).toBe('Operational');
    expect(detail!.project.metadata).toHaveProperty('location');
    expect(detail!.project.metadata).toHaveProperty('capacity');
    // proj-001 is Operational, so IoT readings should be present
    expect(detail!.iotReadings.length).toBeGreaterThan(0);
    expect(detail!.iotReadings[0]).toHaveProperty('metricType');
    expect(detail!.iotReadings[0]).toHaveProperty('value');
    expect(detail!.iotReadings[0]).toHaveProperty('unit');

    // Non-existent project returns null
    const missing = productiveService.getProjectDetail('proj-does-not-exist');
    expect(missing).toBeNull();

    // -----------------------------------------------------------------------
    // 4. Request a borrow against a project
    // -----------------------------------------------------------------------
    const borrowResult = productiveService.requestProductiveBorrow({
      borrowerParty: 'party::test::1',
      projectId: 'proj-001',
      poolId: 'usdc-main',
      loanAmount: '1000000.00',
      collateral: {
        cryptoCollateral: '300000.00',
        projectAssetValue: '500000.00',
        tifaCollateral: '200000.00',
        totalValue: '1000000.00',
        cryptoRatio: 0.3,
      },
    });

    expect(borrowResult.data.status).toBe('Active');
    expect(borrowResult.data.loanAmount).toBe('1000000.00');
    expect(borrowResult.data.outstandingDebt).toBe('1000000.00');
    expect(borrowResult.data.borrowId).toMatch(/^pborrow-/);
    expect(borrowResult.data.borrowerParty).toBe('party::test::1');
    expect(borrowResult.data.projectId).toBe('proj-001');
    expect(borrowResult.data.collateral.cryptoRatio).toBe(0.3);
    // Base rate 0.07 - SolarEnergy discount 0.02 - ESG bonus A 0.01 = 0.04
    expect(borrowResult.data.interestRate).toBe(0.04);
    expect(borrowResult.data.cashflowSchedule).toEqual([]);
    expect(borrowResult.transaction.status).toBe('confirmed');

    // -----------------------------------------------------------------------
    // 5. Process cashflow repayment against known mock borrow
    // -----------------------------------------------------------------------
    const repayResult = productiveService.processCashflowRepayment('pborrow-001', {
      expectedDate: new Date().toISOString(),
      expectedAmount: '100000.00',
      actualAmount: '95000.00',
      source: 'energy_sales',
      status: 'Received',
    });

    expect(repayResult.data.borrowId).toBe('pborrow-001');
    // pborrow-001 has outstandingDebt of 6500000. After 95000 repayment: 6405000
    expect(parseFloat(repayResult.data.newOutstanding)).toBe(6405000);
    expect(parseFloat(repayResult.data.newOutstanding)).toBeLessThan(6500000);
    expect(repayResult.transaction.status).toBe('confirmed');
  });

  it('borrow lifecycle: multiple repayments reduce debt progressively', () => {
    // Request a borrow
    const borrowResult = productiveService.requestProductiveBorrow({
      borrowerParty: 'party::test-multi::1',
      projectId: 'proj-001',
      poolId: 'usdc-main',
      loanAmount: '500000.00',
      collateral: {
        cryptoCollateral: '150000.00',
        projectAssetValue: '250000.00',
        tifaCollateral: '100000.00',
        totalValue: '500000.00',
        cryptoRatio: 0.3,
      },
    });

    expect(borrowResult.data.status).toBe('Active');
    expect(borrowResult.data.outstandingDebt).toBe('500000.00');

    // Process repayment on a known mock borrow (pborrow-001 outstanding = 6500000)
    const repay1 = productiveService.processCashflowRepayment('pborrow-001', {
      expectedDate: new Date().toISOString(),
      expectedAmount: '200000.00',
      actualAmount: '200000.00',
      source: 'energy_sales',
      status: 'Received',
    });

    // 6500000 - 200000 = 6300000
    expect(parseFloat(repay1.data.newOutstanding)).toBe(6300000);

    // Overpayment that exceeds outstanding should floor at zero
    const repayOver = productiveService.processCashflowRepayment('pborrow-001', {
      expectedDate: new Date().toISOString(),
      expectedAmount: '99999999.00',
      actualAmount: '99999999.00',
      source: 'energy_sales',
      status: 'Received',
    });

    expect(parseFloat(repayOver.data.newOutstanding)).toBe(0);
  });

  it('project filters narrow results correctly', () => {
    const allProjects = productiveService.listProjects();
    const windOnly = productiveService.listProjects({ category: 'WindEnergy' });
    const operationalOnly = productiveService.listProjects({ status: 'Operational' });

    // Filtered results should be a subset of all results
    expect(windOnly.data.length).toBeLessThanOrEqual(allProjects.data.length);
    expect(operationalOnly.data.length).toBeLessThanOrEqual(allProjects.data.length);

    windOnly.data.forEach((p) => expect(p.category).toBe('WindEnergy'));
    operationalOnly.data.forEach((p) => expect(p.status).toBe('Operational'));
  });

  it('borrows can be listed and filtered by party', () => {
    const allBorrows = productiveService.getBorrows();
    expect(allBorrows.length).toBeGreaterThan(0);

    const aliceBorrows = productiveService.getBorrows('party::alice::1');
    expect(aliceBorrows.length).toBeGreaterThan(0);
    expect(aliceBorrows.length).toBeLessThanOrEqual(allBorrows.length);
    aliceBorrows.forEach((b) => {
      expect(b.borrowerParty).toBe('party::alice::1');
    });
  });

  it('IoT readings scale with period', () => {
    const readings1d = productiveService.getIoTReadings('proj-001', '1d');
    const readings7d = productiveService.getIoTReadings('proj-001', '7d');
    const readings30d = productiveService.getIoTReadings('proj-001', '30d');

    expect(readings1d.length).toBeGreaterThan(0);
    expect(readings7d.length).toBeGreaterThan(readings1d.length);
    expect(readings30d.length).toBeGreaterThan(readings7d.length);

    // All readings should reference the correct project
    readings7d.forEach((r) => {
      expect(r.projectId).toBe('proj-001');
      expect(r).toHaveProperty('metricType');
      expect(r).toHaveProperty('value');
      expect(r).toHaveProperty('unit');
      expect(r).toHaveProperty('timestamp');
    });
  });
});
