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

interface PrivacyState {
  config: PrivacyConfig | null;
  auditLog: PrivacyAuditEntry[];
  isLoading: boolean;
}

interface PrivacyActions {
  fetchPrivacyConfig: () => Promise<void>;
  setPrivacyLevel: (level: PrivacyLevel) => Promise<void>;
  addDisclosure: (rule: { discloseTo: string; displayName: string; dataScope: DataScope; purpose: string; expiresAt: string | null }) => Promise<void>;
  removeDisclosure: (ruleId: string) => Promise<void>;
  fetchAuditLog: () => Promise<void>;
}

const MOCK_CONFIG: PrivacyConfig = {
  partyId: 'party::alice::1',
  privacyLevel: 'Selective',
  disclosureRules: [
    {
      id: 'rule-001',
      discloseTo: 'party::regulator::sec',
      displayName: 'SEC Raporlama',
      dataScope: 'All',
      purpose: 'Düzenleyici uyumluluk',
      expiresAt: null,
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'rule-002',
      discloseTo: 'party::auditor::kpmg',
      displayName: 'KPMG Denetim',
      dataScope: 'Positions',
      purpose: 'Yıllık denetim',
      expiresAt: '2026-12-31T23:59:59.000Z',
      isActive: true,
      createdAt: '2026-01-15T10:00:00.000Z',
    },
  ],
  auditTrailEnabled: true,
  updatedAt: '2026-02-01T00:00:00.000Z',
};

const MOCK_AUDIT_LOG: PrivacyAuditEntry[] = [
  { partyId: 'party::alice::1', requesterParty: 'party::regulator::sec', dataScope: 'All', granted: true, reason: 'SEC Raporlama kuralı ile eşleşti', timestamp: '2026-02-22T14:00:00.000Z' },
  { partyId: 'party::alice::1', requesterParty: 'party::auditor::kpmg', dataScope: 'Positions', granted: true, reason: 'KPMG Denetim kuralı ile eşleşti', timestamp: '2026-02-21T10:30:00.000Z' },
  { partyId: 'party::alice::1', requesterParty: 'party::auditor::deloitte', dataScope: 'Transactions', granted: false, reason: 'Eşleşen kural bulunamadı', timestamp: '2026-02-20T09:15:00.000Z' },
  { partyId: 'party::alice::1', requesterParty: 'party::regulator::sec', dataScope: 'CreditScore', granted: true, reason: 'SEC Raporlama — tüm veriler', timestamp: '2026-02-19T16:45:00.000Z' },
  { partyId: 'party::alice::1', requesterParty: 'party::bank::garanti', dataScope: 'CreditScore', granted: false, reason: 'Selective — kural bulunamadı', timestamp: '2026-02-18T11:20:00.000Z' },
  { partyId: 'party::alice::1', requesterParty: 'party::regulator::cmb', dataScope: 'SecLendingDeals', granted: false, reason: 'Kural süresi dolmuş', timestamp: '2026-02-17T08:30:00.000Z' },
  { partyId: 'party::alice::1', requesterParty: 'party::auditor::kpmg', dataScope: 'Positions', granted: true, reason: 'KPMG Denetim kuralı ile eşleşti', timestamp: '2026-02-16T14:00:00.000Z' },
  { partyId: 'party::alice::1', requesterParty: 'party::partner::tifa', dataScope: 'All', granted: false, reason: 'Selective — TIFA kuralı yok', timestamp: '2026-02-15T10:00:00.000Z' },
  { partyId: 'party::alice::1', requesterParty: 'party::regulator::sec', dataScope: 'Transactions', granted: true, reason: 'SEC Raporlama — tüm veriler', timestamp: '2026-02-14T09:00:00.000Z' },
  { partyId: 'party::alice::1', requesterParty: 'party::bank::akbank', dataScope: 'Positions', granted: false, reason: 'Selective — kural bulunamadı', timestamp: '2026-02-13T15:30:00.000Z' },
];

export const usePrivacyStore = create<PrivacyState & PrivacyActions>()((set) => ({
  config: null,
  auditLog: [],
  isLoading: false,

  fetchPrivacyConfig: async () => {
    set({ isLoading: true });
    try {
      const { apiClient } = await import('@/lib/api/client');
      const res = await apiClient.get<PrivacyConfig>('/privacy/config');
      if (res.data && res.data.partyId) {
        set({ config: res.data, isLoading: false });
        return;
      }
      throw new Error('Invalid response');
    } catch {
      set({ config: MOCK_CONFIG, isLoading: false });
    }
  },

  setPrivacyLevel: async (level) => {
    set({ isLoading: true });
    try {
      const { apiClient } = await import('@/lib/api/client');
      const res = await apiClient.put<{ data: PrivacyConfig; transaction: TransactionMeta }>('/privacy/level', { level });
      if (res.data) {
        set({ config: res.data.data ?? res.data as unknown as PrivacyConfig, isLoading: false });
        return;
      }
      throw new Error('Invalid response');
    } catch {
      set((state) => ({
        config: state.config ? { ...state.config, privacyLevel: level, updatedAt: new Date().toISOString() } : null,
        isLoading: false,
      }));
    }
  },

  addDisclosure: async (rule) => {
    set({ isLoading: true });
    try {
      const { apiClient } = await import('@/lib/api/client');
      const res = await apiClient.post<{ data: DisclosureRule; transaction: TransactionMeta }>('/privacy/disclosure-rules', rule);
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
      const mock: DisclosureRule = {
        id: `rule-${Date.now()}`,
        ...rule,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      set((state) => ({
        config: state.config
          ? { ...state.config, disclosureRules: [...state.config.disclosureRules, mock] }
          : null,
        isLoading: false,
      }));
    }
  },

  removeDisclosure: async (ruleId) => {
    set({ isLoading: true });
    try {
      const { apiClient } = await import('@/lib/api/client');
      await apiClient.delete(`/privacy/disclosure-rules/${ruleId}`);
    } catch {
      // continue
    }
    set((state) => ({
      config: state.config
        ? { ...state.config, disclosureRules: state.config.disclosureRules.filter((r) => r.id !== ruleId) }
        : null,
      isLoading: false,
    }));
  },

  fetchAuditLog: async () => {
    set({ isLoading: true });
    try {
      const { apiClient } = await import('@/lib/api/client');
      const res = await apiClient.get<PrivacyAuditEntry[]>('/privacy/audit-log');
      if (Array.isArray(res.data)) {
        set({ auditLog: res.data, isLoading: false });
        return;
      }
      throw new Error('Invalid response');
    } catch {
      set({ auditLog: MOCK_AUDIT_LOG, isLoading: false });
    }
  },
}));
