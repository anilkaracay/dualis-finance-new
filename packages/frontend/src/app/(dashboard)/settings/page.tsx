'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Sun,
  Moon,
  Monitor,
  ExternalLink,
  Key,
  Languages,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { useUIStore } from '@/stores/useUIStore';
import { useWalletStore } from '@/stores/useWalletStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

import type { ThemePreference } from '@/stores/useUIStore';

interface ThemeChoice {
  readonly value: ThemePreference;
  readonly label: string;
  readonly icon: React.ElementType;
}

const THEME_OPTIONS: readonly ThemeChoice[] = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

// ---------------------------------------------------------------------------
// Notification toggle state
// ---------------------------------------------------------------------------

interface NotificationState {
  healthWarnings: boolean;
  healthThreshold: string;
  liquidationAlerts: boolean;
  secLendingRecalls: boolean;
  governanceProposals: boolean;
  emailNotifications: boolean;
  emailAddress: string;
}

const INITIAL_NOTIFICATION_STATE: NotificationState = {
  healthWarnings: true,
  healthThreshold: '1.2',
  liquidationAlerts: true,
  secLendingRecalls: true,
  governanceProposals: false,
  emailNotifications: false,
  emailAddress: '',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncateAddress(address: string): string {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

// ---------------------------------------------------------------------------
// Section: Notification Toggle Row
// ---------------------------------------------------------------------------

interface ToggleRowProps {
  readonly label: string;
  readonly description?: string;
  readonly pressed: boolean;
  readonly onPressedChange: (pressed: boolean) => void;
  readonly children?: React.ReactNode;
}

function ToggleRow({ label, description, pressed, onPressedChange, children }: ToggleRowProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-primary">{label}</p>
          {description !== undefined && (
            <p className="mt-0.5 text-xs text-text-tertiary">{description}</p>
          )}
        </div>
        <Toggle pressed={pressed} onPressedChange={onPressedChange} size="sm">
          <div
            className={cn(
              'h-5 w-9 rounded-full transition-colors relative',
              pressed ? 'bg-accent-teal' : 'bg-bg-tertiary',
            )}
          >
            <div
              className={cn(
                'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
                pressed ? 'translate-x-4' : 'translate-x-0.5',
              )}
            />
          </div>
        </Toggle>
      </div>
      {pressed && children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const { themePreference, setTheme } = useUIStore();
  const { isConnected, walletAddress, walletType, party, disconnect } = useWalletStore();

  const [notifications, setNotifications] = useState<NotificationState>(INITIAL_NOTIFICATION_STATE);

  // ---------------------------------------------------------------------------
  // Notification handlers
  // ---------------------------------------------------------------------------

  function updateNotification<K extends keyof NotificationState>(
    key: K,
    value: NotificationState[K],
  ) {
    setNotifications((prev) => ({ ...prev, [key]: value }));
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Page header */}
      <h1 className="text-xl font-semibold text-text-primary tracking-tight">Settings</h1>

      {/* ------------------------------------------------------------------- */}
      {/* Appearance Card                                                      */}
      {/* ------------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-text-secondary">
            Choose your preferred theme for the interface.
          </p>
          <div className="flex flex-wrap gap-3">
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = themePreference === opt.value;

              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border w-20 py-3 text-xs font-medium transition-all',
                    'focus-ring',
                    isSelected
                      ? 'border-accent-teal bg-accent-teal-muted text-accent-teal shadow-card'
                      : 'border-border-default text-text-secondary hover:border-border-hover hover:text-text-primary',
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------- */}
      {/* Notifications Card                                                   */}
      {/* ------------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border-default">
            {/* Health Factor Warnings */}
            <div className="py-4 first:pt-0 last:pb-0">
              <ToggleRow
                label="Health Factor Warnings"
                description="Get notified when your health factor drops below the threshold"
                pressed={notifications.healthWarnings}
                onPressedChange={(v) => updateNotification('healthWarnings', v)}
              >
                <div className="max-w-xs">
                  <Input
                    label="Threshold"
                    type="number"
                    value={notifications.healthThreshold}
                    onChange={(e) => updateNotification('healthThreshold', e.target.value)}
                    placeholder="1.2"
                  />
                </div>
              </ToggleRow>
            </div>

            {/* Liquidation Alerts */}
            <div className="py-4 first:pt-0 last:pb-0">
              <ToggleRow
                label="Liquidation Alerts"
                description="Receive urgent alerts when positions are at liquidation risk"
                pressed={notifications.liquidationAlerts}
                onPressedChange={(v) => updateNotification('liquidationAlerts', v)}
              />
            </div>

            {/* Sec Lending Recalls */}
            <div className="py-4 first:pt-0 last:pb-0">
              <ToggleRow
                label="Sec Lending Recalls"
                description="Notifications when a securities lending deal is recalled"
                pressed={notifications.secLendingRecalls}
                onPressedChange={(v) => updateNotification('secLendingRecalls', v)}
              />
            </div>

            {/* Governance Proposals */}
            <div className="py-4 first:pt-0 last:pb-0">
              <ToggleRow
                label="Governance Proposals"
                description="Get notified about new governance proposals and votes"
                pressed={notifications.governanceProposals}
                onPressedChange={(v) => updateNotification('governanceProposals', v)}
              />
            </div>

            {/* Email Notifications */}
            <div className="py-4 first:pt-0 last:pb-0">
              <ToggleRow
                label="Email Notifications"
                description="Receive alerts via email in addition to in-app notifications"
                pressed={notifications.emailNotifications}
                onPressedChange={(v) => updateNotification('emailNotifications', v)}
              >
                <div className="max-w-sm">
                  <Input
                    label="Email address"
                    type="email"
                    value={notifications.emailAddress}
                    onChange={(e) => updateNotification('emailAddress', e.target.value)}
                    placeholder="you@institution.com"
                  />
                </div>
              </ToggleRow>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------- */}
      {/* Connected Wallet Card                                                */}
      {/* ------------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Wallet</CardTitle>
        </CardHeader>
        <CardContent>
          {isConnected && walletAddress ? (
            <div className="space-y-4">
              {/* Wallet info grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                    Wallet Address
                  </p>
                  <p className="mt-1 font-mono text-sm text-text-primary">
                    {truncateAddress(walletAddress)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                    Wallet Type
                  </p>
                  <p className="mt-1 text-sm text-text-primary">{walletType ?? 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                    Party ID
                  </p>
                  <p className="mt-1 font-mono text-sm text-text-primary">
                    {party ? truncateAddress(party) : 'N/A'}
                  </p>
                </div>
              </div>

              <Button variant="danger" size="sm" onClick={disconnect}>
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="rounded-md border border-border-default bg-bg-secondary px-4 py-6 text-center">
              <p className="text-sm text-text-secondary">No wallet connected</p>
              <p className="mt-1 text-xs text-text-tertiary">
                Connect a Canton-compatible wallet to manage your settings.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------- */}
      {/* Privacy & Compliance Card                                            */}
      {/* ------------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy &amp; Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-text-tertiary" />
                <p className="text-sm font-medium text-text-primary">Privacy Settings</p>
              </div>
              <p className="mt-0.5 text-xs text-text-tertiary">
                Manage your privacy level, selective disclosures, and audit log
              </p>
            </div>
            <Link href="/settings/privacy">
              <Button variant="secondary" size="sm" icon={<ArrowRight className="h-3 w-3" />}>
                Manage
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------- */}
      {/* Advanced Card                                                        */}
      {/* ------------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border-default">
            {/* API Key */}
            <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div>
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-text-tertiary" />
                  <p className="text-sm font-medium text-text-primary">API Key</p>
                </div>
                <p className="mt-0.5 text-xs text-text-tertiary">
                  API key management for institutional users
                </p>
              </div>
              <Button variant="secondary" size="sm" disabled>
                Generate API Key
              </Button>
            </div>

            {/* Language */}
            <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div>
                <div className="flex items-center gap-2">
                  <Languages className="h-4 w-4 text-text-tertiary" />
                  <p className="text-sm font-medium text-text-primary">Language</p>
                </div>
                <p className="mt-0.5 text-xs text-text-tertiary">
                  Interface language preference
                </p>
              </div>
              <select
                className={cn(
                  'h-9 rounded-md border border-border-default bg-bg-tertiary px-3 text-sm text-text-primary',
                  'transition-colors focus-ring',
                )}
                defaultValue="en"
              >
                <option value="en">English</option>
                <option value="de" disabled>
                  German
                </option>
                <option value="tr" disabled>
                  Turkish
                </option>
                <option value="ja" disabled>
                  Japanese
                </option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------- */}
      {/* About Card                                                           */}
      {/* ------------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>About Dualis Finance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-text-secondary">Version</span>
              <span className="rounded bg-bg-tertiary px-2 py-0.5 font-mono text-xs text-text-primary">
                v2.0.0
              </span>
            </div>

            <div className="flex flex-wrap gap-4">
              <a
                href="#"
                className="inline-flex items-center gap-1 text-sm text-accent-teal transition-colors hover:underline"
              >
                Documentation
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-1 text-sm text-accent-teal transition-colors hover:underline"
              >
                GitHub
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-1 text-sm text-accent-teal transition-colors hover:underline"
              >
                Discord
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <p className="text-xs text-text-tertiary">
              Built on Canton Network. Institutional-grade DeFi infrastructure.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
