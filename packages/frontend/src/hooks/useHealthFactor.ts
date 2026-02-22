import { useMemo, useCallback } from 'react';
import {
  calculateHealthFactor,
  calculateMaxBorrowable,
  simulatePriceImpact,
  findLiquidationPrice,
  type CollateralPositionInput,
  type DebtPositionInput,
  type HealthFactorResult,
} from '@dualis/shared';

export function useHealthFactor(
  collaterals: CollateralPositionInput[],
  debts: DebtPositionInput[],
  tierMaxLTV: number,
) {
  const healthFactor = useMemo(
    () => calculateHealthFactor(collaterals, debts) as HealthFactorResult,
    [collaterals, debts],
  );

  const maxBorrowable = useMemo(
    () => calculateMaxBorrowable(collaterals, debts, tierMaxLTV),
    [collaterals, debts, tierMaxLTV],
  );

  const liquidationPriceDrop = useMemo(
    () => findLiquidationPrice(collaterals, debts),
    [collaterals, debts],
  );

  const simulatePrice = useCallback(
    (priceChange: number) => simulatePriceImpact(collaterals, debts, priceChange),
    [collaterals, debts],
  );

  return {
    healthFactor,
    maxBorrowable,
    liquidationPriceDrop,
    simulatePrice,
  };
}
