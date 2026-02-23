// ---------------------------------------------------------------------------
// Notification Type System — MP20
// ---------------------------------------------------------------------------

/** Top-level notification categories */
export type NotificationCategory =
  | 'financial'
  | 'auth'
  | 'compliance'
  | 'governance'
  | 'system';

/** All notification event types */
export type NotificationType =
  // Financial (high priority — money at risk)
  | 'HEALTH_FACTOR_CAUTION'
  | 'HEALTH_FACTOR_DANGER'
  | 'HEALTH_FACTOR_CRITICAL'
  | 'LIQUIDATION_EXECUTED'
  | 'LIQUIDATION_WARNING'
  | 'INTEREST_MILESTONE'
  | 'RATE_CHANGE_SIGNIFICANT'
  | 'SUPPLY_CAP_APPROACHING'
  | 'BORROW_CAP_APPROACHING'
  // Auth & Compliance (medium priority — security)
  | 'KYB_RECEIVED'
  | 'KYB_APPROVED'
  | 'KYB_REJECTED'
  | 'DOCUMENT_EXPIRY_30D'
  | 'DOCUMENT_EXPIRY_7D'
  | 'DOCUMENT_EXPIRY_1D'
  | 'NEW_LOGIN_DEVICE'
  | 'PASSWORD_CHANGED'
  | 'WALLET_LINKED'
  | 'WALLET_UNLINKED'
  // KYC/AML Compliance (MP21)
  | 'KYC_SUBMITTED'
  | 'KYC_APPROVED'
  | 'KYC_REJECTED'
  | 'KYC_EXPIRED'
  | 'KYC_RESUBMISSION_REQUIRED'
  | 'AML_WALLET_FLAGGED'
  | 'AML_WALLET_BLOCKED'
  | 'AML_WALLET_CLEARED'
  | 'SANCTIONS_MATCH_FOUND'
  | 'PEP_MATCH_FOUND'
  | 'RISK_LEVEL_CHANGED'
  | 'COMPLIANCE_REVIEW_REQUIRED'
  | 'GDPR_REQUEST_COMPLETED'
  // Governance (low priority — informational)
  | 'PROPOSAL_CREATED'
  | 'VOTE_DEADLINE_24H'
  | 'PROPOSAL_EXECUTED'
  | 'PROPOSAL_REJECTED'
  // System (admin + internal)
  | 'ORACLE_STALE_PRICE'
  | 'ORACLE_CIRCUIT_BREAKER'
  | 'PROTOCOL_PAUSED'
  | 'PROTOCOL_RESUMED'
  | 'SYSTEM_MAINTENANCE';

/** Notification severity levels */
export type NotificationSeverity = 'info' | 'warning' | 'critical';

/** Delivery channels */
export type NotificationChannel = 'in_app' | 'email' | 'webhook' | 'websocket';

/** Lifecycle status of a notification */
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'read';

/** Frontend display type mapping */
export type NotificationDisplayType = 'warning' | 'critical' | 'success' | 'governance' | 'info';

// ---------------------------------------------------------------------------
// Core event payload — emitted by event sources into NotificationBus
// ---------------------------------------------------------------------------

export interface NotificationEvent {
  type: NotificationType;
  category: NotificationCategory;
  severity: NotificationSeverity;
  partyId: string;
  title: string;
  message: string;
  /** Event-specific data payload */
  data: Record<string, unknown>;
  /** Which channels to deliver to (overrides defaults if provided) */
  channels?: NotificationChannel[];
  /** Dedup key — same key within the dedup window → skip */
  deduplicationKey?: string;
  /** Scheduled delivery (for digest batching) */
  scheduledAt?: Date;
  /** Navigation link for frontend */
  link?: string;
}

// ---------------------------------------------------------------------------
// Stored notification — persisted in DB
// ---------------------------------------------------------------------------

