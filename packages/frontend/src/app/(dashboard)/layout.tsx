'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { NotificationPanel } from '@/components/layout/NotificationPanel';
import { MobileNav } from '@/components/layout/MobileNav';
import { WalletDropdown } from '@/components/wallet/WalletDropdown';
import { ToastProvider, ToastViewport } from '@/components/ui/Toast';
import { useUIStore } from '@/stores/useUIStore';
import { useNotificationStore } from '@/stores/useNotificationStore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const ui = useUIStore();
  const notifs = useNotificationStore();

  // Apply theme to html element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', ui.theme);
  }, [ui.theme]);

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar — hidden on mobile */}
        <div
          className={cn(
            'hidden md:flex shrink-0 transition-all duration-300',
            ui.sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
          )}
        >
          <Sidebar collapsed={ui.sidebarCollapsed} />
        </div>

        {/* Main area */}
        <div className="flex flex-1 flex-col min-w-0">
          <Topbar
            onSearchClick={() => ui.setCommandPaletteOpen(true)}
            onNotificationClick={() => ui.toggleNotificationPanel()}
            onThemeToggle={ui.toggleTheme}
            theme={ui.theme}
            unreadCount={notifs.unreadCount}
            walletSlot={<WalletDropdown />}
          />

          <main className="flex-1 overflow-y-auto bg-bg-primary pb-20 md:pb-0">
            <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-6 md:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />

      {/* Overlay panels */}
      <CommandPalette
        open={ui.commandPaletteOpen}
        onOpenChange={ui.setCommandPaletteOpen}
        onNavigate={(href) => router.push(href)}
      />
      <NotificationPanel
        open={ui.notificationPanelOpen}
        onClose={() => ui.setNotificationPanelOpen(false)}
        notifications={notifs.notifications}
        onMarkAllRead={notifs.markAllAsRead}
      />

      <ToastViewport />
    </ToastProvider>
  );
}
