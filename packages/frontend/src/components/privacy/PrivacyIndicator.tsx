'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff, Lock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { usePrivacyStore } from '@/stores/usePrivacyStore';
import type { PrivacyLevel } from '@dualis/shared';

const LEVEL_META: Record<PrivacyLevel, { icon: React.ElementType; label: string; dotColor: string; textColor: string }> = {
  Public: { icon: Eye, label: 'Standard', dotColor: 'bg-positive', textColor: 'text-positive/80' },
  Selective: { icon: EyeOff, label: 'Enhanced', dotColor: 'bg-warning', textColor: 'text-warning/80' },
  Maximum: { icon: Lock, label: 'Maximum', dotColor: 'bg-negative', textColor: 'text-negative/80' },
};

function PrivacyIndicator() {
  const router = useRouter();
  const { config, isLoading, fetchPrivacyConfig } = usePrivacyStore();

  useEffect(() => {
    if (!config) {
      fetchPrivacyConfig();
    }
  }, [config, fetchPrivacyConfig]);

  if (isLoading && !config) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-tertiary/60 border border-border-subtle animate-pulse">
        <Shield className="h-3.5 w-3.5 text-text-disabled" />
        <div className="w-12 h-3 rounded bg-bg-secondary" />
      </div>
    );
  }

  if (!config) return null;

  const meta = LEVEL_META[config.privacyLevel] ?? LEVEL_META.Public;
  const Icon = meta.icon;

  return (
    <button
      onClick={() => router.push('/settings/privacy')}
      className={cn(
        'hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all duration-200 hover:opacity-80',
        config.privacyLevel === 'Public' && 'bg-positive/[0.06] border-positive/15',
        config.privacyLevel === 'Selective' && 'bg-warning/[0.06] border-warning/15',
        config.privacyLevel === 'Maximum' && 'bg-negative/[0.06] border-negative/15',
      )}
      title={`Privacy: ${meta.label} — Click to view settings`}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', meta.dotColor)} />
      <Icon className={cn('h-3.5 w-3.5', meta.textColor)} />
      <span className={meta.textColor}>{meta.label}</span>
    </button>
  );
}

export { PrivacyIndicator };
