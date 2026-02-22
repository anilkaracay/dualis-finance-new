import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import type {
  WalletConnection,
  WalletPreferences,
  PartyMapping,
  TransactionResult,
  TransactionLog,
  ConnectWalletRequest,
  UpdateWalletPreferencesRequest,
} from '@dualis/shared';

export const walletApi = {
  connect: (data: ConnectWalletRequest) =>
    apiClient.post<WalletConnection>(ENDPOINTS.WALLET_CONNECT, data),

  disconnect: (walletConnectionId: string) =>
    apiClient.post<{ success: boolean }>(ENDPOINTS.WALLET_DISCONNECT, { walletConnectionId }),

  getConnections: () =>
    apiClient.get<WalletConnection[]>(ENDPOINTS.WALLET_CONNECTIONS),

  setPrimary: (connectionId: string) =>
    apiClient.post<{ success: boolean }>(ENDPOINTS.WALLET_CONNECTION_PRIMARY(connectionId)),

  getPreferences: () =>
    apiClient.get<WalletPreferences>(ENDPOINTS.WALLET_PREFERENCES),

  updatePreferences: (data: Partial<UpdateWalletPreferencesRequest>) =>
    apiClient.put<WalletPreferences>(ENDPOINTS.WALLET_PREFERENCES, data),

  submitTransaction: (data: {
    templateId: string;
    choiceName: string;
    argument: Record<string, unknown>;
    contractId?: string;
    walletConnectionId?: string;
    forceRoutingMode?: string;
    amountUsd?: string;
  }) => apiClient.post<TransactionResult>(ENDPOINTS.WALLET_TRANSACTION_SUBMIT, data),

  signTransaction: (transactionLogId: string, signature: string) =>
    apiClient.post<TransactionResult>(ENDPOINTS.WALLET_TRANSACTION_SIGN(transactionLogId), { signature }),

  getTransactionStatus: (transactionLogId: string) =>
    apiClient.get<TransactionLog>(ENDPOINTS.WALLET_TRANSACTION_STATUS(transactionLogId)),

  getTransactions: (params?: { limit?: number; offset?: number }) =>
    apiClient.get<TransactionLog[]>(ENDPOINTS.WALLET_TRANSACTIONS, { params }),

  getPartyMappings: () =>
    apiClient.get<PartyMapping[]>(ENDPOINTS.WALLET_PARTY_MAPPINGS),
};
