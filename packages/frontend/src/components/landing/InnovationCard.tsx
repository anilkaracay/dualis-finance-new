'use client';

import type { InnovationData } from '@/lib/landing-data';

const tintColors: Record<string, { primary: string; glow: string }> = {
  teal: { primary: '#2DD4BF', glow: 'rgba(45,212,191,0.08)' },
  amber: { primary: '#FBBF24', glow: 'rgba(251,191,36,0.08)' },
  cyan: { primary: '#06B6D4', glow: 'rgba(6,182,212,0.08)' },
  indigo: { primary: '#818CF8', glow: 'rgba(129,140,248,0.08)' },
  violet: { primary: '#A78BFA', glow: 'rgba(167,139,250,0.08)' },
};

function CardIcon({ type, color }: { type: string; color: string }) {
  const size = 40;
  switch (type) {
    case 'credit':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
          <circle cx="15" cy="20" r="10" stroke={color} strokeWidth="1.5" opacity="0.6" />
          <circle cx="20" cy="15" r="10" stroke={color} strokeWidth="1.5" opacity="0.8" />
          <circle cx="25" cy="20" r="10" stroke={color} strokeWidth="1.5" />
        </svg>
      );
    case 'productive':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="22" r="8" stroke={color} strokeWidth="1.5" />
          <path
            d="M20 8V4M20 4l-3 3M20 4l3 3"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M12 14l-2-2M28 14l2-2"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'seclending':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
          <rect x="4" y="12" width="14" height="14" rx="2" stroke={color} strokeWidth="1.5" />
          <rect x="22" y="14" width="14" height="14" rx="2" stroke={color} strokeWidth="1.5" />
          <path d="M18 20h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'institutional':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
          <path d="M20 6l14 8v2H6v-2l14-8z" stroke={color} strokeWidth="1.5" />
          <path d="M10 18v14M16 18v14M24 18v14M30 18v14" stroke={color} strokeWidth="1.5" />
          <path d="M6 34h28" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'privacy':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
          <path
            d="M20 4l14 6v10c0 8-6 14-14 18C12 34 6 28 6 20V10l14-6z"
            stroke={color}
            strokeWidth="1.5"
          />
          <circle cx="20" cy="19" r="4" stroke={color} strokeWidth="1.5" />
          <path d="M20 15v-2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

interface InnovationCardProps {
  innovation: InnovationData;
}

export function InnovationCard({ innovation }: InnovationCardProps) {
  const defaultColors = { primary: '#2DD4BF', glow: 'rgba(45,212,191,0.08)' };
  const colors = tintColors[innovation.tint] ?? defaultColors;

  return (
    <div className="lp-card relative overflow-hidden p-8 md:p-10 flex flex-col justify-between h-full">
      {/* Subtle glow in top-left */}
      <div
        className="absolute top-0 left-0 w-48 h-48 rounded-full blur-3xl pointer-events-none"
        style={{ background: colors.glow }}
      />

      <div className="relative z-10">
        {/* Icon */}
        <div className="mb-6">
          <CardIcon type={innovation.icon} color={colors.primary} />
        </div>

        {/* Title */}
        <h3 className="font-display text-2xl md:text-3xl text-[var(--lp-text-primary)] tracking-[-0.02em] mb-4">
          {innovation.title}
        </h3>

        {/* Description */}
        <p className="font-jakarta text-[var(--lp-text-secondary)] text-base leading-relaxed mb-6">
          {innovation.description}
        </p>
      </div>

      {/* Bottom stat */}
      <div className="relative z-10 pt-4 border-t border-[var(--lp-border)]">
        <span className="font-data text-xs text-[var(--lp-text-tertiary)] tracking-wide">
          {innovation.stat}
        </span>
      </div>

      {/* Background pattern - bottom right */}
      <div className="absolute bottom-0 right-0 w-32 h-32 opacity-[0.04] pointer-events-none">
        <svg viewBox="0 0 128 128" fill="none">
          <circle cx="64" cy="64" r="60" stroke={colors.primary} strokeWidth="0.5" />
          <circle cx="64" cy="64" r="40" stroke={colors.primary} strokeWidth="0.5" />
          <circle cx="64" cy="64" r="20" stroke={colors.primary} strokeWidth="0.5" />
        </svg>
      </div>
    </div>
  );
}
