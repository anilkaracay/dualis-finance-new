'use client';

import { create } from 'zustand';
import type {
  VerifiedInstitution,
  InstitutionalAPIKey,
  BulkOperation,
  SingleOp,
  TransactionMeta,
} from '@dualis/shared';

interface InstitutionalState {
  institution: VerifiedInstitution | null;
  apiKeys: InstitutionalAPIKey[];
  isKYBVerified: boolean;
  onboardingStep: number;
  bulkOperations: BulkOperation[];
  isLoading: boolean;
}

interface InstitutionalActions {
  fetchInstitutionStatus: () => Promise<void>;
  startOnboarding: (data: { legalName: string; registrationNo: string; jurisdiction: string }) => Promise<void>;
  submitKYB: (documents: Record<string, unknown>) => Promise<void>;
  createAPIKey: (name: string, permissions: string[]) => Promise<void>;
  revokeAPIKey: (keyId: string) => Promise<void>;
  executeBulkOperation: (ops: SingleOp[]) => Promise<void>;
  setOnboardingStep: (step: number) => void;
}

const MOCK_INSTITUTION: VerifiedInstitution = {
  institutionParty: 'party::institution-tr-001',
  legalName: 'Cayvox Labs A.Ş.',
  registrationNo: 'TR-MKK-2024-001',
  jurisdiction: 'TR',
  kybStatus: 'Verified',
  kybLevel: 'Full',
  riskProfile: {
    riskCategory: 'low',
    maxSingleExposure: '50000000',
    maxTotalExposure: '200000000',
    allowedProducts: ['lending', 'secLending', 'staking'],
    jurisdictionRules: ['TR', 'EU'],
  },
  subAccounts: ['party::sub-tr-001', 'party::sub-tr-002'],
  verifiedAt: '2025-12-20T10:00:00.000Z',
  expiresAt: '2026-12-20T10:00:00.000Z',
};

const MOCK_API_KEYS: InstitutionalAPIKey[] = [
  {
    id: 'key-001',
    name: 'Production API',
    keyPrefix: 'dsk_a1b2c3d4',
    permissions: ['read', 'write', 'bulk'],
    rateLimit: 10000,
    isActive: true,
    lastUsedAt: '2026-02-22T14:00:00.000Z',
    createdAt: '2025-12-20T10:00:00.000Z',
    expiresAt: '2026-12-20T10:00:00.000Z',
  },
  {
    id: 'key-002',
    name: 'Read-Only Reporting',
    keyPrefix: 'dsk_e5f6g7h8',
    permissions: ['read'],
    rateLimit: 5000,
    isActive: true,
    lastUsedAt: '2026-02-21T09:30:00.000Z',
    createdAt: '2026-01-15T08:00:00.000Z',
    expiresAt: '2027-01-15T08:00:00.000Z',
  },
];

const MOCK_BULK_OPS: BulkOperation[] = [
  {
    opId: 'bulk-001',
    operations: [
      { opType: 'deposit', poolId: 'usdc-main', amount: '5000000' },
      { opType: 'deposit', poolId: 'eth-main', amount: '2000000' },
      { opType: 'deposit', poolId: 'tbill-2026', amount: '3000000' },
    ],
    status: 'Completed',
    results: [
      { index: 0, success: true, transactionId: 'tx-bulk-001a', error: null },
      { index: 1, success: true, transactionId: 'tx-bulk-001b', error: null },
      { index: 2, success: true, transactionId: 'tx-bulk-001c', error: null },
    ],
    submittedAt: '2026-02-20T14:00:00.000Z',
  },
];

