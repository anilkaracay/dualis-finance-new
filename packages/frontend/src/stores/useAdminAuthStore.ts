'use client';

import { create } from 'zustand';
import type { UserRole } from '@dualis/shared';

interface AdminAuthState {
  role: UserRole | null;
  setRole: (role: UserRole | null) => void;

  // Computed permission helpers
  isAdmin: () => boolean;
  isCompliance: () => boolean;
  isViewer: () => boolean;
  hasAdminAccess: () => boolean;
  canWrite: () => boolean;
  canManagePools: () => boolean;
  canManageCompliance: () => boolean;
  canManageSettings: () => boolean;
  canViewAudit: () => boolean;
}

export const useAdminAuthStore = create<AdminAuthState>((set, get) => ({
  role: null,
  setRole: (role) => set({ role }),

  isAdmin: () => get().role === 'admin',
  isCompliance: () => get().role === 'compliance_officer',
  isViewer: () => get().role === 'viewer',

  hasAdminAccess: () => {
    const r = get().role;
    return r === 'admin' || r === 'compliance_officer' || r === 'viewer';
  },

  canWrite: () => {
    const r = get().role;
    return r === 'admin' || r === 'compliance_officer';
  },

  canManagePools: () => get().role === 'admin',
  canManageCompliance: () => {
    const r = get().role;
    return r === 'admin' || r === 'compliance_officer';
  },
  canManageSettings: () => get().role === 'admin',
  canViewAudit: () => get().role === 'admin',
}));
