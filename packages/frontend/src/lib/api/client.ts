import axios from 'axios';
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { ApiError, ApiResponse } from '@dualis/shared';

/**
 * Axios-based API client for the Dualis Finance backend.
 *
 * - baseURL defaults to NEXT_PUBLIC_API_URL or http://localhost:4000/v1
 * - Request interceptor attaches JWT access token from Zustand persisted auth store
 * - Response interceptor unwraps { data: T } envelope
 * - 401 interceptor attempts token refresh before failing
 */
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1',
  timeout: 15_000,
  withCredentials: true, // Send CSRF double-submit cookie (MP22)
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// CSRF token management (MP22)
// ---------------------------------------------------------------------------

let csrfToken: string | null = null;

/**
 * Fetch a CSRF token from the backend.
 * Called once on app init and after any 403 CSRF error.
 */
export async function fetchCsrfToken(): Promise<void> {
  try {
    const response = await apiClient.get('/auth/csrf-token');
    const token = response.data?.token ?? response.data;
    if (typeof token === 'string') {
      csrfToken = token;
    }
  } catch {
    // CSRF may not be enabled — fail silently
  }
}

// ---------------------------------------------------------------------------
// Token refresh mutex — prevents concurrent refresh requests
// ---------------------------------------------------------------------------

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

// ---------------------------------------------------------------------------
// Request interceptor – attach auth token from persisted Zustand auth store
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('dualis-auth');
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (
            parsed !== null &&
            typeof parsed === 'object' &&
            'state' in parsed
          ) {
            const state = (parsed as { state: Record<string, unknown> }).state;
            if (typeof state.accessToken === 'string' && state.accessToken.length > 0) {
              config.headers.set('Authorization', `Bearer ${state.accessToken}`);
            }
          }
        }
      } catch {
        // localStorage or JSON parse failed — continue without auth
      }
    }
    // Attach CSRF token for state-changing requests (MP22)
    const method = config.method?.toUpperCase();
    if (csrfToken && (method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH')) {
      config.headers.set('X-CSRF-Token', csrfToken);
    }

    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// Response interceptor – unwrap { data: T } envelope + handle 401 refresh
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // If the backend wraps in ApiResponse<T> format, unwrap
    const body: unknown = response.data;
    if (
      body !== null &&
      typeof body === 'object' &&
      'data' in body
    ) {
      response.data = (body as ApiResponse<unknown>).data;
    }
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not a retry and not the refresh endpoint itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      if (isRefreshing) {
        // Wait for the ongoing refresh
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            originalRequest.headers.set('Authorization', `Bearer ${token}`);
            originalRequest._retry = true;
            resolve(apiClient(originalRequest));
          });
        });
      }

      isRefreshing = true;
      originalRequest._retry = true;

      try {
        // Get refresh token from store
        const raw = typeof window !== 'undefined' ? localStorage.getItem('dualis-auth') : null;
        let refreshToken: string | null = null;
        if (raw) {
          const parsed = JSON.parse(raw);
          refreshToken = parsed?.state?.refreshToken ?? null;
        }

        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const { data: refreshResponse } = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } },
        );

        const newSession = refreshResponse.data ?? refreshResponse;
        const newAccessToken = newSession.accessToken;

        // Update store
        if (typeof window !== 'undefined' && raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.state) {
            parsed.state.accessToken = newAccessToken;
            parsed.state.refreshToken = newSession.refreshToken;
            parsed.state.user = newSession.user;
            localStorage.setItem('dualis-auth', JSON.stringify(parsed));
          }
        }

        isRefreshing = false;
        onRefreshed(newAccessToken);

        originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];

        // Clear auth state
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('dualis-auth');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed?.state) {
                parsed.state.accessToken = null;
                parsed.state.refreshToken = null;
                parsed.state.user = null;
                parsed.state.isAuthenticated = false;
                localStorage.setItem('dualis-auth', JSON.stringify(parsed));
              }
            }
            // Clear auth cookie
            document.cookie = 'dualis-auth-token=; path=/; max-age=0; SameSite=Lax';
          } catch {
            // ignore
          }

          // Redirect to auth page
          if (window.location.pathname !== '/auth' && !window.location.pathname.startsWith('/auth/')) {
            window.location.href = '/auth';
          }
        }

        return Promise.reject(refreshError);
      }
    }

    // Standard error extraction
    if (error.response?.data?.error?.message) {
      const enriched = new Error(error.response.data.error.message);
      enriched.name = error.response.data.error.code ?? 'API_ERROR';
      return Promise.reject(enriched);
    }
    return Promise.reject(error);
  },
);

// ---------------------------------------------------------------------------
// Error parser – safely extract a displayable message from any error shape
// ---------------------------------------------------------------------------
const TECHNICAL_ERROR_PATTERNS = [
  /getaddrinfo\s+\w+/i,
  /ECONNREFUSED/i,
  /ETIMEDOUT/i,
  /ECONNRESET/i,
  /socket hang up/i,
  /ERR_NETWORK/i,
  /Network Error/i,
  /Request failed with status code 5\d{2}/i,
];

export function parseError(err: unknown): string {
  let message: string;

  if (err instanceof Error) {
    message = err.message;
  } else if (typeof err === 'string') {
    message = err;
  } else if (
    err !== null &&
    typeof err === 'object' &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  ) {
    message = (err as { message: string }).message;
  } else {
    return 'An unexpected error occurred';
  }

  // Sanitize any raw technical messages that slip through
  for (const pattern of TECHNICAL_ERROR_PATTERNS) {
    if (pattern.test(message)) {
      return 'Service temporarily unavailable. Please try again.';
    }
  }

  return message;
}
