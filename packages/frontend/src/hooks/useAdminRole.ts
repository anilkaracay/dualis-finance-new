'use client';

import { useAdminAuthStore } from '@/stores/useAdminAuthStore';

/**
 * Hook that provides role-based permission checks for admin UI.
 * Components use this to determine which actions/buttons to show/disable.
 */
export function useAdminRole() {
  const store = useAdminAuthStore();

  return {
    role: store.role,
    isAdmin: store.isAdmin(),
    isCompliance: store.isCompliance(),
    isViewer: store.isViewer(),
    hasAdminAccess: store.hasAdminAccess(),
    canWrite: store.canWrite(),
    canManagePools: store.canManagePools(),
    canManageCompliance: store.canManageCompliance(),
    canManageSettings: store.canManageSettings(),
    canViewAudit: store.canViewAudit(),
  };
}
