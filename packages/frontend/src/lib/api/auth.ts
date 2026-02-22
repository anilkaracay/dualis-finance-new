import { apiClient } from './client';
import type {
  AuthSession,
  AuthUser,
  WalletNonceResponse,
  InstitutionalOnboardingStatus,
} from '@dualis/shared';

export const authApi = {
  // Registration
  registerRetail: (data: { email: string; password: string; displayName?: string }) =>
    apiClient.post<AuthSession>('/auth/register/retail', data),

  registerInstitutional: (data: {
    email: string;
    password: string;
    companyName: string;
    repFirstName: string;
    repLastName: string;
    repTitle: string;
  }) => apiClient.post<AuthSession & { institutionId: string }>('/auth/register/institutional', data),

  // Login
  loginWithEmail: (data: { email: string; password: string }) =>
    apiClient.post<AuthSession>('/auth/login', data),

  // Wallet
  getWalletNonce: (walletAddress: string) =>
    apiClient.post<WalletNonceResponse>('/auth/wallet/nonce', { walletAddress }),

  verifyWallet: (data: { walletAddress: string; signature: string; nonce: string }) =>
    apiClient.post<AuthSession & { isNewUser: boolean }>('/auth/wallet/verify', data),

  // Session
  refreshToken: (refreshToken: string) =>
    apiClient.post<AuthSession>('/auth/refresh', { refreshToken }),

  logout: (refreshToken?: string) =>
    apiClient.post('/auth/logout', refreshToken ? { refreshToken } : {}),

  getMe: () =>
    apiClient.get<AuthUser>('/auth/me'),

  // Email verification
  verifyEmail: (token: string) =>
    apiClient.post<{ success: boolean; user: AuthUser }>('/auth/verify-email', { token }),

  // Password
  forgotPassword: (email: string) =>
    apiClient.post<{ success: boolean }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    apiClient.post<{ success: boolean }>('/auth/reset-password', { token, newPassword }),

  // Wallet linking
  linkWallet: (data: { walletAddress: string; signature: string; nonce: string }) =>
    apiClient.post<{ success: boolean }>('/auth/link-wallet', data),

  // Onboarding
  submitKYB: (data: Record<string, unknown>) =>
    apiClient.post<{ status: string; step: number }>('/onboarding/kyb/submit', data),

  updateKYBStep: (step: number, data: Record<string, unknown>) =>
    apiClient.put<{ step: number }>('/onboarding/kyb/update', { step, data }),

  getKYBStatus: () =>
    apiClient.get<InstitutionalOnboardingStatus>('/onboarding/kyb/status'),

  uploadDocument: (data: {
    documentType: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
  }) => apiClient.post<{ documentId: string; status: string }>('/onboarding/kyb/documents', data),

  submitUBO: (data: {
    beneficialOwners: Array<Record<string, unknown>>;
    confirmationChecked: boolean;
  }) => apiClient.post<{ count: number }>('/onboarding/kyb/ubo', data),

  submitForReview: () =>
    apiClient.post<{ status: string; applicationId: string }>('/onboarding/kyb/review-submit'),

  initiateKYC: () =>
    apiClient.post<{ status: string; widgetUrl: string | null }>('/onboarding/kyc/initiate'),

  getKYCStatus: () =>
    apiClient.get<{ status: string }>('/onboarding/kyc/status'),
};
