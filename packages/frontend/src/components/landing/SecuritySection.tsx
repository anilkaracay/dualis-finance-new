'use client';

import { SECURITY_CARDS } from '@/lib/landing-data';
import { SectionLabel } from './shared/SectionLabel';

/* Highlight badge per card — adds credibility */
const CARD_BADGES: Record<string, string> = {
  'Canton Privacy': 'Sub-transaction level',
  'Daml Smart Contracts': '$6T+ in assets',
  'Regulatory Ready': 'FATF compliant',
  'Battle-Tested': 'Goldman Sachs · DTCC',
};

function SecurityIcon({ type }: { type: string }) {
  const props = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.5',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (type) {
    case 'lock':
      return (
        <svg {...props}>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 018 0v4" />
          <circle cx="12" cy="16" r="1" fill="currentColor" />
        </svg>
      );
    case 'code':
      return (
        <svg {...props}>
          <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" />
          <path d="M14 4l-4 16" strokeDasharray="2 2" />
        </svg>
      );
    case 'scale':
      return (
        <svg {...props}>
          <path d="M12 3v18M3 9l9-3 9 3" />
          <path d="M3 9l3 6H0l3-6zM21 9l3 6h-6l3-6z" />
          <path d="M9 21h6" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...props}>
          <path d="M12 2l8 4v6c0 5.5-3.5 10-8 12-4.5-2-8-6.5-8-12V6l8-4z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    default:
      return null;
  }
}

export function SecuritySection() {
  return (
    <section className="relative py-24 md:py-32 px-6">
      {/* Subtle bg accent */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,var(--lp-accent-subtle)_0%,transparent_70%)] opacity-40" />
      </div>

      <div className="relative max-w-[1200px] mx-auto">
        {/* Header — centered */}
        <div className="text-center mb-14">
          <SectionLabel className="mb-4 inline-block">TRUST &amp; SECURITY</SectionLabel>
          <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] text-[var(--lp-text-primary)] tracking-[-0.02em] leading-[1.1] mb-4">
            Institutional-Grade From Day One
          </h2>
          <p className="font-jakarta text-[var(--lp-text-secondary)] text-base max-w-[560px] mx-auto leading-relaxed">
            Enterprise security standards backed by the same infrastructure trusted by the world&apos;s largest financial institutions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {SECURITY_CARDS.map((card) => {
            const badge = CARD_BADGES[card.title];
            return (
              <div
                key={card.title}
                className="group relative rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-gradient-card)] p-7 md:p-8 transition-all duration-300 hover:border-[var(--lp-border-hover)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] overflow-hidden"
              >
                {/* Top glass shine */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--lp-border-hover)] to-transparent" />

                {/* Hover accent top bar */}
                <div className="absolute inset-x-0 top-0 h-[2px] bg-[var(--lp-accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Icon + Badge row */}
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-[var(--lp-bg-secondary)] border border-[var(--lp-border)] flex items-center justify-center text-[var(--lp-accent)] group-hover:border-[var(--lp-accent)] group-hover:shadow-[0_0_16px_var(--lp-accent-glow)] transition-all duration-300">
                    <SecurityIcon type={card.icon} />
                  </div>
                  {badge && (
                    <span className="font-jakarta text-[10px] md:text-[11px] font-medium px-2.5 py-1 rounded-full border border-[var(--lp-border)] text-[var(--lp-text-tertiary)] bg-[var(--lp-glass)] group-hover:border-[var(--lp-accent)] group-hover:text-[var(--lp-accent)] transition-all duration-300">
                      {badge}
                    </span>
                  )}
                </div>

                {/* Content */}
                <h3 className="font-jakarta font-semibold text-lg md:text-xl text-[var(--lp-text-primary)] mb-2.5 group-hover:text-[var(--lp-accent)] transition-colors duration-300">
                  {card.title}
                </h3>
                <p className="font-jakarta text-sm text-[var(--lp-text-secondary)] leading-relaxed">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
