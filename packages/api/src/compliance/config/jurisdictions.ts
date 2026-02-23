import type { JurisdictionConfig } from '@dualis/shared';

export const JURISDICTION_CONFIGS: Record<string, JurisdictionConfig> = {
  TR: {
    code: 'TR',
    name: 'Turkey (MASAK)',
    kycLevelName: 'basic-kyc-level',
    documentRetentionYears: 8,
    reScreeningPeriods: { low: 12, medium: 3, high: 1, critical: 1 },
    reportingThresholds: {
      dailyLimitWithoutFullKYC: 10000,
      suspiciousTransactionReport: 75,
      travelRule: 1000,
    },
    requiredDocuments: ['government_id', 'proof_of_address'],
    pepCheckRequired: true,
    sanctionsLists: ['ofac', 'eu', 'un', 'masak'],
    eddThreshold: 50000,
  },
  EU: {
    code: 'EU',
    name: 'European Union (5AMLD)',
    kycLevelName: 'eu-kyc-level',
    documentRetentionYears: 5,
    reScreeningPeriods: { low: 12, medium: 6, high: 3, critical: 1 },
    reportingThresholds: {
      dailyLimitWithoutFullKYC: 15000,
      suspiciousTransactionReport: 50,
      travelRule: 1000,
    },
    requiredDocuments: ['government_id', 'proof_of_address', 'source_of_funds'],
    pepCheckRequired: true,
    sanctionsLists: ['ofac', 'eu', 'un'],
    eddThreshold: 15000,
  },
  GLOBAL: {
    code: 'GLOBAL',
    name: 'Global Default',
    kycLevelName: 'basic-kyc-level',
    documentRetentionYears: 5,
    reScreeningPeriods: { low: 12, medium: 6, high: 3, critical: 1 },
    reportingThresholds: {
      dailyLimitWithoutFullKYC: 10000,
      suspiciousTransactionReport: 75,
      travelRule: 1000,
    },
    requiredDocuments: ['government_id'],
    pepCheckRequired: false,
    sanctionsLists: ['ofac', 'eu', 'un'],
    eddThreshold: 50000,
  },
};

export function getJurisdictionConfig(country?: string): JurisdictionConfig {
  if (!country) return JURISDICTION_CONFIGS.GLOBAL!;
  if (country === 'TR') return JURISDICTION_CONFIGS.TR!;
  // EU member states
  const euCountries = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'GR', 'FI', 'SE', 'DK', 'IE', 'PL', 'CZ', 'RO', 'BG', 'HR', 'SK', 'SI', 'LT', 'LV', 'EE', 'CY', 'LU', 'MT', 'HU'];
  if (euCountries.includes(country)) return JURISDICTION_CONFIGS.EU!;
  return JURISDICTION_CONFIGS.GLOBAL!;
}
