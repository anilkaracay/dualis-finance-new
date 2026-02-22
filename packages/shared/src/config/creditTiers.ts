import type { CreditTier } from '../types/core';

/**
 * Credit tier configuration for the financial mathematics engine.
 * These values are used for LTV adjustments and borrow rate discounts.
 */
export interface CreditTierMathConfig {
  maxLTV: number;
  rateDiscount: number;
  minCollateralRatio: number;
  liquidationBuffer: number;
}

/**
 * Credit tier math parameters aligned with TIER_BENEFITS.
 */
export const CREDIT_TIER_MATH: Record<CreditTier, CreditTierMathConfig> = {
  Diamond: { maxLTV: 0.85, rateDiscount: 0.25, minCollateralRatio: 1.15, liquidationBuffer: 0.05 },
  Gold:    { maxLTV: 0.78, rateDiscount: 0.15, minCollateralRatio: 1.25, liquidationBuffer: 0.08 },
  Silver:  { maxLTV: 0.70, rateDiscount: 0.08, minCollateralRatio: 1.35, liquidationBuffer: 0.10 },
  Bronze:  { maxLTV: 0.60, rateDiscount: 0.00, minCollateralRatio: 1.50, liquidationBuffer: 0.12 },
  Unrated: { maxLTV: 0.50, rateDiscount: 0.00, minCollateralRatio: 1.75, liquidationBuffer: 0.15 },
};

/**
 * Pre-liquidation alert thresholds per credit tier.
 * Each array has 3 levels: [warning, danger, critical].
 */
export const ALERT_THRESHOLDS: Record<CreditTier, readonly [number, number, number]> = {
  Diamond: [1.3, 1.2, 1.1],
  Gold:    [1.4, 1.3, 1.15],
  Silver:  [1.5, 1.35, 1.2],
  Bronze:  [1.6, 1.4, 1.25],
  Unrated: [1.8, 1.5, 1.3],
};

/**
 * Health factor color coding for UI display.
 */
export const HF_COLORS = {
  safe:        '#22C55E', // green-500
  healthy:     '#22C55E', // green-500
  caution:     '#F59E0B', // yellow-500
  danger:      '#EF4444', // red-500
  liquidatable: '#EF4444', // red-500 (pulse animation in UI)
} as const;

/**
 * Get the effective LTV for a given asset and credit tier.
 * effectiveLTV = min(baseAssetLTV, tierMaxLTV)
 */
export function getEffectiveLTV(baseAssetLTV: number, tier: CreditTier): number {
  return Math.min(baseAssetLTV, CREDIT_TIER_MATH[tier].maxLTV);
}

/**
 * Get the alert level for a given health factor and credit tier.
 * Returns null if HF is above all thresholds.
 */
export function getAlertLevel(
  healthFactor: number,
  tier: CreditTier,
): 'warning' | 'danger' | 'critical' | null {
  const [warning, danger, critical] = ALERT_THRESHOLDS[tier];
  if (healthFactor <= critical) return 'critical';
  if (healthFactor <= danger) return 'danger';
  if (healthFactor <= warning) return 'warning';
  return null;
}
