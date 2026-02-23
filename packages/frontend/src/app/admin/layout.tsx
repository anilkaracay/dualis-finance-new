'use client';

import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { ToastProvider, ToastViewport } from '@/components/ui/Toast';
import { useUIStore, applyTheme, resolveTheme } from '@/stores/useUIStore';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const ui = useUIStore();

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  // Apply theme
  useEffect(() => {
    applyTheme(ui.themePreference);

    if (ui.themePreference === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => {
        document.documentElement.setAttribute('data-theme', resolveTheme('system'));
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [ui.themePreference]);

  return (
    <AdminAuthGuard>
      <ToastProvider>
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <div
            className={cn(
              'hidden lg:flex shrink-0 transition-all duration-200',
              sidebarCollapsed ? 'w-16' : 'w-60'
            )}
          >
            <AdminSidebar
              collapsed={sidebarCollapsed}
              onToggleCollapse={toggleSidebar}
            />
          </div>

          {/* Main area */}
          <div className="flex flex-1 flex-col min-w-0">
            <AdminTopbar
              onSearchClick={() => {
                // TODO: Admin command palette
              }}
            />

            <main className="flex-1 overflow-y-auto bg-bg-primary">
              <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 lg:px-8 lg:py-8">
                {children}
              </div>
            </main>
          </div>
        </div>

        {/* Mobile guard */}
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-primary lg:hidden">
          <div className="text-center px-6">
            <p className="text-lg font-semibold text-text-primary mb-2">Desktop Required</p>
            <p className="text-sm text-text-secondary">
              The admin panel requires a screen width of at least 1024px.
            </p>
          </div>
        </div>

        <ToastViewport />
      </ToastProvider>
    </AdminAuthGuard>
  );
}
