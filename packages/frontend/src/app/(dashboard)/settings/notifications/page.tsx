'use client';

import { useState, useCallback } from 'react';
import {
  Bell,
  Mail,
  Webhook,
  Shield,
  Landmark,
  DollarSign,
  Clock,
  RotateCcw,
  Send,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PreferencesForm {
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
    time: string;
  };
}

const DEFAULT_PREFERENCES: PreferencesForm = {
  channels: {
    inApp: true,
    email: false,
    webhook: false,
  },
  financial: {
    enabled: true,
    hfCautionThreshold: 1.5,
    hfDangerThreshold: 1.2,
    hfCriticalThreshold: 1.05,
    interestMilestones: true,
    rateChanges: true,
  },
  auth: {
    enabled: true,
    newLoginAlerts: true,
  },
  governance: {
    enabled: true,
  },
  digest: {
    enabled: false,
    frequency: 'daily',
    time: '09:00',
  },
};

// ---------------------------------------------------------------------------
// Toggle component
// ---------------------------------------------------------------------------

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        checked ? 'bg-accent-teal' : 'bg-bg-tertiary',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'cursor-pointer',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-white transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NotificationSettingsPage() {
  const [form, setForm] = useState<PreferencesForm>(
    structuredClone(DEFAULT_PREFERENCES),
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [testingChannel, setTestingChannel] = useState<string | null>(null);

  // ---- Updaters ----
  const updateChannels = useCallback(
    (key: keyof PreferencesForm['channels'], val: boolean) => {
      setForm((prev) => ({
        ...prev,
        channels: { ...prev.channels, [key]: val },
      }));
    },
    [],
  );

  const updateFinancial = useCallback(
    <K extends keyof PreferencesForm['financial']>(
      key: K,
      val: PreferencesForm['financial'][K],
    ) => {
      setForm((prev) => ({
        ...prev,
        financial: { ...prev.financial, [key]: val },
      }));
    },
    [],
  );

  const updateAuth = useCallback(
    <K extends keyof PreferencesForm['auth']>(
      key: K,
      val: PreferencesForm['auth'][K],
    ) => {
      setForm((prev) => ({
        ...prev,
        auth: { ...prev.auth, [key]: val },
      }));
    },
    [],
  );

  const updateGovernance = useCallback(
    <K extends keyof PreferencesForm['governance']>(
      key: K,
      val: PreferencesForm['governance'][K],
    ) => {
      setForm((prev) => ({
        ...prev,
        governance: { ...prev.governance, [key]: val },
      }));
    },
    [],
  );

  const updateDigest = useCallback(
    <K extends keyof PreferencesForm['digest']>(
      key: K,
      val: PreferencesForm['digest'][K],
    ) => {
      setForm((prev) => ({
        ...prev,
        digest: { ...prev.digest, [key]: val },
      }));
    },
    [],
  );

  // ---- Validation ----
  const validate = useCallback((): boolean => {
    const errors: string[] = [];
    const { hfCautionThreshold, hfDangerThreshold, hfCriticalThreshold } =
      form.financial;

    if (hfCriticalThreshold <= 1.0) {
      errors.push('Critical threshold must be greater than 1.0');
    }
    if (hfDangerThreshold <= hfCriticalThreshold) {
      errors.push('Danger threshold must be greater than Critical threshold');
    }
    if (hfCautionThreshold <= hfDangerThreshold) {
      errors.push('Caution threshold must be greater than Danger threshold');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, [form.financial]);

  // ---- Save (mock) ----
  const handleSave = useCallback(() => {
    if (!validate()) return;
    setSaveStatus('saving');
    // Simulate API call
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 800);
  }, [validate]);

  // ---- Reset ----
  const handleReset = useCallback(() => {
    setForm(structuredClone(DEFAULT_PREFERENCES));
    setValidationErrors([]);
    setSaveStatus('idle');
  }, []);

  // ---- Test notification (mock) ----
  const handleTestNotification = useCallback((channel: string) => {
    setTestingChannel(channel);
    setTimeout(() => setTestingChannel(null), 1500);
  }, []);

  // ---- Render ----
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Notification Preferences
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Configure how and when you receive notifications from Dualis Finance.
        </p>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="rounded-lg border border-negative/30 bg-negative/10 p-4">
          <div className="flex items-center gap-2 text-negative mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Validation Errors</span>
          </div>
          <ul className="list-disc list-inside space-y-1">
            {validationErrors.map((err) => (
              <li key={err} className="text-sm text-negative/80">
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Delivery Channels */}
      <div className="rounded-lg border border-border-default bg-bg-secondary p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Delivery Channels
        </h2>
        <div className="space-y-4">
          {/* In-App */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-text-secondary" />
              <div>
                <p className="text-sm font-medium text-text-primary">In-App</p>
                <p className="text-xs text-text-tertiary">
                  Always enabled. Notifications appear in the app.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Toggle checked={true} onChange={() => {}} disabled />
              <span className="text-xs text-text-disabled">Always on</span>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-text-secondary" />
              <div>
                <p className="text-sm font-medium text-text-primary">Email</p>
                <p className="text-xs text-text-tertiary">
                  Receive notifications via email.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Toggle
                checked={form.channels.email}
                onChange={(val) => updateChannels('email', val)}
              />
              <button
                onClick={() => handleTestNotification('email')}
                disabled={!form.channels.email || testingChannel === 'email'}
                className={cn(
                  'flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors',
                  form.channels.email
                    ? 'text-accent-teal hover:bg-bg-hover'
                    : 'text-text-disabled cursor-not-allowed',
                )}
              >
                <Send className="h-3 w-3" />
                {testingChannel === 'email' ? 'Sent!' : 'Test'}
              </button>
            </div>
          </div>

          {/* Webhook */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Webhook className="h-5 w-5 text-text-secondary" />
              <div>
                <p className="text-sm font-medium text-text-primary">Webhook</p>
                <p className="text-xs text-text-tertiary">
                  Deliver events to your webhook endpoints.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Toggle
                checked={form.channels.webhook}
                onChange={(val) => updateChannels('webhook', val)}
              />
              <button
                onClick={() => handleTestNotification('webhook')}
                disabled={
                  !form.channels.webhook || testingChannel === 'webhook'
                }
                className={cn(
                  'flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors',
                  form.channels.webhook
                    ? 'text-accent-teal hover:bg-bg-hover'
                    : 'text-text-disabled cursor-not-allowed',
                )}
              >
                <Send className="h-3 w-3" />
                {testingChannel === 'webhook' ? 'Sent!' : 'Test'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Toggles */}
      <div className="rounded-lg border border-border-default bg-bg-secondary p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Notification Categories
        </h2>
        <div className="space-y-5">
          {/* Financial */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-text-secondary" />
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Financial Alerts
                  </p>
                  <p className="text-xs text-text-tertiary">
                    Health factor, liquidation, interest, and rate changes.
                  </p>
                </div>
              </div>
              <Toggle
                checked={form.financial.enabled}
                onChange={(val) => updateFinancial('enabled', val)}
              />
            </div>

            {form.financial.enabled && (
              <div className="ml-8 space-y-3 border-l-2 border-border-subtle pl-4">
                {/* Sub-toggles */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-secondary">
                    Interest milestones
                  </p>
                  <Toggle
                    checked={form.financial.interestMilestones}
                    onChange={(val) =>
                      updateFinancial('interestMilestones', val)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-secondary">Rate changes</p>
                  <Toggle
                    checked={form.financial.rateChanges}
                    onChange={(val) => updateFinancial('rateChanges', val)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Auth */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-text-secondary" />
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Auth Alerts
                  </p>
                  <p className="text-xs text-text-tertiary">
                    Login activity, password changes, and wallet events.
                  </p>
                </div>
              </div>
              <Toggle
                checked={form.auth.enabled}
                onChange={(val) => updateAuth('enabled', val)}
              />
            </div>

            {form.auth.enabled && (
              <div className="ml-8 space-y-3 border-l-2 border-border-subtle pl-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-secondary">
                    New login alerts
                  </p>
                  <Toggle
                    checked={form.auth.newLoginAlerts}
                    onChange={(val) => updateAuth('newLoginAlerts', val)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Governance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Landmark className="h-5 w-5 text-text-secondary" />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Governance Alerts
                </p>
                <p className="text-xs text-text-tertiary">
                  Proposals, voting deadlines, and execution results.
                </p>
              </div>
            </div>
            <Toggle
              checked={form.governance.enabled}
              onChange={(val) => updateGovernance('enabled', val)}
            />
          </div>
        </div>
      </div>

      {/* Health Factor Thresholds */}
      <div className="rounded-lg border border-border-default bg-bg-secondary p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-1">
          Health Factor Thresholds
        </h2>
        <p className="text-sm text-text-tertiary mb-4">
          Set the Health Factor levels at which you receive alerts. Thresholds
          must satisfy: Caution &gt; Danger &gt; Critical &gt; 1.0
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Caution */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Caution
            </label>
            <input
              type="number"
              step="0.01"
              min="1.01"
              value={form.financial.hfCautionThreshold}
              onChange={(e) =>
                updateFinancial(
                  'hfCautionThreshold',
                  parseFloat(e.target.value) || 0,
                )
              }
              className="w-full px-3 py-2 rounded-md bg-bg-tertiary border border-border-default text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent-teal"
            />
            <p className="text-xs text-warning mt-1">
              Yellow zone — early warning
            </p>
          </div>

          {/* Danger */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Danger
            </label>
            <input
              type="number"
              step="0.01"
              min="1.01"
              value={form.financial.hfDangerThreshold}
              onChange={(e) =>
                updateFinancial(
                  'hfDangerThreshold',
                  parseFloat(e.target.value) || 0,
                )
              }
              className="w-full px-3 py-2 rounded-md bg-bg-tertiary border border-border-default text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent-teal"
            />
            <p className="text-xs text-negative/70 mt-1">
              Orange zone — take action
            </p>
          </div>

          {/* Critical */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Critical
            </label>
            <input
              type="number"
              step="0.01"
              min="1.01"
              value={form.financial.hfCriticalThreshold}
              onChange={(e) =>
                updateFinancial(
                  'hfCriticalThreshold',
                  parseFloat(e.target.value) || 0,
                )
              }
              className="w-full px-3 py-2 rounded-md bg-bg-tertiary border border-border-default text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent-teal"
            />
            <p className="text-xs text-negative mt-1">
              Red zone — liquidation imminent
            </p>
          </div>
        </div>
      </div>

      {/* Digest Settings */}
      <div className="rounded-lg border border-border-default bg-bg-secondary p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Digest Settings
            </h2>
            <p className="text-sm text-text-tertiary mt-0.5">
              Bundle non-urgent notifications into periodic digests.
            </p>
          </div>
          <Toggle
            checked={form.digest.enabled}
            onChange={(val) => updateDigest('enabled', val)}
          />
        </div>

        {form.digest.enabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Frequency
              </label>
              <select
                value={form.digest.frequency}
                onChange={(e) =>
                  updateDigest(
                    'frequency',
                    e.target.value as 'daily' | 'weekly',
                  )
                }
                className="w-full px-3 py-2 rounded-md bg-bg-tertiary border border-border-default text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent-teal"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Delivery Time (UTC)
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <input
                  type="time"
                  value={form.digest.time}
                  onChange={(e) => updateDigest('time', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-md bg-bg-tertiary border border-border-default text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent-teal"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-border-default text-text-secondary text-sm font-medium hover:bg-bg-hover transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to defaults
        </button>

        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className={cn(
            'flex items-center gap-2 px-6 py-2 rounded-md text-white text-sm font-medium transition-colors',
            saveStatus === 'saved'
              ? 'bg-positive hover:bg-positive/90'
              : 'bg-accent-teal hover:bg-accent-teal/90',
            saveStatus === 'saving' && 'opacity-75 cursor-wait',
          )}
        >
          <Save className="h-4 w-4" />
          {saveStatus === 'saving'
            ? 'Saving...'
            : saveStatus === 'saved'
              ? 'Saved!'
              : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
