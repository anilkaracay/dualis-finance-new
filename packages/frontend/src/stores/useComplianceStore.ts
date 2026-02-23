'use client';

import { create } from 'zustand';

interface WalletAMLStatus {
  walletAddress: string;
  status: string;
  riskScore: number | null;
  riskCategory: string | null;
  screenedAt: string | null;
  nextScreeningAt: string | null;
}

interface ComplianceState {
  kycStatus: string;
  amlStatus: string;
  riskLevel: string | null;
  wallets: WalletAMLStatus[];
  loading: boolean;
  error: string | null;

  // Actions
  setKycStatus: (status: string) => void;
  setAmlStatus: (status: string, wallets?: WalletAMLStatus[]) => void;
  setRiskLevel: (level: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchAmlStatus: () => Promise<void>;
  fetchKycStatus: () => Promise<void>;
  reset: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export const useComplianceStore = create<ComplianceState>((set) => ({
  kycStatus: 'not_started',
  amlStatus: 'not_screened',
  riskLevel: null,
  wallets: [],
  loading: false,
  error: null,

  setKycStatus: (status) => set({ kycStatus: status }),
  setAmlStatus: (status, wallets) => set({ amlStatus: status, wallets: wallets ?? [] }),
  setRiskLevel: (level) => set({ riskLevel: level }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchAmlStatus: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/compliance/aml/status`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch AML status');
      const data = await res.json();
      set({
        amlStatus: data.status,
        wallets: data.wallets ?? [],
        loading: false,
      });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchKycStatus: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/compliance/kyc/status`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch KYC status');
      const data = await res.json();
      set({
        kycStatus: data.status ?? 'not_started',
        loading: false,
      });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  reset: () =>
    set({
      kycStatus: 'not_started',
      amlStatus: 'not_screened',
      riskLevel: null,
      wallets: [],
      loading: false,
      error: null,
    }),
}));
