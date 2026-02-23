export const COUNTRY_RISK: Record<string, number> = {
  // FATF Black List (high risk)
  KP: 100, IR: 90, MM: 85,
  // FATF Grey List
  SY: 80, YE: 75, AF: 70, PK: 40, NG: 40, ZA: 35, PH: 35,
  TZ: 35, JM: 35, PA: 35, AL: 30, BF: 30, CF: 30, CD: 30,
  HT: 30, ML: 30, MZ: 30, SS: 30, VU: 30,
  // Enhanced monitoring
  TR: 10, AE: 15, SA: 15,
  // Low risk
  US: 0, GB: 0, DE: 0, FR: 0, CH: 0, JP: 0, AU: 0, CA: 0,
  NL: 0, SE: 0, NO: 0, DK: 0, FI: 0, SG: 0,
};

export function getCountryRiskScore(countryCode: string): number {
  return COUNTRY_RISK[countryCode.toUpperCase()] ?? 15;
}
