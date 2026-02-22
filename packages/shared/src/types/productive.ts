export type ProjectCategory =
  | 'SolarEnergy'
  | 'WindEnergy'
  | 'BatteryStorage'
  | 'DataCenter'
  | 'SupplyChain'
  | 'ExportFinance'
  | 'EquipmentLeasing'
  | 'RealEstate'
  | 'AgriInfra'
  | 'TelecomInfra';

export type ProjectStatus =
  | 'Proposed'
  | 'UnderReview'
  | 'Approved'
  | 'Funded'
  | 'InConstruction'
  | 'Operational'
  | 'Repaying'
  | 'Completed'
  | 'Defaulted';

export type ESGRating = 'A' | 'B' | 'C' | 'Unrated';

export type CashflowStatus = 'Projected' | 'Received' | 'Partial' | 'Missed' | 'Overdue';

export type ProductiveBorrowStatus =
  | 'Active'
  | 'GracePeriod'
  | 'Repaying'
  | 'Completed'
  | 'Warning'
  | 'CollateralCall'
  | 'Defaulted';

export interface ProjectMetadata {
  location: string;
  capacity: string | null;
  offTaker: string | null;
  insurancePolicy: string | null;
  independentValue: string; // USD, Decimal as string
  expectedIRR: number;
  constructionPeriod: number; // months
  operationalLife: number; // years
  esgRating: ESGRating;
  iotFeedId: string | null;
}

export interface CashflowEntry {
  expectedDate: string;
  expectedAmount: string;
  actualAmount: string | null;
  source: string; // energy_sales, lease_income, export_revenue
  status: CashflowStatus;
}

export interface HybridCollateral {
  cryptoCollateral: string; // USD value
  projectAssetValue: string;
  tifaCollateral: string;
  totalValue: string;
  cryptoRatio: number; // 0.0-1.0
}

export interface ProductiveProject {
  projectId: string;
  ownerPartyId: string;
  category: ProjectCategory;
  status: ProjectStatus;
  metadata: ProjectMetadata;
  attestations: string[];
  requestedAmount: string;
  fundedAmount: string;
  createdAt: string;
}

export interface ProductiveBorrow {
  borrowId: string;
  borrowerParty: string;
  projectId: string;
  poolId: string;
  loanAmount: string;
  outstandingDebt: string;
  interestRate: number;
  collateral: HybridCollateral;
  cashflowSchedule: CashflowEntry[];
  gracePeriodEnd: string;
  maturityDate: string;
  status: ProductiveBorrowStatus;
  createdAt: string;
}

export interface ProductivePool {
  poolId: string;
  category: ProjectCategory;
  totalDeposited: string;
  totalLent: string;
  activeProjects: number;
  avgReturn: number;
  defaultRate: number;
  rateDiscount: number;
  esgBonus: number;
}

export interface IoTReading {
  projectId: string;
  metricType: string;
  value: number;
  unit: string;
  timestamp: string;
}

export const PRODUCTIVE_RATE_DISCOUNTS: Record<ProjectCategory, number> = {
  SolarEnergy: 0.02,
  WindEnergy: 0.02,
  BatteryStorage: 0.02,
  DataCenter: 0.01,
  SupplyChain: 0.015,
  ExportFinance: 0.015,
  EquipmentLeasing: 0.01,
  RealEstate: 0.01,
  AgriInfra: 0.015,
  TelecomInfra: 0.01,
};

export const ESG_BONUSES: Record<ESGRating, number> = {
  A: 0.01,
  B: 0.005,
  C: 0,
  Unrated: 0,
};
