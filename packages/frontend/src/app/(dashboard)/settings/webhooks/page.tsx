'use client';

import { useState, useCallback } from 'react';
import {
  Webhook,
  Plus,
  Trash2,
  Send,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { NotificationType, NotificationCategory } from '@dualis/shared';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_WEBHOOKS = 5;

const EVENT_CATEGORIES: {
  label: string;
  category: NotificationCategory;
  events: { type: NotificationType; label: string }[];
}[] = [
  {
    label: 'Financial',
    category: 'financial',
    events: [
      { type: 'HEALTH_FACTOR_CAUTION', label: 'Health Factor Caution' },
      { type: 'HEALTH_FACTOR_DANGER', label: 'Health Factor Danger' },
      { type: 'HEALTH_FACTOR_CRITICAL', label: 'Health Factor Critical' },
      { type: 'LIQUIDATION_EXECUTED', label: 'Liquidation Executed' },
      { type: 'LIQUIDATION_WARNING', label: 'Liquidation Warning' },
      { type: 'INTEREST_MILESTONE', label: 'Interest Milestone' },
      { type: 'RATE_CHANGE_SIGNIFICANT', label: 'Significant Rate Change' },
      { type: 'SUPPLY_CAP_APPROACHING', label: 'Supply Cap Approaching' },
      { type: 'BORROW_CAP_APPROACHING', label: 'Borrow Cap Approaching' },
    ],
  },
  {
    label: 'Auth & Compliance',
    category: 'auth',
    events: [
      { type: 'KYB_RECEIVED', label: 'KYB Received' },
      { type: 'KYB_APPROVED', label: 'KYB Approved' },
      { type: 'KYB_REJECTED', label: 'KYB Rejected' },
      { type: 'NEW_LOGIN_DEVICE', label: 'New Login Device' },
      { type: 'WALLET_LINKED', label: 'Wallet Linked' },
      { type: 'WALLET_UNLINKED', label: 'Wallet Unlinked' },
    ],
  },
  {
    label: 'Governance',
    category: 'governance',
    events: [
      { type: 'PROPOSAL_CREATED', label: 'Proposal Created' },
      { type: 'VOTE_DEADLINE_24H', label: 'Vote Deadline (24h)' },
      { type: 'PROPOSAL_EXECUTED', label: 'Proposal Executed' },
      { type: 'PROPOSAL_REJECTED', label: 'Proposal Rejected' },
    ],
  },
  {
    label: 'System',
    category: 'system',
    events: [
      { type: 'ORACLE_STALE_PRICE', label: 'Oracle Stale Price' },
      { type: 'ORACLE_CIRCUIT_BREAKER', label: 'Oracle Circuit Breaker' },
      { type: 'PROTOCOL_PAUSED', label: 'Protocol Paused' },
      { type: 'PROTOCOL_RESUMED', label: 'Protocol Resumed' },
      { type: 'SYSTEM_MAINTENANCE', label: 'System Maintenance' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WebhookEntry {
  id: string;
  url: string;
  secret: string;
  events: NotificationType[];
  isActive: boolean;
  lastDeliveryAt: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function generateMockSecret(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let secret = 'whsec_';
  for (let i = 0; i < 32; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)];
  }
  return secret;
}

function formatTimestamp(ts: string | null): string {
  if (!ts) return 'Never';
  try {
    const date = new Date(ts);
    if (isNaN(date.getTime())) return ts;
    return date.toLocaleString();
  } catch {
    return ts;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ---- Add form state ----
  const [newUrl, setNewUrl] = useState('');
  const [newEvents, setNewEvents] = useState<Set<NotificationType>>(new Set());
  const [urlError, setUrlError] = useState('');
  const [newlyCreatedSecret, setNewlyCreatedSecret] = useState<string | null>(null);

  // ---- Handlers ----
  const toggleEvent = useCallback((event: NotificationType) => {
    setNewEvents((prev) => {
      const next = new Set(prev);
      if (next.has(event)) {
        next.delete(event);
      } else {
        next.add(event);
      }
      return next;
    });
  }, []);

  const toggleCategoryEvents = useCallback(
    (events: NotificationType[]) => {
      setNewEvents((prev) => {
        const next = new Set(prev);
        const allSelected = events.every((e) => next.has(e));
        if (allSelected) {
          events.forEach((e) => next.delete(e));
        } else {
          events.forEach((e) => next.add(e));
        }
        return next;
      });
    },
    [],
  );

  const validateUrl = useCallback((url: string): boolean => {
    if (!url.startsWith('https://')) {
      setUrlError('URL must start with https://');
      return false;
    }
    try {
      new URL(url);
      setUrlError('');
      return true;
    } catch {
      setUrlError('Invalid URL format');
      return false;
    }
  }, []);

  const handleAddWebhook = useCallback(() => {
    if (!validateUrl(newUrl)) return;
    if (newEvents.size === 0) {
      setUrlError('Select at least one event');
      return;
    }

    const secret = generateMockSecret();
    const webhook: WebhookEntry = {
      id: `wh_${Date.now()}`,
      url: newUrl,
      secret,
      events: Array.from(newEvents),
      isActive: true,
      lastDeliveryAt: null,
      createdAt: new Date().toISOString(),
    };

    setWebhooks((prev) => [...prev, webhook]);
    setNewlyCreatedSecret(secret);
    setNewUrl('');
    setNewEvents(new Set());
    setShowAddForm(false);
  }, [newUrl, newEvents, validateUrl]);

  const handleDeleteWebhook = useCallback((id: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
    setRevealedSecrets((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleTestWebhook = useCallback((id: string) => {
    setTestingId(id);
    // Simulate delivery
    setTimeout(() => {
      setWebhooks((prev) =>
        prev.map((w) =>
          w.id === id
            ? { ...w, lastDeliveryAt: new Date().toISOString() }
            : w,
        ),
      );
      setTestingId(null);
    }, 1200);
  }, []);

  const handleToggleActive = useCallback((id: string) => {
    setWebhooks((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isActive: !w.isActive } : w)),
    );
  }, []);

  const handleCopySecret = useCallback((id: string, secret: string) => {
    navigator.clipboard.writeText(secret).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  const toggleRevealSecret = useCallback((id: string) => {
    setRevealedSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const canAddMore = webhooks.length < MAX_WEBHOOKS;

  // ---- Render ----
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Webhook Endpoints
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage webhook endpoints to receive real-time notification events.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-tertiary">
            {webhooks.length}/{MAX_WEBHOOKS} endpoints
          </span>
          {canAddMore && (
            <button
              onClick={() => {
                setShowAddForm(true);
                setNewlyCreatedSecret(null);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-accent-teal text-white text-sm font-medium hover:bg-accent-teal/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Webhook
            </button>
          )}
        </div>
      </div>

      {/* Newly created secret banner */}
      {newlyCreatedSecret && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary mb-1">
                Webhook secret generated
              </p>
              <p className="text-xs text-text-secondary mb-2">
                Copy this secret now. It will not be shown in full again.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-1.5 rounded bg-bg-tertiary text-sm text-text-primary font-mono border border-border-default break-all">
                  {newlyCreatedSecret}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(newlyCreatedSecret);
                    setNewlyCreatedSecret(null);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-accent-teal text-white text-xs font-medium hover:bg-accent-teal/90 transition-colors"
                >
                  <Copy className="h-3 w-3" />
                  Copy & Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Webhook Form */}
      {showAddForm && (
        <div className="rounded-lg border border-border-default bg-bg-secondary p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            New Webhook Endpoint
          </h2>

          {/* URL Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Endpoint URL
            </label>
            <input
              type="url"
              placeholder="https://your-server.com/webhooks/dualis"
              value={newUrl}
              onChange={(e) => {
                setNewUrl(e.target.value);
                if (urlError) validateUrl(e.target.value);
              }}
              className={cn(
                'w-full px-3 py-2 rounded-md bg-bg-tertiary border text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent-teal',
                urlError ? 'border-negative' : 'border-border-default',
              )}
            />
            {urlError && (
              <p className="text-xs text-negative mt-1">{urlError}</p>
            )}
          </div>

          {/* Event Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-secondary mb-3">
              Subscribe to Events
            </label>
            <div className="space-y-4">
              {EVENT_CATEGORIES.map((cat) => {
                const allSelected = cat.events.every((e) =>
                  newEvents.has(e.type),
                );
                const someSelected = cat.events.some((e) =>
                  newEvents.has(e.type),
                );

                return (
                  <div key={cat.category}>
                    {/* Category header */}
                    <button
                      type="button"
                      onClick={() =>
                        toggleCategoryEvents(cat.events.map((e) => e.type))
                      }
                      className="flex items-center gap-2 mb-2"
                    >
                      <div
                        className={cn(
                          'h-4 w-4 rounded border flex items-center justify-center transition-colors',
                          allSelected
                            ? 'bg-accent-teal border-accent-teal'
                            : someSelected
                              ? 'bg-accent-teal/30 border-accent-teal'
                              : 'border-border-default bg-bg-tertiary',
                        )}
                      >
                        {(allSelected || someSelected) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-text-primary">
                        {cat.label}
                      </span>
                    </button>

                    {/* Event checkboxes */}
                    <div className="ml-6 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {cat.events.map((evt) => (
                        <label
                          key={evt.type}
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <div
                            onClick={() => toggleEvent(evt.type)}
                            className={cn(
                              'h-4 w-4 rounded border flex items-center justify-center transition-colors cursor-pointer',
                              newEvents.has(evt.type)
                                ? 'bg-accent-teal border-accent-teal'
                                : 'border-border-default bg-bg-tertiary group-hover:border-text-tertiary',
                            )}
                          >
                            {newEvents.has(evt.type) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                            {evt.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewUrl('');
                setNewEvents(new Set());
                setUrlError('');
              }}
              className="px-4 py-2 rounded-md border border-border-default text-text-secondary text-sm font-medium hover:bg-bg-hover transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddWebhook}
              disabled={!newUrl || newEvents.size === 0}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-white text-sm font-medium transition-colors',
                newUrl && newEvents.size > 0
                  ? 'bg-accent-teal hover:bg-accent-teal/90'
                  : 'bg-accent-teal/50 cursor-not-allowed',
              )}
            >
              <Webhook className="h-4 w-4" />
              Create Webhook
            </button>
          </div>
        </div>
      )}

      {/* Webhook List */}
      {webhooks.length === 0 && !showAddForm ? (
        <div className="rounded-lg border border-border-default bg-bg-secondary p-12 flex flex-col items-center justify-center text-text-tertiary">
          <Webhook className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium text-text-secondary mb-1">
            No webhook endpoints
          </p>
          <p className="text-sm mb-4">
            Add a webhook endpoint to receive real-time event notifications via
            HTTP POST.
          </p>
          <button
            onClick={() => {
              setShowAddForm(true);
              setNewlyCreatedSecret(null);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-accent-teal text-white text-sm font-medium hover:bg-accent-teal/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Your First Webhook
          </button>
        </div>
      ) : (
        webhooks.length > 0 && (
          <div className="space-y-4">
            {webhooks.map((webhook) => {
              const isRevealed = revealedSecrets.has(webhook.id);
              const isTesting = testingId === webhook.id;
              const isCopied = copiedId === webhook.id;

              return (
                <div
                  key={webhook.id}
                  className={cn(
                    'rounded-lg border bg-bg-secondary p-5',
                    webhook.isActive
                      ? 'border-border-default'
                      : 'border-border-default/50 opacity-75',
                  )}
                >
                  {/* Top row: URL + Status */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <ExternalLink className="h-4 w-4 text-text-tertiary flex-shrink-0" />
                      <code className="text-sm text-text-primary font-mono truncate">
                        {webhook.url}
                      </code>
                    </div>
                    <button
                      onClick={() => handleToggleActive(webhook.id)}
                      className={cn(
                        'flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                        webhook.isActive
                          ? 'bg-positive/10 text-positive'
                          : 'bg-bg-tertiary text-text-tertiary',
                      )}
                    >
                      {webhook.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  {/* Secret */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-text-tertiary">Secret:</span>
                    <code className="text-xs text-text-secondary font-mono">
                      {isRevealed
                        ? webhook.secret
                        : `${webhook.secret.slice(0, 10)}${'*'.repeat(22)}`}
                    </code>
                    <button
                      onClick={() => toggleRevealSecret(webhook.id)}
                      className="text-text-tertiary hover:text-text-secondary transition-colors"
                      title={isRevealed ? 'Hide secret' : 'Reveal secret'}
                    >
                      {isRevealed ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        handleCopySecret(webhook.id, webhook.secret)
                      }
                      className="text-text-tertiary hover:text-text-secondary transition-colors"
                      title="Copy secret"
                    >
                      {isCopied ? (
                        <Check className="h-3.5 w-3.5 text-positive" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Events */}
                  <div className="mb-3">
                    <span className="text-xs text-text-tertiary mr-2">
                      Events ({webhook.events.length}):
                    </span>
                    <div className="inline-flex flex-wrap gap-1 mt-1">
                      {webhook.events.slice(0, 5).map((evt) => (
                        <span
                          key={evt}
                          className="px-2 py-0.5 rounded text-xs bg-bg-tertiary text-text-secondary"
                        >
                          {evt.replace(/_/g, ' ')}
                        </span>
                      ))}
                      {webhook.events.length > 5 && (
                        <span className="px-2 py-0.5 rounded text-xs bg-bg-tertiary text-text-tertiary">
                          +{webhook.events.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom row: Last delivery + Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                    <span className="text-xs text-text-tertiary">
                      Last delivery:{' '}
                      <span className="text-text-secondary">
                        {formatTimestamp(webhook.lastDeliveryAt)}
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTestWebhook(webhook.id)}
                        disabled={isTesting || !webhook.isActive}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                          webhook.isActive
                            ? 'text-accent-teal hover:bg-bg-hover'
                            : 'text-text-disabled cursor-not-allowed',
                        )}
                      >
                        <Send className="h-3.5 w-3.5" />
                        {isTesting ? 'Sending...' : 'Test'}
                      </button>
                      <button
                        onClick={() => handleDeleteWebhook(webhook.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-negative hover:bg-negative/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Info footer */}
      {webhooks.length > 0 && (
        <div className="flex items-start gap-2 text-text-tertiary">
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p className="text-xs">
            Webhook payloads are signed with HMAC-SHA256 using your endpoint
            secret. Verify the <code className="font-mono">X-Dualis-Signature</code>{' '}
            header to authenticate requests. Endpoints that fail 5 consecutive
            deliveries will be automatically deactivated.
          </p>
        </div>
      )}

      {/* Max webhooks warning */}
      {!canAddMore && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
          <p className="text-sm text-text-secondary">
            You have reached the maximum of {MAX_WEBHOOKS} webhook endpoints.
            Delete an existing endpoint to add a new one.
          </p>
        </div>
      )}
    </div>
  );
}
