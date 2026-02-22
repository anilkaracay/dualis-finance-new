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

import {
  submitProject,
  listProjects,
  getProjectDetail,
  requestProductiveBorrow,
  processCashflowRepayment,
  getIoTReadings,
  getBorrows,
} from '../productive.service';

describe('submitProject', () => {
  it('creates with Proposed status', () => {
    const result = submitProject('party::test-submit::1', {
      category: 'SolarEnergy',
      metadata: {
        location: 'Istanbul, TR',
        capacity: '10 MW',
        esgRating: 'A',
      },
      requestedAmount: '5000000.00',
    });

    expect(result.data.status).toBe('Proposed');
    expect(result.data.category).toBe('SolarEnergy');
    expect(result.data.ownerPartyId).toBe('party::test-submit::1');
    expect(result.data.requestedAmount).toBe('5000000.00');
    expect(result.data.fundedAmount).toBe('0');
    expect(result.transaction).toHaveProperty('id');
    expect(result.transaction.status).toBe('confirmed');
  });

  it('generates unique projectId', () => {
    const first = submitProject('party::test-unique::1', {
      category: 'WindEnergy',
      metadata: { location: 'Izmir, TR' },
      requestedAmount: '3000000.00',
    });

    const second = submitProject('party::test-unique::1', {
      category: 'DataCenter',
      metadata: { location: 'Frankfurt, DE' },
      requestedAmount: '8000000.00',
    });

    expect(first.data.projectId).toMatch(/^proj-/);
    expect(second.data.projectId).toMatch(/^proj-/);
    expect(first.data.projectId).not.toBe(second.data.projectId);
  });
});

describe('listProjects', () => {
  it('returns all projects', () => {
    const result = listProjects();

    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.pagination).toHaveProperty('total');
    expect(result.pagination).toHaveProperty('limit');
    expect(result.pagination).toHaveProperty('offset');
    expect(result.pagination).toHaveProperty('hasMore');
  });

  it('filters by category', () => {
    const result = listProjects({ category: 'SolarEnergy' });

    expect(result.data.length).toBeGreaterThan(0);
    result.data.forEach((project) => {
      expect(project.category).toBe('SolarEnergy');
    });
  });

  it('filters by status', () => {
    const result = listProjects({ status: 'Operational' });

    expect(result.data.length).toBeGreaterThan(0);
    result.data.forEach((project) => {
      expect(project.status).toBe('Operational');
    });
  });
});

describe('getProjectDetail', () => {
  it('returns project and IoT readings', () => {
    const detail = getProjectDetail('proj-001');

    expect(detail).not.toBeNull();
    if (detail) {
      expect(detail.project).toHaveProperty('projectId', 'proj-001');
      expect(detail.project).toHaveProperty('category');
      expect(detail.project).toHaveProperty('status');
      expect(detail.project).toHaveProperty('metadata');
      expect(Array.isArray(detail.iotReadings)).toBe(true);
      // proj-001 is Operational, so it should have IoT readings
      expect(detail.iotReadings.length).toBeGreaterThan(0);
    }
  });

  it('returns null for non-existent project', () => {
    const detail = getProjectDetail('proj-non-existent');
    expect(detail).toBeNull();
  });
});

describe('requestProductiveBorrow', () => {
  it('calculates interest rate with category discount', () => {
    const result = requestProductiveBorrow({
      borrowerParty: 'party::test-borrow::1',
      projectId: 'proj-001', // SolarEnergy category, discount = 0.02
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

    expect(result.data).toHaveProperty('borrowId');
    expect(result.data.borrowId).toMatch(/^pborrow-/);
    expect(result.data.status).toBe('Active');
    expect(result.data.loanAmount).toBe('1000000.00');
    expect(result.data.outstandingDebt).toBe('1000000.00');
    // Base rate 0.07 - SolarEnergy discount 0.02 - ESG bonus (A = 0.01) = 0.04
    expect(result.data.interestRate).toBe(0.04);
    expect(result.transaction.status).toBe('confirmed');
  });

  it('applies ESG bonus to rate', () => {
    // proj-001 has esgRating 'A' (bonus = 0.01)
    const resultA = requestProductiveBorrow({
      borrowerParty: 'party::test-esg-a::1',
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

    // proj-005 has esgRating 'C' (bonus = 0)
    const resultC = requestProductiveBorrow({
      borrowerParty: 'party::test-esg-c::1',
      projectId: 'proj-005',
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

    // ESG 'A' should have a lower rate than ESG 'C'
    expect(resultA.data.interestRate).toBeLessThan(resultC.data.interestRate);
  });
});

describe('processCashflowRepayment', () => {
  it('reduces outstanding debt', () => {
    const result = processCashflowRepayment('pborrow-001', {
      expectedDate: new Date().toISOString(),
      expectedAmount: '100000.00',
      actualAmount: '100000.00',
      source: 'energy_sales',
      status: 'Received',
    });

    expect(result.data).toHaveProperty('borrowId', 'pborrow-001');
    expect(result.data).toHaveProperty('newOutstanding');
    // pborrow-001 has outstanding 6500000, minus 100000 = 6400000
    expect(parseFloat(result.data.newOutstanding)).toBe(6400000);
    expect(result.transaction.status).toBe('confirmed');
  });

  it('returns zero when fully repaid', () => {
    const result = processCashflowRepayment('pborrow-001', {
      expectedDate: new Date().toISOString(),
      expectedAmount: '99999999.00',
      actualAmount: '99999999.00',
      source: 'energy_sales',
      status: 'Received',
    });

    expect(parseFloat(result.data.newOutstanding)).toBe(0);
  });
});

describe('getIoTReadings', () => {
  it('returns readings for different periods', () => {
    const readings1d = getIoTReadings('proj-001', '1d');
    const readings7d = getIoTReadings('proj-001', '7d');
    const readings30d = getIoTReadings('proj-001', '30d');

    expect(readings1d.length).toBeGreaterThan(0);
    expect(readings7d.length).toBeGreaterThan(readings1d.length);
    expect(readings30d.length).toBeGreaterThan(readings7d.length);

    // Verify reading structure
    const reading = readings1d[0];
    expect(reading).toBeDefined();
    if (reading) {
      expect(reading).toHaveProperty('projectId', 'proj-001');
      expect(reading).toHaveProperty('metricType');
      expect(reading).toHaveProperty('value');
      expect(reading).toHaveProperty('unit');
      expect(reading).toHaveProperty('timestamp');
    }
  });
});

describe('getBorrows', () => {
  it('returns all borrows', () => {
    const result = getBorrows();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    const borrow = result[0];
    expect(borrow).toBeDefined();
    if (borrow) {
      expect(borrow).toHaveProperty('borrowId');
      expect(borrow).toHaveProperty('borrowerParty');
      expect(borrow).toHaveProperty('projectId');
      expect(borrow).toHaveProperty('loanAmount');
      expect(borrow).toHaveProperty('outstandingDebt');
      expect(borrow).toHaveProperty('interestRate');
    }
  });

  it('filters by partyId', () => {
    const aliceBorrows = getBorrows('party::alice::1');

    expect(aliceBorrows.length).toBeGreaterThan(0);
    aliceBorrows.forEach((borrow) => {
      expect(borrow.borrowerParty).toBe('party::alice::1');
    });

    // Compare with all borrows — filtered should be a subset
    const allBorrows = getBorrows();
    expect(aliceBorrows.length).toBeLessThanOrEqual(allBorrows.length);
  });
});
