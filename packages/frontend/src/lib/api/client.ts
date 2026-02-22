import axios from 'axios';
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { ApiError, ApiResponse } from '@dualis/shared';

/**
 * Axios-based API client for the Dualis Finance backend.
 *
 * - baseURL defaults to NEXT_PUBLIC_API_URL or http://localhost:4000/v1
 * - Request interceptor attaches auth token from zustand persisted wallet storage
 * - Response interceptor unwraps { data: T } envelope
 * - Error interceptor extracts structured error messages
 */
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1',
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Request interceptor – attach auth token from persisted Zustand wallet store
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('dualis-wallet');
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (
            parsed !== null &&
            typeof parsed === 'object' &&
            'state' in parsed
          ) {
            const state = (parsed as { state: Record<string, unknown> }).state;
            if (typeof state.party === 'string' && state.party.length > 0) {
              config.headers.set('X-Party-Id', state.party);
            }
            if (typeof state.walletAddress === 'string' && state.walletAddress.length > 0) {
              config.headers.set('Authorization', `Bearer mock-jwt-${state.walletAddress}`);
            }
          }
        }
      } catch {
        // localStorage or JSON parse failed — continue without auth
      }
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// Response interceptor – unwrap { data: T } envelope
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
  (error: AxiosError<ApiError>) => {
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
export function parseError(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === 'string') {
    return err;
  }
  if (
    err !== null &&
    typeof err === 'object' &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  ) {
    return (err as { message: string }).message;
  }
  return 'An unexpected error occurred';
}
