'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * Client-side auth guard that wraps protected layouts.
 *
 * On mount it checks the Zustand auth state:
 * - If authenticated, renders children immediately.
 * - If not authenticated, attempts a token refresh.
 * - If refresh fails, redirects to /auth with the current path as redirect param.
 *
 * This complements the Edge Middleware (cookie-based check) with a more
 * thorough client-side verification using the actual JWT.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, refreshSession, accessToken } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function verify() {
      if (isAuthenticated && accessToken) {
        setChecked(true);
        return;
      }

      // Try refreshing the session
      const success = await refreshSession();
      if (success) {
        setChecked(true);
      } else {
        router.replace(`/auth?redirect=${encodeURIComponent(pathname)}`);
      }
    }

    verify();
  }, [isAuthenticated, accessToken, refreshSession, router, pathname]);

  if (!checked) {
    // Minimal loading state — avoids flash of dashboard content
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent-teal/30 border-t-accent-teal rounded-full animate-spin" />
          <span className="text-xs text-text-tertiary font-jakarta">Loading...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
