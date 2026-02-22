'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemePreference = 'dark' | 'light' | 'system';
type ResolvedTheme = 'dark' | 'light';

interface UIState {
  sidebarCollapsed: boolean;
  rightPanelOpen: boolean;
  rightPanelTitle: string;
  rightPanelContent: string | null;
  commandPaletteOpen: boolean;
  notificationPanelOpen: boolean;
  themePreference: ThemePreference;
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
  setTheme: (theme: ThemePreference) => void;
  cycleTheme: () => void;
}

function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref !== 'system') return pref;
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(pref: ThemePreference) {
  if (typeof document === 'undefined') return;
  const resolved = resolveTheme(pref);
  const el = document.documentElement;

  // Add transition class for smooth switch
  el.classList.add('theme-transitioning');
  el.setAttribute('data-theme', resolved);

  // Remove transition class after animation completes
  setTimeout(() => el.classList.remove('theme-transitioning'), 350);
}

const CYCLE_ORDER: ThemePreference[] = ['dark', 'light', 'system'];

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      rightPanelOpen: false,
      rightPanelTitle: '',
      rightPanelContent: null,
      commandPaletteOpen: false,
      notificationPanelOpen: false,
      themePreference: 'dark' as ThemePreference,

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

      setTheme: (theme) => {
        set({ themePreference: theme });
        applyTheme(theme);
      },
      cycleTheme: () => {
        const current = get().themePreference;
        const idx = CYCLE_ORDER.indexOf(current);
        const next = CYCLE_ORDER[(idx + 1) % CYCLE_ORDER.length]!;
        set({ themePreference: next });
        applyTheme(next);
      },
    }),
    {
      name: 'dualis-ui',
      partialize: (state) => ({ themePreference: state.themePreference, sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
);

export { resolveTheme, applyTheme };
export type { ThemePreference, ResolvedTheme };
