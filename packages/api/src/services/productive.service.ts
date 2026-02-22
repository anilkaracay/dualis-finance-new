import { createChildLogger } from '../config/logger.js';
import { randomUUID } from 'node:crypto';
import type {
  ProductiveProject,
  ProductiveBorrow,
  ProductivePool,
  IoTReading,
  CashflowEntry,
  HybridCollateral,
  ProjectCategory,
  ProjectStatus,
  TransactionMeta,
  Pagination,
} from '@dualis/shared';
import { PRODUCTIVE_RATE_DISCOUNTS, ESG_BONUSES } from '@dualis/shared';

const log = createChildLogger('productive-service');

function buildTransactionMeta(): TransactionMeta {
  return {
    id: `tx-${randomUUID()}`,
    status: 'confirmed',
    timestamp: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_PROJECTS: ProductiveProject[] = [
  {
    projectId: 'proj-001',
    ownerPartyId: 'party::alice::1',
    category: 'SolarEnergy',
    status: 'Operational',
    metadata: {
      location: 'Istanbul, TR',
      capacity: '25 MW',
      offTaker: 'National Grid Corp',
      insurancePolicy: 'POL-a1b2c3',
      independentValue: '12500000.00',
      expectedIRR: 0.142,
      constructionPeriod: 12,
      operationalLife: 25,
      esgRating: 'A',
      iotFeedId: 'iot-feed-1',
    },
    attestations: ['att-proj-001'],
    requestedAmount: '10000000.00',
    fundedAmount: '10000000.00',
    createdAt: '2025-06-15T08:00:00.000Z',
  },
  {
    projectId: 'proj-002',
    ownerPartyId: 'party::bob::2',
    category: 'SolarEnergy',
    status: 'InConstruction',
    metadata: {
      location: 'Antalya, TR',
      capacity: '15 MW',
      offTaker: 'National Grid Corp',
      insurancePolicy: 'POL-d4e5f6',
      independentValue: '8000000.00',
      expectedIRR: 0.128,
      constructionPeriod: 18,
      operationalLife: 25,
      esgRating: 'A',
      iotFeedId: 'iot-feed-2',
    },
    attestations: ['att-proj-002'],
    requestedAmount: '7000000.00',
    fundedAmount: '7000000.00',
    createdAt: '2025-09-01T10:00:00.000Z',
  },
  {
    projectId: 'proj-003',
    ownerPartyId: 'party::carol::3',
    category: 'WindEnergy',
    status: 'Funded',
    metadata: {
      location: 'Izmir, TR',
      capacity: '40 MW',
      offTaker: null,
      insurancePolicy: 'POL-g7h8i9',
      independentValue: '22000000.00',
      expectedIRR: 0.156,
      constructionPeriod: 24,
      operationalLife: 20,
      esgRating: 'B',
      iotFeedId: null,
    },
    attestations: ['att-proj-003'],
    requestedAmount: '18000000.00',
    fundedAmount: '18000000.00',
    createdAt: '2025-11-10T09:00:00.000Z',
  },
  {
    projectId: 'proj-004',
    ownerPartyId: 'party::dave::4',
    category: 'DataCenter',
    status: 'Approved',
    metadata: {
      location: 'Frankfurt, DE',
      capacity: null,
      offTaker: null,
      insurancePolicy: 'POL-j1k2l3',
      independentValue: '45000000.00',
      expectedIRR: 0.11,
      constructionPeriod: 18,
      operationalLife: 15,
      esgRating: 'B',
      iotFeedId: null,
    },
    attestations: ['att-proj-004'],
    requestedAmount: '35000000.00',
    fundedAmount: '0',
    createdAt: '2026-01-05T14:00:00.000Z',
  },
  {
    projectId: 'proj-005',
    ownerPartyId: 'party::eve::5',
    category: 'SupplyChain',
    status: 'Proposed',
    metadata: {
      location: 'Dubai, AE',
      capacity: null,
      offTaker: null,
      insurancePolicy: 'POL-m4n5o6',
      independentValue: '5000000.00',
      expectedIRR: 0.095,
      constructionPeriod: 6,
      operationalLife: 10,
      esgRating: 'C',
      iotFeedId: null,
    },
    attestations: [],
    requestedAmount: '3500000.00',
    fundedAmount: '0',
    createdAt: '2026-02-10T11:00:00.000Z',
  },
  {
    projectId: 'proj-006',
    ownerPartyId: 'party::alice::1',
    category: 'EquipmentLeasing',
    status: 'UnderReview',
    metadata: {
      location: 'Zurich, CH',
      capacity: null,
      offTaker: null,
      insurancePolicy: 'POL-p7q8r9',
      independentValue: '2800000.00',
      expectedIRR: 0.085,
      constructionPeriod: 3,
      operationalLife: 7,
      esgRating: 'Unrated',
      iotFeedId: null,
    },
    attestations: [],
    requestedAmount: '2000000.00',
    fundedAmount: '0',
    createdAt: '2026-02-18T16:00:00.000Z',
  },
  // Cross-referenced: SME Konya solar project (party::sme_konya_001)
  {
    projectId: 'proj-007',
    ownerPartyId: 'party::sme_konya_001',
    category: 'SolarEnergy',
    status: 'Operational',
    metadata: {
      location: 'Konya, TR',
      capacity: '500 kW',
      offTaker: 'TEDAŞ Konya',
      insurancePolicy: 'POL-konya-001',
      independentValue: '2000000.00',
      expectedIRR: 0.125,
      constructionPeriod: 6,
      operationalLife: 25,
      esgRating: 'A',
      iotFeedId: 'iot-feed-konya-1',
    },
    attestations: ['att-sme-001', 'att-sme-002'],
    requestedAmount: '1500000.00',
    fundedAmount: '1500000.00',
    createdAt: '2025-08-10T09:00:00.000Z',
  },
  // Cross-referenced: Retail user productive position (party::retail_user_001)
  {
    projectId: 'proj-008',
    ownerPartyId: 'party::retail_user_001',
    category: 'AgriInfra',
    status: 'Funded',
    metadata: {
      location: 'Bursa, TR',
      capacity: null,
      offTaker: 'Bursa Tarım A.Ş.',
      insurancePolicy: 'POL-bursa-001',
      independentValue: '850000.00',
      expectedIRR: 0.098,
      constructionPeriod: 4,
      operationalLife: 15,
      esgRating: 'B',
      iotFeedId: null,
    },
    attestations: ['att-r1-001'],
    requestedAmount: '600000.00',
    fundedAmount: '600000.00',
    createdAt: '2025-10-20T11:00:00.000Z',
  },
];

const MOCK_BORROWS: ProductiveBorrow[] = [
  {
    borrowId: 'pborrow-001',
    borrowerParty: 'party::alice::1',
    projectId: 'proj-001',
    poolId: 'usdc-main',
    loanAmount: '10000000.00',
    outstandingDebt: '6500000.00',
    interestRate: 0.052,
    collateral: {
      cryptoCollateral: '3000000.00',
      projectAssetValue: '5000000.00',
      tifaCollateral: '2000000.00',
      totalValue: '10000000.00',
      cryptoRatio: 0.3,
    },
    cashflowSchedule: generateCashflowSchedule(12),
    gracePeriodEnd: '2025-12-15T08:00:00.000Z',
    maturityDate: '2028-06-15T08:00:00.000Z',
    status: 'Repaying',
    createdAt: '2025-06-15T08:00:00.000Z',
  },
  {
    borrowId: 'pborrow-002',
    borrowerParty: 'party::bob::2',
    projectId: 'proj-002',
    poolId: 'usdc-main',
    loanAmount: '7000000.00',
    outstandingDebt: '7000000.00',
    interestRate: 0.058,
    collateral: {
      cryptoCollateral: '2100000.00',
      projectAssetValue: '3500000.00',
      tifaCollateral: '1400000.00',
      totalValue: '7000000.00',
      cryptoRatio: 0.3,
    },
    cashflowSchedule: [],
    gracePeriodEnd: '2027-03-01T10:00:00.000Z',
    maturityDate: '2029-09-01T10:00:00.000Z',
    status: 'GracePeriod',
    createdAt: '2025-09-01T10:00:00.000Z',
  },
  {
    borrowId: 'pborrow-003',
    borrowerParty: 'party::carol::3',
    projectId: 'proj-003',
    poolId: 'eth-main',
    loanAmount: '18000000.00',
    outstandingDebt: '18000000.00',
    interestRate: 0.062,
    collateral: {
      cryptoCollateral: '5400000.00',
      projectAssetValue: '9000000.00',
      tifaCollateral: '3600000.00',
      totalValue: '18000000.00',
      cryptoRatio: 0.3,
    },
    cashflowSchedule: [],
    gracePeriodEnd: '2027-11-10T09:00:00.000Z',
    maturityDate: '2030-11-10T09:00:00.000Z',
    status: 'Active',
    createdAt: '2025-11-10T09:00:00.000Z',
  },
  {
    borrowId: 'pborrow-004',
    borrowerParty: 'party::alice::1',
    projectId: 'proj-001',
    poolId: 'tbill-short',
    loanAmount: '2000000.00',
    outstandingDebt: '1200000.00',
    interestRate: 0.048,
    collateral: {
      cryptoCollateral: '600000.00',
      projectAssetValue: '1000000.00',
      tifaCollateral: '400000.00',
      totalValue: '2000000.00',
      cryptoRatio: 0.3,
    },
    cashflowSchedule: generateCashflowSchedule(6),
    gracePeriodEnd: '2025-12-15T08:00:00.000Z',
    maturityDate: '2027-06-15T08:00:00.000Z',
    status: 'Repaying',
    createdAt: '2025-06-15T08:00:00.000Z',
  },
  // Cross-referenced: SME Konya solar project borrow
  {
    borrowId: 'pborrow-005',
    borrowerParty: 'party::sme_konya_001',
    projectId: 'proj-007',
    poolId: 'prod-solar',
    loanAmount: '1500000.00',
    outstandingDebt: '980000.00',
    interestRate: 0.04, // 7% base - 2% solar discount - 1% ESG A bonus
    collateral: {
      cryptoCollateral: '450000.00',
      projectAssetValue: '800000.00',
      tifaCollateral: '250000.00',
      totalValue: '1500000.00',
      cryptoRatio: 0.3,
    },
    cashflowSchedule: generateCashflowSchedule(18),
    gracePeriodEnd: '2026-02-10T09:00:00.000Z',
    maturityDate: '2030-08-10T09:00:00.000Z',
    status: 'Repaying',
    createdAt: '2025-08-10T09:00:00.000Z',
  },
  // Cross-referenced: Retail user agri borrow
  {
    borrowId: 'pborrow-006',
    borrowerParty: 'party::retail_user_001',
    projectId: 'proj-008',
    poolId: 'prod-supply',
    loanAmount: '600000.00',
    outstandingDebt: '600000.00',
    interestRate: 0.054, // 7% base - 1.5% agri discount - 0.5% ESG B bonus
    collateral: {
      cryptoCollateral: '180000.00',
      projectAssetValue: '340000.00',
      tifaCollateral: '80000.00',
      totalValue: '600000.00',
      cryptoRatio: 0.3,
    },
    cashflowSchedule: [],
    gracePeriodEnd: '2026-04-20T11:00:00.000Z',
    maturityDate: '2028-10-20T11:00:00.000Z',
    status: 'GracePeriod',
    createdAt: '2025-10-20T11:00:00.000Z',
  },
];

const MOCK_POOLS: ProductivePool[] = [
  { poolId: 'prod-solar', category: 'SolarEnergy', totalDeposited: '25000000.00', totalLent: '17000000.00', activeProjects: 2, avgReturn: 0.135, defaultRate: 0.02, rateDiscount: 0.02, esgBonus: 0.01 },
  { poolId: 'prod-wind', category: 'WindEnergy', totalDeposited: '30000000.00', totalLent: '18000000.00', activeProjects: 1, avgReturn: 0.156, defaultRate: 0.03, rateDiscount: 0.02, esgBonus: 0.005 },
  { poolId: 'prod-data', category: 'DataCenter', totalDeposited: '50000000.00', totalLent: '0', activeProjects: 0, avgReturn: 0, defaultRate: 0, rateDiscount: 0.01, esgBonus: 0 },
  { poolId: 'prod-supply', category: 'SupplyChain', totalDeposited: '15000000.00', totalLent: '0', activeProjects: 0, avgReturn: 0, defaultRate: 0, rateDiscount: 0.015, esgBonus: 0 },
];

function generateCashflowSchedule(months: number): CashflowEntry[] {
  const schedule: CashflowEntry[] = [];
  const now = Date.now();
  for (let i = 0; i < months; i++) {
    const date = new Date(now - (months - i) * 30 * 86_400_000);
    const isPast = date.getTime() < now;
    const expected = 50_000 + Math.random() * 150_000;
    schedule.push({
      expectedDate: date.toISOString(),
      expectedAmount: expected.toFixed(2),
      actualAmount: isPast ? (expected * (0.85 + Math.random() * 0.3)).toFixed(2) : null,
      source: 'energy_sales',
      status: isPast ? (Math.random() > 0.1 ? 'Received' : 'Partial') : 'Projected',
    });
  }
  return schedule;
}

function generateIoTReadings(projectId: string, days: number): IoTReading[] {
  const readings: IoTReading[] = [];
  const now = Date.now();
  for (let d = days - 1; d >= 0; d--) {
    for (let h = 0; h < 24; h += 4) {
      const ts = new Date(now - d * 86_400_000);
      ts.setHours(h, 0, 0, 0);
      readings.push({
        projectId,
        metricType: 'solar_output_kw',
        value: h >= 6 && h <= 18 ? 200 + Math.random() * 600 : Math.random() * 50,
        unit: 'kW',
        timestamp: ts.toISOString(),
      });
    }
  }
  return readings;
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

export function listProjects(
  filters?: { category?: ProjectCategory | undefined; status?: ProjectStatus | undefined },
): { data: ProductiveProject[]; pagination: Pagination } {
  log.debug({ filters }, 'Listing productive projects');

  let result = [...MOCK_PROJECTS];
  if (filters?.category) {
    result = result.filter((p) => p.category === filters.category);
  }
  if (filters?.status) {
    result = result.filter((p) => p.status === filters.status);
  }

  return {
    data: result,
    pagination: { total: result.length, limit: 50, offset: 0, hasMore: false },
  };
}

export function getProjectDetail(
  projectId: string,
): { project: ProductiveProject; iotReadings: IoTReading[] } | null {
  log.debug({ projectId }, 'Getting project detail');

  const project = MOCK_PROJECTS.find((p) => p.projectId === projectId);
  if (!project) return null;

  const iot = project.status === 'Operational' ? generateIoTReadings(projectId, 7) : [];
  return { project, iotReadings: iot };
}

export function submitProject(
  ownerParty: string,
  projectData: {
    category: ProjectCategory;
    metadata: Record<string, unknown>;
    requestedAmount: string;
  },
): { data: ProductiveProject; transaction: TransactionMeta } {
  log.info({ ownerParty, category: projectData.category }, 'Submitting productive project');

  const project: ProductiveProject = {
    projectId: `proj-${randomUUID().slice(0, 8)}`,
    ownerPartyId: ownerParty,
    category: projectData.category,
    status: 'Proposed',
    metadata: projectData.metadata as unknown as ProductiveProject['metadata'],
    attestations: [],
    requestedAmount: projectData.requestedAmount,
    fundedAmount: '0',
    createdAt: new Date().toISOString(),
  };

  return { data: project, transaction: buildTransactionMeta() };
}

export function updateProjectStatus(
  projectId: string,
  status: ProjectStatus,
): { data: { projectId: string; status: ProjectStatus }; transaction: TransactionMeta } {
  log.info({ projectId, status }, 'Updating project status');
  return {
    data: { projectId, status },
    transaction: buildTransactionMeta(),
  };
}

export function listProductivePools(): ProductivePool[] {
  log.debug('Listing productive pools');
  return MOCK_POOLS;
}

export function requestProductiveBorrow(params: {
  borrowerParty: string;
  projectId: string;
  poolId: string;
  loanAmount: string;
  collateral: HybridCollateral;
}): { data: ProductiveBorrow; transaction: TransactionMeta } {
  log.info({ borrower: params.borrowerParty, project: params.projectId }, 'Requesting productive borrow');

  const project = MOCK_PROJECTS.find((p) => p.projectId === params.projectId);
  const category = project?.category ?? 'SolarEnergy';
  const esgRating = (project?.metadata?.esgRating ?? 'Unrated') as keyof typeof ESG_BONUSES;
  const rateDiscount = PRODUCTIVE_RATE_DISCOUNTS[category] ?? 0;
  const esgBonus = ESG_BONUSES[esgRating] ?? 0;
  const baseRate = 0.07;
  const interestRate = Math.max(0.02, baseRate - rateDiscount - esgBonus);

  const now = new Date();
  const gracePeriodEnd = new Date(now.getTime() + 180 * 86_400_000);
  const maturityDate = new Date(now.getTime() + 1095 * 86_400_000);

  const borrow: ProductiveBorrow = {
    borrowId: `pborrow-${randomUUID().slice(0, 8)}`,
    borrowerParty: params.borrowerParty,
    projectId: params.projectId,
    poolId: params.poolId,
    loanAmount: params.loanAmount,
    outstandingDebt: params.loanAmount,
    interestRate,
    collateral: params.collateral,
    cashflowSchedule: [],
    gracePeriodEnd: gracePeriodEnd.toISOString(),
    maturityDate: maturityDate.toISOString(),
    status: 'Active',
    createdAt: now.toISOString(),
  };

  return { data: borrow, transaction: buildTransactionMeta() };
}

export function processCashflowRepayment(
  borrowId: string,
  cashflowEntry: CashflowEntry,
): { data: { borrowId: string; newOutstanding: string }; transaction: TransactionMeta } {
  log.info({ borrowId }, 'Processing cashflow repayment');

  const borrow = MOCK_BORROWS.find((b) => b.borrowId === borrowId);
  const outstanding = borrow ? parseFloat(borrow.outstandingDebt) : 1_000_000;
  const payment = parseFloat(cashflowEntry.actualAmount ?? cashflowEntry.expectedAmount);
  const newOutstanding = Math.max(0, outstanding - payment);

  return {
    data: { borrowId, newOutstanding: newOutstanding.toFixed(2) },
    transaction: buildTransactionMeta(),
  };
}

export function getIoTReadings(
  projectId: string,
  period?: string,
): IoTReading[] {
  log.debug({ projectId, period }, 'Getting IoT readings');
  const days = period === '30d' ? 30 : period === '7d' ? 7 : 1;
  return generateIoTReadings(projectId, days);
}

export function getProductiveAnalytics(): {
  totalProjects: number;
  totalFunded: number;
  totalLent: string;
  avgReturn: number;
  defaultRate: number;
  categoryBreakdown: Record<string, number>;
} {
  const categories: Record<string, number> = {};
  for (const p of MOCK_PROJECTS) {
    categories[p.category] = (categories[p.category] ?? 0) + 1;
  }
  return {
    totalProjects: MOCK_PROJECTS.length,
    totalFunded: MOCK_PROJECTS.filter((p) => parseFloat(p.fundedAmount) > 0).length,
    totalLent: MOCK_POOLS.reduce((acc, p) => acc + parseFloat(p.totalLent), 0).toFixed(2),
    avgReturn: 0.13,
    defaultRate: 0.02,
    categoryBreakdown: categories,
  };
}

export function getBorrows(
  partyId?: string,
): ProductiveBorrow[] {
  if (partyId) {
    return MOCK_BORROWS.filter((b) => b.borrowerParty === partyId);
  }
  return MOCK_BORROWS;
}