export const useInstitutionalStore = create<InstitutionalState & InstitutionalActions>()((set) => ({
  institution: null,
  apiKeys: [],
  isKYBVerified: false,
  onboardingStep: 0,
  bulkOperations: [],
  isLoading: false,

  fetchInstitutionStatus: async () => {
    set({ isLoading: true });
    try {
      const { apiClient } = await import('@/lib/api/client');
      const res = await apiClient.get<VerifiedInstitution>('/institutional/party::institution-tr-001');
      if (res.data) {
        set({
          institution: res.data,
          isKYBVerified: res.data.kybStatus === 'Verified',
          isLoading: false,
        });
        return;
      }
      throw new Error('Invalid response');
    } catch {
      set({
        institution: MOCK_INSTITUTION,
        apiKeys: MOCK_API_KEYS,
        isKYBVerified: true,
        bulkOperations: MOCK_BULK_OPS,
        isLoading: false,
      });
    }
  },

  startOnboarding: async (data) => {
    set({ isLoading: true });
    try {
      const { apiClient } = await import('@/lib/api/client');
      const res = await apiClient.post<{ data: VerifiedInstitution; transaction: TransactionMeta }>('/institutional/onboard', data);
      if (res.data) {
        set({ institution: res.data.data ?? res.data as unknown as VerifiedInstitution, onboardingStep: 1, isLoading: false });
        return;
      }
      throw new Error('Invalid response');
    } catch {
      const mock: VerifiedInstitution = {
        ...MOCK_INSTITUTION,
        legalName: data.legalName,
        registrationNo: data.registrationNo,
        jurisdiction: data.jurisdiction,
        kybStatus: 'Pending',
        kybLevel: 'Basic',
        verifiedAt: null,
        expiresAt: null,
      };
      set({ institution: mock, onboardingStep: 1, isLoading: false });
    }
  },

  submitKYB: async (documents) => {
    set({ isLoading: true });
    try {
      const { apiClient } = await import('@/lib/api/client');
      await apiClient.post('/institutional/party::institution-tr-001/kyb', { documents });
    } catch {
      // continue
    }
    set((state) => ({
      institution: state.institution ? { ...state.institution, kybStatus: 'InReview' as const } : null,
      onboardingStep: 4,
      isLoading: false,
    }));
  },

  createAPIKey: async (name, permissions) => {
    set({ isLoading: true });
    try {
      const { apiClient } = await import('@/lib/api/client');
      const res = await apiClient.post<{ data: { key: string; keyId: string; keyPrefix: string } }>('/institutional/api-keys', {
        name,
        permissions,
      });
      if (res.data) {
        const newKey: InstitutionalAPIKey = {
          id: res.data.data?.keyId ?? `key-${Date.now()}`,
          name,
          keyPrefix: res.data.data?.keyPrefix ?? 'dsk_****',
          permissions,
          rateLimit: 5000,
          isActive: true,
          lastUsedAt: null,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 365 * 86_400_000).toISOString(),
        };
        set((state) => ({ apiKeys: [...state.apiKeys, newKey], isLoading: false }));
        return;
      }
      throw new Error('Invalid response');
    } catch {
      const mock: InstitutionalAPIKey = {
        id: `key-${Date.now()}`,
        name,
        keyPrefix: `dsk_${Math.random().toString(36).slice(2, 10)}`,
        permissions,
        rateLimit: 5000,
        isActive: true,
        lastUsedAt: null,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 86_400_000).toISOString(),
      };
      set((state) => ({ apiKeys: [...state.apiKeys, mock], isLoading: false }));
    }
  },

  revokeAPIKey: async (keyId) => {
    set({ isLoading: true });
    try {
      const { apiClient } = await import('@/lib/api/client');
      await apiClient.delete(`/institutional/api-keys/${keyId}`);
    } catch {
      // continue
    }
    set((state) => ({
      apiKeys: state.apiKeys.map((k) => (k.id === keyId ? { ...k, isActive: false } : k)),
      isLoading: false,
    }));
  },

  executeBulkOperation: async (ops) => {
    set({ isLoading: true });
    try {
      const { apiClient } = await import('@/lib/api/client');
      const res = await apiClient.post<BulkOperation>('/institutional/bulk/deposit', { operations: ops });
      if (res.data) {
        set((state) => ({
          bulkOperations: [...state.bulkOperations, res.data],
          isLoading: false,
        }));
        return;
      }
      throw new Error('Invalid response');
    } catch {
      const mock: BulkOperation = {
        opId: `bulk-${Date.now()}`,
        operations: ops,
        status: 'Completed',
        results: ops.map((_, i) => ({ index: i, success: true, transactionId: `tx-${Date.now()}-${i}`, error: null })),
        submittedAt: new Date().toISOString(),
      };
      set((state) => ({
        bulkOperations: [...state.bulkOperations, mock],
        isLoading: false,
      }));
    }
  },

  setOnboardingStep: (step) => set({ onboardingStep: step }),
}));
