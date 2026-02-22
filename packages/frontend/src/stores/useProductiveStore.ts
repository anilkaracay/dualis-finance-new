'use client';

import { create } from 'zustand';
import type {
  ProductiveProject,
  ProductiveBorrow,
  ProductivePool,
  IoTReading,
  ProjectCategory,
  ProjectStatus,
  TransactionMeta,
} from '@dualis/shared';

interface ProductiveAnalytics {
  totalFunded: string;
  activeProjects: number;
  avgReturn: number;
  defaultRate: number;
  totalEnergyProduced: string;
  co2Avoided: string;
}

interface ProductiveState {
  projects: ProductiveProject[];
  pools: ProductivePool[];
  borrows: ProductiveBorrow[];
  selectedProject: ProductiveProject | null;
  iotReadings: IoTReading[];
  analytics: ProductiveAnalytics | null;
  isLoading: boolean;
}

interface ProductiveActions {
  fetchProjects: (filters?: { category?: ProjectCategory; status?: ProjectStatus }) => Promise<void>;
  fetchProjectDetail: (projectId: string) => Promise<void>;
  fetchPools: () => Promise<void>;
  fetchBorrows: () => Promise<void>;
  fetchIoTReadings: (projectId: string) => Promise<void>;
  submitProject: (data: { category: ProjectCategory; metadata: Record<string, unknown>; requestedAmount: string }) => Promise<void>;
}

const MOCK_PROJECTS: ProductiveProject[] = [
  {
    projectId: 'proj-konya-ges',
    ownerPartyId: 'party::alice::1',
    category: 'SolarEnergy',
    status: 'Operational',
    metadata: {
      location: 'Konya, Türkiye',
      capacity: '25 MW',
      offTaker: 'Konya OSB Enerji',
      insurancePolicy: 'Allianz-TR-2025-001',
      independentValue: '50000000',
      expectedIRR: 0.125,
      constructionPeriod: 10,
      operationalLife: 25,
      esgRating: 'A',
      iotFeedId: 'sensor-main-001',
    },
    attestations: ['valuation-konya', 'insurance-konya'],
    requestedAmount: '45000000',
    fundedAmount: '45000000',
    createdAt: '2024-05-01T10:00:00.000Z',
  },
  {
    projectId: 'proj-antalya-ges',
    ownerPartyId: 'party::bob::2',
    category: 'SolarEnergy',
    status: 'InConstruction',
    metadata: {
      location: 'Antalya, Türkiye',
      capacity: '15 MW',
      offTaker: 'Antalya Serbest Bölge',
      insurancePolicy: 'AXA-TR-2025-002',
      independentValue: '32000000',
      expectedIRR: 0.11,
      constructionPeriod: 10,
      operationalLife: 25,
      esgRating: 'A',
      iotFeedId: null,
    },
    attestations: ['valuation-antalya'],
    requestedAmount: '28000000',
    fundedAmount: '22400000',
    createdAt: '2025-08-01T10:00:00.000Z',
  },
  {
    projectId: 'proj-izmir-res',
    ownerPartyId: 'party::carol::3',
    category: 'WindEnergy',
    status: 'Funded',
    metadata: {
      location: 'İzmir, Türkiye',
      capacity: '50 MW',
      offTaker: 'Aliağa Sanayi Bölgesi',
      insurancePolicy: 'Zurich-TR-2026-001',
      independentValue: '95000000',
      expectedIRR: 0.13,
      constructionPeriod: 18,
      operationalLife: 20,
      esgRating: 'A',
      iotFeedId: null,
    },
    attestations: ['valuation-izmir', 'insurance-izmir', 'eia-izmir'],
    requestedAmount: '85000000',
    fundedAmount: '85000000',
    createdAt: '2026-01-15T10:00:00.000Z',
  },
  {
    projectId: 'proj-istanbul-dc',
    ownerPartyId: 'party::dave::4',
    category: 'DataCenter',
    status: 'Proposed',
    metadata: {
      location: 'İstanbul, Türkiye',
      capacity: '10 MW IT Load',
      offTaker: 'Tier-III Colocation',
      insurancePolicy: null,
      independentValue: '130000000',
      expectedIRR: 0.15,
      constructionPeriod: 12,
      operationalLife: 15,
      esgRating: 'B',
      iotFeedId: null,
    },
    attestations: [],
    requestedAmount: '120000000',
    fundedAmount: '0',
    createdAt: '2026-02-10T10:00:00.000Z',
  },
  {
    projectId: 'proj-bursa-scf',
    ownerPartyId: 'party::eve::5',
    category: 'SupplyChain',
    status: 'Repaying',
    metadata: {
      location: 'Bursa, Türkiye',
      capacity: '250+ tedarikçi',
      offTaker: 'TOFAŞ Otomotiv',
      insurancePolicy: 'Coface-TR-2025-003',
      independentValue: '40000000',
      expectedIRR: 0.085,
      constructionPeriod: 2,
      operationalLife: 5,
      esgRating: 'B',
      iotFeedId: null,
    },
    attestations: ['valuation-bursa', 'insurance-bursa'],
    requestedAmount: '35000000',
    fundedAmount: '35000000',
    createdAt: '2024-12-01T10:00:00.000Z',
  },
  {
    projectId: 'proj-ankara-eq',
    ownerPartyId: 'party::alice::1',
    category: 'EquipmentLeasing',
    status: 'Completed',
    metadata: {
      location: 'Ankara, Türkiye',
      capacity: '120 adet endüstriyel makine',
      offTaker: 'OSTİM Sanayi Bölgesi',
      insurancePolicy: 'Mapfre-TR-2024-001',
      independentValue: '15000000',
      expectedIRR: 0.095,
      constructionPeriod: 2,
      operationalLife: 3,
      esgRating: 'C',
      iotFeedId: null,
    },
    attestations: ['valuation-ankara', 'insurance-ankara'],
    requestedAmount: '12000000',
    fundedAmount: '12000000',
    createdAt: '2024-02-01T10:00:00.000Z',
  },
];

