'use client';

import { create } from 'zustand';
import type {
  PrivacyConfig,
  PrivacyLevel,
  DisclosureRule,
  DataScope,
  PrivacyAuditEntry,
  TransactionMeta,
} from '@dualis/shared';

// ---------------------------------------------------------------------------
// Mock fallback data — used when API is unavailable
// ---------------------------------------------------------------------------

const MOCK_CONFIG: PrivacyConfig = {
  partyId: 'local-user',
  privacyLevel: 'Selective',
  disclosureRules: [
    {
      id: 'rule-mock-1',
      discloseTo: 'party::regulator::sec',
      displayName: 'SEC Reporting',
      dataScope: 'All',
      purpose: 'Regulatory compliance',
      isActive: true,
      expiresAt: null,
      createdAt: new Date().toISOString(),
    },
  ],
  auditTrailEnabled: true,
  updatedAt: new Date().toISOString(),
};

const MOCK_AUDIT_LOG: PrivacyAuditEntry[] = [
  {
    partyId: 'local-user',
    requesterParty: 'party::regulator::sec',
    dataScope: 'Positions',
    granted: true,
    reason: 'Disclosure rule: SEC Reporting',
    timestamp: new Date(Date.now() - 3600_000).toISOString(),
  },
  {
    partyId: 'local-user',
    requesterParty: 'party::unknown::1',
    dataScope: 'Transactions',
    granted: false,
    reason: 'Selective privacy — no disclosure rules match',
    timestamp: new Date(Date.now() - 7200_000).toISOString(),
  },
  {
    partyId: 'local-user',
    requesterParty: 'party::auditor::kpmg',
    dataScope: 'CreditScore',
    granted: false,
    reason: 'Selective privacy — no disclosure rules match',
    timestamp: new Date(Date.now() - 86400_000).toISOString(),
  },
];

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface PrivacyState {
  config: PrivacyConfig | null;
  auditLog: PrivacyAuditEntry[];
  isLoading: boolean;
  error: string | null;
}

interface PrivacyActions {
  fetchPrivacyConfig: () => Promise<void>;
  setPrivacyLevel: (level: PrivacyLevel) => Promise<void>;
  addDisclosure: (rule: { discloseTo: string; displayName: string; dataScope: DataScope; purpose: string; expiresAt: string | null }) => Promise<void>;
  removeDisclosure: (ruleId: string) => Promise<void>;
  fetchAuditLog: () => Promise<void>;
  clearError: () => void;
}

export const usePrivacyStore = create<PrivacyState & PrivacyActions>()((set) => ({
  config: null,
  auditLog: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchPrivacyConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      const { apiClient } = await import('@/lib/api/client');
      const res = await apiClient.get<PrivacyConfig>('/privacy/config');
      if (res.data && res.data.partyId) {
        set({ config: res.data, isLoading: false });
        return;
      }
      throw new Error('Invalid response');
    } catch {
      // Fallback to mock data when API is unavailable
      set({ config: { ...MOCK_CONFIG }, isLoading: false });
    }
  },

  setPrivacyLevel: async (level) => {
    set({ isLoading: true, error: null });
    try {
      const { apiClient } = await import('@/lib/api/client');
      const res = await apiClient.put<{ data: PrivacyConfig; transaction: TransactionMeta }>('/privacy/level', { level });
      if (res.data) {
        const config = res.data.data ?? res.data as unknown as PrivacyConfig;
        set({ config, isLoading: false });
        return;
      }
      throw new Error('Invalid response');
    } catch {
      // Optimistically update local state
      set((state) => ({
        config: state.config ? { ...state.config, privacyLevel: level, updatedAt: new Date().toISOString() } : null,
        isLoading: false,
      }));
    }
  },

  addDisclosure: async (rule) => {
    set({ isLoading: true, error: null });
    try {
      const { apiClient } = await import('@/lib/api/client');
      const res = await apiClient.post<{ data: DisclosureRule; transaction: TransactionMeta }>('/privacy/disclosures', rule);
      if (res.data) {
        const newRule = res.data.data ?? res.data as unknown as DisclosureRule;
        set((state) => ({
          config: state.config
            ? { ...state.config, disclosureRules: [...state.config.disclosureRules, newRule] }
            : null,
          isLoading: false,
        }));
        return;
      }
      throw new Error('Invalid response');
    } catch {
      // Optimistically add to local state
      const newRule: DisclosureRule = {
        id: `rule-${Date.now()}`,
        discloseTo: rule.discloseTo,
        displayName: rule.displayName,
        dataScope: rule.dataScope,
        purpose: rule.purpose,
        isActive: true,
        expiresAt: rule.expiresAt,
        createdAt: new Date().toISOString(),
      };
      set((state) => ({
        config: state.config
          ? { ...state.config, disclosureRules: [...state.config.disclosureRules, newRule] }
          : null,
        isLoading: false,
      }));
    }
  },

  removeDisclosure: async (ruleId) => {
    set({ isLoading: true, error: null });
    try {
      const { apiClient } = await import('@/lib/api/client');
      await apiClient.delete(`/privacy/disclosures/${ruleId}`);
    } catch {
      // Continue — optimistically remove from UI
    }
    set((state) => ({
      config: state.config
        ? { ...state.config, disclosureRules: state.config.disclosureRules.filter((r) => r.id !== ruleId) }
        : null,
      isLoading: false,
    }));
  },

  fetchAuditLog: async () => {
    set({ isLoading: true, error: null });
    try {
      const { apiClient } = await import('@/lib/api/client');
      const res = await apiClient.get<PrivacyAuditEntry[]>('/privacy/audit-log');
      if (Array.isArray(res.data)) {
        set({ auditLog: res.data, isLoading: false });
        return;
      }
      throw new Error('Invalid response');
    } catch {
      // Fallback to mock audit log
      set({ auditLog: [...MOCK_AUDIT_LOG], isLoading: false });
    }
  },
}));
