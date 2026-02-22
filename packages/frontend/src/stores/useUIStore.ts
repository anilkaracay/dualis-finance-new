'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';

interface UIState {
  sidebarCollapsed: boolean;
  rightPanelOpen: boolean;
  rightPanelTitle: string;
  rightPanelContent: string | null;
  commandPaletteOpen: boolean;
  notificationPanelOpen: boolean;
  theme: Theme;
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openRightPanel: (title: string, contentId: string) => void;
  closeRightPanel: () => void;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleNotificationPanel: () => void;
  setNotificationPanelOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      rightPanelOpen: false,
      rightPanelTitle: '',
      rightPanelContent: null,
      commandPaletteOpen: false,
      notificationPanelOpen: false,
      theme: 'dark' as Theme,

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      openRightPanel: (title, contentId) =>
        set({ rightPanelOpen: true, rightPanelTitle: title, rightPanelContent: contentId }),
      closeRightPanel: () =>
        set({ rightPanelOpen: false, rightPanelTitle: '', rightPanelContent: null }),

      toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      toggleNotificationPanel: () =>
        set((s) => ({ notificationPanelOpen: !s.notificationPanelOpen })),
      setNotificationPanelOpen: (open) => set({ notificationPanelOpen: open }),

      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'dark' ? 'light' as Theme : 'dark' as Theme })),
    }),
    {
      name: 'dualis-ui',
      partialize: (state) => ({ theme: state.theme, sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
);
