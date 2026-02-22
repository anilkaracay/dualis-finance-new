// ============================================================================
// Wallet Integration & PartyLayer SDK — Shared Types
// ============================================================================

// ---------------------------------------------------------------------------
// Enums / Literal Unions
// ---------------------------------------------------------------------------

export type WalletType = 'metamask' | 'walletconnect' | 'ledger' | 'custodial' | 'canton-native';

export type CustodyMode = 'self-custody' | 'custodial';

export type TransactionRoutingMode = 'proxy' | 'wallet-sign' | 'auto';

export type TransactionStatus = 'pending' | 'submitted' | 'confirmed' | 'failed';

// ---------------------------------------------------------------------------
// Core Domain Types
// ---------------------------------------------------------------------------

export interface WalletConnection {
  connectionId: string;
  userId: string;
  walletAddress: string;
  walletType: WalletType;
  custodyMode: CustodyMode;
  isPrimary: boolean;
  label: string | null;
  connectedAt: string;
  lastActiveAt: string;
}

export interface PartyMapping {
  mappingId: string;
  userId: string;
  partyId: string;
  walletConnectionId: string | null;
  custodyMode: CustodyMode;
  isActive: boolean;
  createdAt: string;
}

export interface WalletPreferences {
  userId: string;
  defaultWalletConnectionId: string | null;
  signingThreshold: string;
  routingMode: TransactionRoutingMode;
  autoDisconnectMinutes: number;
  showTransactionConfirm: boolean;
  updatedAt: string;
}

export interface CustodialPartyInfo {
  custodialPartyId: string;
  userId: string;
  partyId: string;
  status: 'active' | 'revoked';
  createdAt: string;
}

export interface TransactionLog {
  transactionLogId: string;
  userId: string;
  partyId: string;
  walletConnectionId: string | null;
  txHash: string | null;
  templateId: string | null;
  choiceName: string | null;
  routingMode: TransactionRoutingMode;
  status: TransactionStatus;
  amountUsd: string | null;
  errorMessage: string | null;
  createdAt: string;
  confirmedAt: string | null;
}

// ---------------------------------------------------------------------------
// API Request Types
// ---------------------------------------------------------------------------

export interface ConnectWalletRequest {
  walletAddress: string;
  walletType: WalletType;
  signature: string;
  nonce: string;
  label?: string;
}

export interface DisconnectWalletRequest {
  walletConnectionId: string;
}

export interface UpdateWalletPreferencesRequest {
  defaultWalletConnectionId?: string;
  signingThreshold?: string;
  routingMode?: TransactionRoutingMode;
  autoDisconnectMinutes?: number;
  showTransactionConfirm?: boolean;
}

export interface SubmitTransactionRequest {
  templateId: string;
  choiceName: string;
  argument: Record<string, unknown>;
  contractId?: string;
  walletConnectionId?: string;
  forceRoutingMode?: TransactionRoutingMode;
  amountUsd?: string;
}

export interface SignTransactionRequest {
  signature: string;
}

// ---------------------------------------------------------------------------
// API Response Types
// ---------------------------------------------------------------------------

export interface TransactionResult {
  transactionLogId: string;
  txHash: string | null;
  status: TransactionStatus;
  routingMode: TransactionRoutingMode;
  requiresWalletSign: boolean;
  signingPayload?: string;
}