const MOCK_POOLS: ProductivePool[] = [
  {
    poolId: 'prod-energy',
    category: 'SolarEnergy',
    totalDeposited: '150000000',
    totalLent: '130000000',
    activeProjects: 8,
    avgReturn: 8.5,
    defaultRate: 0.0,
    rateDiscount: 0.02,
    esgBonus: 0.01,
  },
  {
    poolId: 'prod-datacenter',
    category: 'DataCenter',
    totalDeposited: '80000000',
    totalLent: '45000000',
    activeProjects: 3,
    avgReturn: 9.2,
    defaultRate: 0.0,
    rateDiscount: 0.01,
    esgBonus: 0.005,
  },
  {
    poolId: 'prod-trade',
    category: 'SupplyChain',
    totalDeposited: '60000000',
    totalLent: '52000000',
    activeProjects: 12,
    avgReturn: 7.8,
    defaultRate: 0.0,
    rateDiscount: 0.015,
    esgBonus: 0.005,
  },
  {
    poolId: 'prod-equipment',
    category: 'EquipmentLeasing',
    totalDeposited: '25000000',
    totalLent: '18000000',
    activeProjects: 5,
    avgReturn: 9.5,
    defaultRate: 0.5,
    rateDiscount: 0.01,
    esgBonus: 0.0,
  },
];

const MOCK_BORROWS: ProductiveBorrow[] = [
  {
    borrowId: 'pborrow-001',
    borrowerParty: 'party::alice::1',
    projectId: 'proj-konya-ges',
    poolId: 'prod-energy',
    loanAmount: '45000000',
    outstandingDebt: '38500000',
    interestRate: 0.072,
    collateral: {
      cryptoCollateral: '8000000',
      projectAssetValue: '28000000',
      tifaCollateral: '9000000',
      totalValue: '45000000',
      cryptoRatio: 0.178,
    },
    cashflowSchedule: [
      { expectedDate: '2025-01-15', expectedAmount: '1500000', actualAmount: '1500000', source: 'energy_sales', status: 'Received' },
      { expectedDate: '2025-04-15', expectedAmount: '1500000', actualAmount: '1500000', source: 'energy_sales', status: 'Received' },
      { expectedDate: '2025-07-15', expectedAmount: '1500000', actualAmount: null, source: 'energy_sales', status: 'Projected' },
    ],
    gracePeriodEnd: '2024-12-15T10:00:00.000Z',
    maturityDate: '2029-06-15T10:00:00.000Z',
    status: 'Active',
    createdAt: '2024-06-15T10:00:00.000Z',
  },
  {
    borrowId: 'pborrow-002',
    borrowerParty: 'party::eve::5',
    projectId: 'proj-bursa-scf',
    poolId: 'prod-trade',
    loanAmount: '35000000',
    outstandingDebt: '12000000',
    interestRate: 0.065,
    collateral: {
      cryptoCollateral: '5000000',
      projectAssetValue: '20000000',
      tifaCollateral: '10000000',
      totalValue: '35000000',
      cryptoRatio: 0.143,
    },
    cashflowSchedule: [
      { expectedDate: '2025-04-15', expectedAmount: '2000000', actualAmount: '2000000', source: 'trade_revenue', status: 'Received' },
      { expectedDate: '2025-07-15', expectedAmount: '2000000', actualAmount: null, source: 'trade_revenue', status: 'Projected' },
    ],
    gracePeriodEnd: '2025-04-15T10:00:00.000Z',
    maturityDate: '2028-01-15T10:00:00.000Z',
    status: 'Active',
    createdAt: '2025-01-15T10:00:00.000Z',
  },
];

