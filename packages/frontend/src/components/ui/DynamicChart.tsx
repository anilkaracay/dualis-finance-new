'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from './Skeleton';

const ChartLoading = () => <Skeleton className="w-full h-[320px] rounded-sm" />;

export const DynamicAreaChart = dynamic(
  () => import('@/components/charts/AreaChart').then(mod => ({ default: mod.AreaChart })),
  { loading: ChartLoading, ssr: false }
);

export const DynamicDonutChart = dynamic(
  () => import('@/components/charts/DonutChart').then(mod => ({ default: mod.DonutChart })),
  { loading: ChartLoading, ssr: false }
);

export const DynamicInterestRateChart = dynamic(
  () => import('@/components/charts/InterestRateChart').then(mod => ({ default: mod.InterestRateChart })),
  { loading: ChartLoading, ssr: false }
);

export const DynamicHistogramChart = dynamic(
  () => import('@/components/charts/HistogramChart').then(mod => ({ default: mod.HistogramChart })),
  { loading: ChartLoading, ssr: false }
);