export interface StoredNotification {
  id: string;
  partyId: string;
  type: NotificationType;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  message: string;
  data: Record<string, unknown>;
  status: NotificationStatus;
  channels: NotificationChannel[];
  link: string | null;
  readAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// User notification preferences
// ---------------------------------------------------------------------------

export interface UserNotificationPreferences {
  partyId: string;
  channels: {
    inApp: boolean;
    email: boolean;
    webhook: boolean;
  };
  financial: {
    enabled: boolean;
    hfCautionThreshold: number;
    hfDangerThreshold: number;
    hfCriticalThreshold: number;
    interestMilestones: boolean;
    rateChanges: boolean;
  };
  auth: {
    enabled: boolean;
    newLoginAlerts: boolean;
  };
  governance: {
    enabled: boolean;
  };
  digest: {
    enabled: boolean;
    frequency: 'daily' | 'weekly';
    time: string; // UTC HH:MM
  };
}

// ---------------------------------------------------------------------------
// Webhook types
// ---------------------------------------------------------------------------

export interface WebhookEndpoint {
  id: string;
  partyId: string;
  url: string;
  secret: string;
  events: NotificationType[];
  isActive: boolean;
  failureCount: number;
  lastDeliveryAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDeliveryLog {
  id: string;
  webhookEndpointId: string;
  notificationId: string;
  httpStatus: number | null;
  responseBody: string | null;
  attempt: number;
  success: boolean;
  error: string | null;
  deliveredAt: string;
}

export interface EmailDeliveryLog {
  id: string;
  notificationId: string;
  partyId: string;
  toAddress: string;
  templateId: string;
  resendId: string | null;
  status: 'sent' | 'delivered' | 'bounced' | 'failed';
  error: string | null;
  sentAt: string;
}

// ---------------------------------------------------------------------------
// Webhook delivery payload (what external endpoints receive)
// ---------------------------------------------------------------------------

export interface WebhookPayload {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  severity: NotificationSeverity;
  timestamp: string;
  data: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// API request/response types
// ---------------------------------------------------------------------------

export interface NotificationListQuery {
  page?: number;
  limit?: number;
  category?: NotificationCategory;
  severity?: NotificationSeverity;
  unread?: boolean;
}

export interface NotificationListResponse {
  data: StoredNotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UnreadCountResponse {
  count: number;
}

export interface CreateWebhookRequest {
  url: string;
  events: NotificationType[];
}

export interface UpdateWebhookRequest {
  url?: string;
  events?: NotificationType[];
  isActive?: boolean;
}

export interface TestNotificationRequest {
  channel: 'email' | 'webhook' | 'in_app';
}

// ---------------------------------------------------------------------------
// Default mappings — type → category, severity, channels
// ---------------------------------------------------------------------------

export interface NotificationDefaults {
  category: NotificationCategory;
  severity: NotificationSeverity;
  channels: NotificationChannel[];
}

export const NOTIFICATION_DEFAULTS: Record<NotificationType, NotificationDefaults> = {
  // Financial
  HEALTH_FACTOR_CAUTION:    { category: 'financial',   severity: 'warning',  channels: ['in_app', 'websocket'] },
  HEALTH_FACTOR_DANGER:     { category: 'financial',   severity: 'warning',  channels: ['in_app', 'websocket', 'email'] },
  HEALTH_FACTOR_CRITICAL:   { category: 'financial',   severity: 'critical', channels: ['in_app', 'websocket', 'email', 'webhook'] },
  LIQUIDATION_EXECUTED:     { category: 'financial',   severity: 'critical', channels: ['in_app', 'websocket', 'email', 'webhook'] },
  LIQUIDATION_WARNING:      { category: 'financial',   severity: 'warning',  channels: ['in_app', 'websocket', 'email'] },
  INTEREST_MILESTONE:       { category: 'financial',   severity: 'info',     channels: ['in_app'] },
  RATE_CHANGE_SIGNIFICANT:  { category: 'financial',   severity: 'info',     channels: ['in_app', 'email'] },
  SUPPLY_CAP_APPROACHING:   { category: 'financial',   severity: 'warning',  channels: ['in_app', 'email'] },
  BORROW_CAP_APPROACHING:   { category: 'financial',   severity: 'warning',  channels: ['in_app', 'email'] },

  // Auth & Compliance
  KYB_RECEIVED:             { category: 'compliance',  severity: 'info',     channels: ['in_app', 'email'] },
  KYB_APPROVED:             { category: 'compliance',  severity: 'info',     channels: ['in_app', 'email'] },
  KYB_REJECTED:             { category: 'compliance',  severity: 'warning',  channels: ['in_app', 'email'] },
  DOCUMENT_EXPIRY_30D:      { category: 'compliance',  severity: 'warning',  channels: ['in_app', 'email'] },
  DOCUMENT_EXPIRY_7D:       { category: 'compliance',  severity: 'warning',  channels: ['in_app', 'email'] },
  DOCUMENT_EXPIRY_1D:       { category: 'compliance',  severity: 'warning',  channels: ['in_app', 'email'] },
  NEW_LOGIN_DEVICE:         { category: 'auth',        severity: 'warning',  channels: ['in_app', 'email'] },
  PASSWORD_CHANGED:         { category: 'auth',        severity: 'info',     channels: ['in_app', 'email'] },
  WALLET_LINKED:            { category: 'auth',        severity: 'info',     channels: ['in_app'] },
  WALLET_UNLINKED:          { category: 'auth',        severity: 'info',     channels: ['in_app'] },

  // KYC/AML Compliance (MP21)
  KYC_SUBMITTED:            { category: 'compliance',  severity: 'info',     channels: ['in_app'] },
  KYC_APPROVED:             { category: 'compliance',  severity: 'info',     channels: ['in_app', 'email'] },
  KYC_REJECTED:             { category: 'compliance',  severity: 'warning',  channels: ['in_app', 'email'] },
  KYC_EXPIRED:              { category: 'compliance',  severity: 'warning',  channels: ['in_app', 'email'] },
  KYC_RESUBMISSION_REQUIRED: { category: 'compliance', severity: 'warning',  channels: ['in_app', 'email'] },
  AML_WALLET_FLAGGED:       { category: 'compliance',  severity: 'warning',  channels: ['in_app', 'email'] },
  AML_WALLET_BLOCKED:       { category: 'compliance',  severity: 'critical', channels: ['in_app', 'email', 'webhook'] },
  AML_WALLET_CLEARED:       { category: 'compliance',  severity: 'info',     channels: ['in_app'] },
  SANCTIONS_MATCH_FOUND:    { category: 'compliance',  severity: 'critical', channels: ['in_app', 'email', 'webhook'] },
  PEP_MATCH_FOUND:          { category: 'compliance',  severity: 'warning',  channels: ['in_app', 'email'] },
  RISK_LEVEL_CHANGED:       { category: 'compliance',  severity: 'warning',  channels: ['in_app', 'email'] },
  COMPLIANCE_REVIEW_REQUIRED: { category: 'compliance', severity: 'warning',  channels: ['in_app', 'email'] },
  GDPR_REQUEST_COMPLETED:   { category: 'compliance',  severity: 'info',     channels: ['in_app', 'email'] },

  // Governance
  PROPOSAL_CREATED:         { category: 'governance',  severity: 'info',     channels: ['in_app'] },
  VOTE_DEADLINE_24H:        { category: 'governance',  severity: 'info',     channels: ['in_app', 'email'] },
  PROPOSAL_EXECUTED:        { category: 'governance',  severity: 'info',     channels: ['in_app'] },
  PROPOSAL_REJECTED:        { category: 'governance',  severity: 'info',     channels: ['in_app'] },

  // System
  ORACLE_STALE_PRICE:       { category: 'system',      severity: 'critical', channels: ['in_app'] },
  ORACLE_CIRCUIT_BREAKER:   { category: 'system',      severity: 'critical', channels: ['in_app'] },
  PROTOCOL_PAUSED:          { category: 'system',      severity: 'critical', channels: ['in_app', 'email', 'webhook'] },
  PROTOCOL_RESUMED:         { category: 'system',      severity: 'info',     channels: ['in_app', 'email'] },
  SYSTEM_MAINTENANCE:       { category: 'system',      severity: 'info',     channels: ['in_app', 'email'] },
};

// ---------------------------------------------------------------------------
// Deduplication windows (milliseconds)
// ---------------------------------------------------------------------------

export const DEDUP_WINDOWS: Partial<Record<NotificationType, number>> = {
  HEALTH_FACTOR_CAUTION:   6 * 60 * 60 * 1000,  // 6 hours
  HEALTH_FACTOR_DANGER:    2 * 60 * 60 * 1000,   // 2 hours
  HEALTH_FACTOR_CRITICAL:  30 * 60 * 1000,        // 30 minutes
  RATE_CHANGE_SIGNIFICANT: 6 * 60 * 60 * 1000,   // 6 hours
  NEW_LOGIN_DEVICE:        60 * 60 * 1000,         // 1 hour
};

/** Default dedup window for types not listed above */
export const DEFAULT_DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// Helper: map backend NotificationType → frontend display type
// ---------------------------------------------------------------------------

export function notificationTypeToDisplayType(type: NotificationType): NotificationDisplayType {
  switch (type) {
    case 'HEALTH_FACTOR_CRITICAL':
    case 'LIQUIDATION_EXECUTED':
    case 'ORACLE_STALE_PRICE':
    case 'ORACLE_CIRCUIT_BREAKER':
    case 'PROTOCOL_PAUSED':
    case 'AML_WALLET_BLOCKED':
    case 'SANCTIONS_MATCH_FOUND':
      return 'critical';

    case 'HEALTH_FACTOR_CAUTION':
    case 'HEALTH_FACTOR_DANGER':
    case 'LIQUIDATION_WARNING':
    case 'SUPPLY_CAP_APPROACHING':
    case 'BORROW_CAP_APPROACHING':
    case 'KYB_REJECTED':
    case 'DOCUMENT_EXPIRY_30D':
    case 'DOCUMENT_EXPIRY_7D':
    case 'DOCUMENT_EXPIRY_1D':
    case 'NEW_LOGIN_DEVICE':
    case 'KYC_REJECTED':
    case 'KYC_EXPIRED':
    case 'KYC_RESUBMISSION_REQUIRED':
    case 'AML_WALLET_FLAGGED':
    case 'PEP_MATCH_FOUND':
    case 'RISK_LEVEL_CHANGED':
    case 'COMPLIANCE_REVIEW_REQUIRED':
      return 'warning';

    case 'KYB_APPROVED':
    case 'PROTOCOL_RESUMED':
    case 'KYC_APPROVED':
    case 'AML_WALLET_CLEARED':
    case 'GDPR_REQUEST_COMPLETED':
      return 'success';

    case 'PROPOSAL_CREATED':
    case 'VOTE_DEADLINE_24H':
    case 'PROPOSAL_EXECUTED':
    case 'PROPOSAL_REJECTED':
      return 'governance';

    default:
      return 'info';
  }
}