function generateIoTReadings(): IoTReading[] {
  const readings: IoTReading[] = [];
  const now = Date.now();
  for (let i = 29; i >= 0; i--) {
    const ts = new Date(now - i * 86_400_000);
    const baseProduction = 62_000; // kWh daily
    const variation = (Math.sin(i * 0.5) * 0.15 + 1) * baseProduction;
    readings.push({
      projectId: 'proj-konya-ges',
      metricType: 'energy_production_kwh',
      value: Math.round(variation),
      unit: 'kWh',
      timestamp: ts.toISOString(),
    });
  }
  return readings;
}

const MOCK_ANALYTICS: ProductiveAnalytics = {
  totalFunded: '325000000',
  activeProjects: 4,
  avgReturn: 7.8,
  defaultRate: 0.0,
  totalEnergyProduced: '28500000',
  co2Avoided: '42750',
};

export const useProductiveStore = create<ProductiveState & ProductiveActions>()((set) => ({
  projects: [],
  pools: [],
  borrows: [],
  selectedProject: null,
  iotReadings: [],
  analytics: null,
  isLoading: false,

  fetchProjects: async (filters) => {
    set({ isLoading: true });
    try {
      const { apiClient } = await import('@/lib/api/client');
      const params = new URLSearchParams();
      if (filters?.category) params.set('category', filters.category);
      if (filters?.status) params.set('status', filters.status);
      const res = await apiClient.get<ProductiveProject[]>(`/productive/projects?${params.toString()}`);
      if (Array.isArray(res.data)) {
        set({ projects: res.data, analytics: MOCK_ANALYTICS, isLoading: false });
        return;
      }
      throw new Error('Invalid response');
    } catch {
      let filtered = [...MOCK_PROJECTS];
      if (filters?.category) filtered = filtered.filter((p) => p.category === filters.category);
      if (filters?.status) filtered = filtered.filter((p) => p.status === filters.status);
      set({ projects: filtered, analytics: MOCK_ANALYTICS, isLoading: false });
    }
  },

  fetchProjectDetail: async (projectId) => {
    set({ isLoading: true });
    try {
      const { apiClient } = await import('@/lib/api/client');
      const res = await apiClient.get<ProductiveProject>(`/productive/projects/${projectId}`);
      if (res.data) {
        set({ selectedProject: res.data, isLoading: false });
        return;
      }
      throw new Error('Invalid response');
    } catch {
      const project = MOCK_PROJECTS.find((p) => p.projectId === projectId) ?? null;
      set({ selectedProject: project, isLoading: false });
    }
  },

  fetchPools: async () => {
    set({ isLoading: true });
    try {
      const { apiClient } = await import('@/lib/api/client');
      const res = await apiClient.get<ProductivePool[]>('/productive/pools');
      if (Array.isArray(res.data)) {
        set({ pools: res.data, isLoading: false });
        return;
      }
      throw new Error('Invalid response');
    } catch {
      set({ pools: MOCK_POOLS, isLoading: false });
    }
  },

  fetchBorrows: async () => {
    set({ isLoading: true });
    try {
      const { apiClient } = await import('@/lib/api/client');
      const res = await apiClient.get<ProductiveBorrow[]>('/productive/borrows');
      if (Array.isArray(res.data)) {
        set({ borrows: res.data, isLoading: false });
        return;
      }
      throw new Error('Invalid response');
    } catch {
      set({ borrows: MOCK_BORROWS, isLoading: false });
    }
  },

  fetchIoTReadings: async (projectId) => {
    set({ isLoading: true });
    try {
      const { apiClient } = await import('@/lib/api/client');
      const res = await apiClient.get<IoTReading[]>(`/productive/iot/${projectId}`);
      if (Array.isArray(res.data)) {
        set({ iotReadings: res.data, isLoading: false });
        return;
      }
      throw new Error('Invalid response');
    } catch {
      set({ iotReadings: generateIoTReadings(), isLoading: false });
    }
  },

  submitProject: async (data) => {
    set({ isLoading: true });
    try {
      const { apiClient } = await import('@/lib/api/client');
      const res = await apiClient.post<{ data: ProductiveProject; transaction: TransactionMeta }>('/productive/projects', data);
      if (res.data) {
        set((state) => ({
          projects: [...state.projects, res.data.data ?? res.data as unknown as ProductiveProject],
          isLoading: false,
        }));
        return;
      }
      throw new Error('Invalid response');
    } catch {
      const mock: ProductiveProject = {
        projectId: `proj-${Date.now()}`,
        ownerPartyId: 'party::alice::1',
        category: data.category,
        status: 'Proposed',
        metadata: data.metadata as unknown as ProductiveProject['metadata'],
        attestations: [],
        requestedAmount: data.requestedAmount,
        fundedAmount: '0',
        createdAt: new Date().toISOString(),
      };
      set((state) => ({
        projects: [...state.projects, mock],
        isLoading: false,
      }));
    }
  },
}));

export type { ProductiveAnalytics };
