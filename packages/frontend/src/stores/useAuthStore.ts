'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@dualis/shared';
import { authApi } from '@/lib/api/auth';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerRetail: (email: string, password: string, displayName?: string) => Promise<void>;
  registerInstitutional: (data: {
    email: string;
    password: string;
    companyName: string;
    repFirstName: string;
    repLastName: string;
    repTitle: string;
  }) => Promise<{ institutionId: string }>;
  loginWithWallet: (walletAddress: string, signature: string, nonce: string) => Promise<{ isNewUser: boolean }>;
  refreshSession: () => Promise<boolean>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
  setUser: (user: AuthUser) => void;
}

function setAuthCookie(hasToken: boolean) {
  if (typeof document === 'undefined') return;
  if (hasToken) {
    document.cookie = 'dualis-auth-token=1; path=/; max-age=604800; SameSite=Lax';
  } else {
    document.cookie = 'dualis-auth-token=; path=/; max-age=0; SameSite=Lax';
  }
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      loginWithEmail: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authApi.loginWithEmail({ email, password });
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          setAuthCookie(true);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Login failed';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      registerRetail: async (email, password, displayName) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authApi.registerRetail({ email, password, ...(displayName ? { displayName } : {}) });
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          setAuthCookie(true);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Registration failed';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      registerInstitutional: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const { data: result } = await authApi.registerInstitutional(data);
          set({
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          setAuthCookie(true);
          return { institutionId: result.institutionId };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Registration failed';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      loginWithWallet: async (walletAddress, signature, nonce) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authApi.verifyWallet({ walletAddress, signature, nonce });
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          setAuthCookie(true);
          return { isNewUser: data.isNewUser };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Wallet login failed';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      refreshSession: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;

        try {
          const { data } = await authApi.refreshToken(refreshToken);
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
          });
          setAuthCookie(true);
          return true;
        } catch {
          // Refresh failed — clear auth state
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          setAuthCookie(false);
          return false;
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        try {
          await authApi.logout(refreshToken ?? undefined);
        } catch {
          // Ignore logout API errors
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
        setAuthCookie(false);
      },

      fetchCurrentUser: async () => {
        try {
          const { data } = await authApi.getMe();
          set({ user: data, isAuthenticated: true });
        } catch {
          set({ user: null, isAuthenticated: false });
        }
      },

      clearError: () => set({ error: null }),

      setUser: (user) => set({ user }),
    }),
    {
      name: 'dualis-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
