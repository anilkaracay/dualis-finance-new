import { useMemo } from 'react';
import {
  calculateUtilization,
  calculatePoolAPY,
  generateRateCurve,
  type InterestRateModelConfig,
} from '@dualis/shared';

export function usePoolMath(
  totalBorrows: number,
  totalDeposits: number,
  model: InterestRateModelConfig,
) {
  const utilization = useMemo(
    () => calculateUtilization(totalBorrows, totalDeposits),
    [totalBorrows, totalDeposits],
  );

  const supplyAPY = useMemo(
    () => calculatePoolAPY(model, utilization, 'supply'),
    [model, utilization],
  );

  const borrowAPY = useMemo(
    () => calculatePoolAPY(model, utilization, 'borrow'),
    [model, utilization],
  );

  const rateCurve = useMemo(
    () => generateRateCurve(model, 100),
    [model],
  );

  const availableLiquidity = totalDeposits - totalBorrows;

  return {
    utilization,
    supplyAPY,
    borrowAPY,
    rateCurve,
    availableLiquidity,
  };
}
