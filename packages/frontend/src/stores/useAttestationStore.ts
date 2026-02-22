'use client';

import { create } from 'zustand';
import type { OffChainAttestation, AttestationType, ZKProof } from '@dualis/shared';

interface AttestationState {
  attestations: OffChainAttestation[];
  isLoading: boolean;
  error: string | null;
}

interface AttestationActions {
  fetchAttestations: () => Promise<void>;
  addAttestation: (type: AttestationType, provider: string, claimedRange: string, proof: ZKProof, expiresAt: string) => Promise<void>;
  revokeAttestation: (id: string) => Promise<void>;
}

const MOCK_ATTESTATIONS: OffChainAttestation[] = [
  {
    id: 'att-001',
    type: 'credit_bureau',
    provider: 'Findeks',
    claimedRange: 'excellent',
    proof: {
      proofData: 'zkp-findeks-mock-001',
      verifierKey: 'vk-findeks-v1',
      publicInputs: ['range:excellent', 'timestamp:2026-01'],
      circuit: 'credit-range-v1',
      generatedAt: '2026-01-15T10:00:00.000Z',
    },
    issuedAt: '2026-01-15T10:00:00.000Z',
    expiresAt: '2026-07-15T10:00:00.000Z',
    revoked: false,
    verified: true,
  },
  {
    id: 'att-002',
    type: 'credit_bureau',
    provider: 'Experian',
    claimedRange: 'good',
    proof: {
      proofData: 'zkp-experian-mock-002',
      verifierKey: 'vk-experian-v1',
      publicInputs: ['range:good', 'timestamp:2025-06'],
      circuit: 'credit-range-v1',
      generatedAt: '2025-06-01T08:00:00.000Z',
    },
    issuedAt: '2025-06-01T08:00:00.000Z',
    expiresAt: '2025-12-01T08:00:00.000Z',
    revoked: false,
    verified: false,
  },
  {
    id: 'att-003',
    type: 'income_verification',
    provider: 'Experian',
    claimedRange: 'above_100k',
    proof: {
      proofData: 'zkp-experian-income-003',
      verifierKey: 'vk-experian-v1',
      publicInputs: ['range:above_100k', 'timestamp:2026-02'],
      circuit: 'income-range-v1',
      generatedAt: '2026-02-01T08:00:00.000Z',
    },
    issuedAt: '2026-02-01T08:00:00.000Z',
    expiresAt: '2026-08-01T08:00:00.000Z',
    revoked: false,
    verified: true,
  },
  {
    id: 'att-004',
    type: 'business_verification',
    provider: 'TOBB',
    claimedRange: 'verified',
    proof: {
      proofData: 'zkp-tobb-biz-004',
      verifierKey: 'vk-tobb-v1',
      publicInputs: ['status:verified'],
      circuit: 'biz-verify-v1',
      generatedAt: '2026-01-10T12:00:00.000Z',
    },
    issuedAt: '2026-01-10T12:00:00.000Z',
    expiresAt: '2027-01-10T12:00:00.000Z',
    revoked: false,
    verified: true,
  },
  {
    id: 'att-005',
    type: 'kyc_completion',
    provider: 'TIFA',
    claimedRange: 'verified',
    proof: {
      proofData: 'zkp-tifa-kyc-005',
      verifierKey: 'vk-tifa-v1',
      publicInputs: ['status:verified'],
      circuit: 'kyc-complete-v1',
      generatedAt: '2025-12-10T12:00:00.000Z',
    },
    issuedAt: '2025-12-10T12:00:00.000Z',
    expiresAt: '2026-12-10T12:00:00.000Z',
    revoked: false,
    verified: true,
  },
];

export const useAttestationStore = create<AttestationState & AttestationActions>()((set) => ({
  attestations: [],
  isLoading: false,
  error: null,

  fetchAttestations: async () => {
    set({ isLoading: true, error: null });
    try {
      const { apiClient } = await import('@/lib/api/client');
      const res = await apiClient.get<{ attestations: OffChainAttestation[] }>('/attestation/bundle');
      if (res.data && Array.isArray(res.data.attestations)) {
        set({ attestations: res.data.attestations, isLoading: false });
        return;
      }
      throw new Error('Invalid response');
    } catch {
      set({ attestations: MOCK_ATTESTATIONS, isLoading: false });
    }
  },

  addAttestation: async (type, provider, claimedRange, proof, expiresAt) => {
    set({ isLoading: true, error: null });
    try {
      const { apiClient } = await import('@/lib/api/client');
      const res = await apiClient.post<OffChainAttestation>('/attestation', {
        type,
        provider,
        claimedRange,
        proof,
        expiresAt,
      });
      if (res.data) {
        set((state) => ({
          attestations: [...state.attestations, res.data],
          isLoading: false,
        }));
        return;
      }
      throw new Error('Invalid response');
    } catch {
      const mock: OffChainAttestation = {
        id: `att-${Date.now()}`,
        type,
        provider,
        claimedRange,
        proof,
        issuedAt: new Date().toISOString(),
        expiresAt,
        revoked: false,
        verified: true,
      };
      set((state) => ({
        attestations: [...state.attestations, mock],
        isLoading: false,
      }));
    }
  },

  revokeAttestation: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { apiClient } = await import('@/lib/api/client');
      await apiClient.post(`/attestation/${id}/revoke`);
    } catch {
      // continue with local revocation
    }
    set((state) => ({
      attestations: state.attestations.map((a) =>
        a.id === id ? { ...a, revoked: true, verified: false } : a
      ),
      isLoading: false,
    }));
  },
}));
