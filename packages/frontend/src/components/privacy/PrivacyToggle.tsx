'use client';

import { cn } from '@/lib/utils/cn';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Eye, EyeOff, Lock } from 'lucide-react';
import type { PrivacyLevel } from '@dualis/shared';

interface PrivacyToggleProps {
  /** Currently selected privacy level */
  currentLevel: PrivacyLevel;
  /** Callback when privacy level changes (after confirmation) */
  onChange: (level: PrivacyLevel) => void;
  /** Show loading skeletons */
  loading?: boolean;
}

interface LevelOption {
  level: PrivacyLevel;
  icon: React.ElementType;
  title: string;
  description: string;
  tag?: string;
}

const LEVEL_OPTIONS: LevelOption[] = [
  {
    level: 'Public',
    icon: Eye,
    title: 'Standard Privacy',
    description: 'All data visible',
  },
  {
    level: 'Selective',
    icon: EyeOff,
    title: 'Enhanced Privacy',
    description: 'Selective data sharing',
    tag: '(Recommended for institutional)',
  },
  {
    level: 'Maximum',
    icon: Lock,
    title: 'Maximum Privacy',
    description: 'Minimum data exposure',
    tag: '(Premium)',
  },
];

function PrivacyToggle({ currentLevel, onChange, loading = false }: PrivacyToggleProps) {
  const handleSelect = (level: PrivacyLevel) => {
    if (level === currentLevel) return;

    const option = LEVEL_OPTIONS.find((o) => o.level === level);
    if (!option) return;

    const confirmed = window.confirm(
      `Are you sure you want to change your privacy level to "${option.title}"?`
    );

    if (confirmed) {
      onChange(level);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} variant="default" padding="md">
            <div className="flex flex-col items-center gap-3 py-2">
              <Skeleton variant="circle" width={48} height={48} />
              <Skeleton variant="rect" width={140} height={16} />
              <Skeleton variant="rect" width={120} height={12} />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {LEVEL_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isSelected = currentLevel === option.level;

        return (
          <Card
            key={option.level}
            variant="default"
            padding="md"
            clickable
            className={cn(
              'relative',
              isSelected
                ? 'border-2 border-accent-teal bg-accent-teal/5'
                : 'border border-border-default hover:border-border-hover',
            )}
            onClick={() => handleSelect(option.level)}
          >
            <div className="flex flex-col items-center text-center gap-3 py-2">
              <div
                className={cn(
                  'flex items-center justify-center w-12 h-12 rounded-full',
                  isSelected
                    ? 'bg-accent-teal/10 text-accent-teal'
                    : 'bg-bg-secondary text-text-tertiary',
                )}
              >
                <Icon className="h-6 w-6" />
              </div>

              <div className="flex flex-col gap-1">
                <span
                  className={cn(
                    'text-sm font-semibold',
                    isSelected ? 'text-accent-teal' : 'text-text-primary',
                  )}
                >
                  {option.title}
                </span>

                <span className="text-xs text-text-secondary">
                  {option.description}
                </span>

                {option.tag && (
                  <span className="text-[10px] font-medium text-accent-gold mt-0.5">
                    {option.tag}
                  </span>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export { PrivacyToggle, type PrivacyToggleProps };
