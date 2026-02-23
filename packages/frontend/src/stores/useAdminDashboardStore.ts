'use client';

import { create } from 'zustand';
import { apiClient } from '@/lib/api/client';
import type { AdminDashboardStats, AdminPoolSummary } from '@dualis/shared';

// Mock fallback data
const MOCK_STATS: AdminDashboardStats = {
  totalTVL: 45_200_000,
  tvlDelta24h: 2.4,
  activeLoans: 127,
  totalBorrowValue: 18_500_000,
  totalUsers: 1_842,
  newUsersThisWeek: 43,
  protocolRevenue: 156_000,
  revenueThisMonth: 12_400,
};

const MOCK_POOLS: AdminPoolSummary[] = [
  { poolId: 'usdc-main', name: 'USDC Main Pool', asset: 'USDC', status: 'active', tvl: 25_000_000, totalBorrow: 12_500_000, utilization: 0.50, supplyAPY: 0.032, borrowAPY: 0.058, maxLTV: 0.80, liquidationThreshold: 0.85, createdAt: '2024-06-01' },
  { poolId: 'wbtc-main', name: 'wBTC Pool', asset: 'wBTC', status: 'active', tvl: 10_000_000, totalBorrow: 3_500_000, utilization: 0.35, supplyAPY: 0.012, borrowAPY: 0.028, maxLTV: 0.73, liquidationThreshold: 0.80, createdAt: '2024-06-15' },
  { poolId: 'eth-main', name: 'ETH Pool', asset: 'ETH', status: 'active', tvl: 8_200_000, totalBorrow: 4_100_000, utilization: 0.50, supplyAPY: 0.018, borrowAPY: 0.034, maxLTV: 0.75, liquidationThreshold: 0.82, createdAt: '2024-07-01' },
  { poolId: 'tbill-main', name: 'T-Bill Pool', asset: 'T-BILL', status: 'active', tvl: 5_000_000, totalBorrow: 1_500_000, utilization: 0.30, supplyAPY: 0.042, borrowAPY: 0.052, maxLTV: 0.85, liquidationThreshold: 0.90, createdAt: '2024-08-01' },
  { poolId: 'cc-main', name: 'CC Token Pool', asset: 'CC', status: 'paused', tvl: 2_000_000, totalBorrow: 900_000, utilization: 0.45, supplyAPY: 0.045, borrowAPY: 0.095, maxLTV: 0.55, liquidationThreshold: 0.65, createdAt: '2024-09-01' },
  { poolId: 'spy-main', name: 'SPY ETF Pool', asset: 'SPY', status: 'active', tvl: 3_000_000, totalBorrow: 800_000, utilization: 0.27, supplyAPY: 0.015, borrowAPY: 0.032, maxLTV: 0.65, liquidationThreshold: 0.75, createdAt: '2024-10-01' },
];

const MOCK_ALERTS = [
  { id: 1, alertType: 'HIGH_UTILIZATION', asset: 'USDC', message: 'USDC pool utilization above 85%', severity: 'warning', timestamp: new Date().toISOString() },
  { id: 2, alertType: 'STALE_PRICE', asset: 'CC', message: 'CC price feed stale for 3 minutes', severity: 'warning', timestamp: new Date(Date.now() - 300000).toISOString() },
  { id: 3, alertType: 'CIRCUIT_BREAKER_TRIPPED', asset: 'TIFA-REC', message: 'TIFA-REC circuit breaker tripped: 12% deviation', severity: 'critical', timestamp: new Date(Date.now() - 600000).toISOString() },
];

const MOCK_RECENT_ACTIVITY = [
  { id: 1, adminName: 'Admin User', action: 'pool.pause', targetType: 'pool', targetId: 'cc-main', createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: 2, adminName: 'Compliance Officer', action: 'user.approve_kyb', targetType: 'user', targetId: 'user-42', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, adminName: 'Admin User', action: 'oracle.reset_cb', targetType: 'oracle', targetId: 'TIFA-REC', createdAt: new Date(Date.now() - 7200000).toISOString() },
];

interface Alert {
  id: number;
  alertType: string;
  asset: string;
  message: string;
  severity: string;
  timestamp: string;
}

interface RecentActivity {
  id: number;
  adminName: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  createdAt: string;
}

interface AdminDashboardState {
  stats: AdminDashboardStats | null;
  pools: AdminPoolSummary[];
  alerts: Alert[];
  recentActivity: RecentActivity[];
  isLoading: boolean;
  error: string | null;
  fetchDashboard: () => Promise<void>;
}

export const useAdminDashboardStore = create<AdminDashboardState>((set) => ({
  stats: null,
  pools: [],
  alerts: [],
  recentActivity: [],
  isLoading: false,
  error: null,

  fetchDashboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const [statsRes, alertsRes, activityRes] = await Promise.allSettled([
        apiClient.get('/admin/dashboard/stats'),
        apiClient.get('/admin/dashboard/alerts?limit=20'),
        apiClient.get('/admin/dashboard/recent-activity?limit=10'),
      ]);

      const statsData = statsRes.status === 'fulfilled' ? statsRes.value.data?.data : null;
      const alertsData = alertsRes.status === 'fulfilled' ? alertsRes.value.data?.data : null;
      const activityData = activityRes.status === 'fulfilled' ? activityRes.value.data?.data : null;

      set({
        stats: statsData?.stats ?? MOCK_STATS,
        pools: statsData?.pools ?? MOCK_POOLS,
        alerts: alertsData ?? MOCK_ALERTS,
        recentActivity: activityData ?? MOCK_RECENT_ACTIVITY,
        isLoading: false,
      });
    } catch {
      set({
        stats: MOCK_STATS,
        pools: MOCK_POOLS,
        alerts: MOCK_ALERTS,
        recentActivity: MOCK_RECENT_ACTIVITY,
        isLoading: false,
      });
    }
  },
}));
