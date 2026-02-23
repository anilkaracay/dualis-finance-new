'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAdminAuthStore } from '@/stores/useAdminAuthStore';

const ADMIN_ROLES = new Set(['admin', 'compliance_officer', 'viewer']);

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const setRole = useAdminAuthStore((s) => s.setRole);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace('/auth/login');
      return;
    }

    if (!ADMIN_ROLES.has(user.role)) {
      router.replace('/overview');
      return;
    }

    setRole(user.role);
  }, [isAuthenticated, isLoading, user, router, setRole]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-teal border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !user || !ADMIN_ROLES.has(user.role)) {
    return null;
  }

  return <>{children}</>;
}
