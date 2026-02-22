'use client';

import { SECURITY_CARDS } from '@/lib/landing-data';
import { SectionLabel } from './shared/SectionLabel';

function SecurityIcon({ type }: { type: string }) {
  const props = { width: 32, height: 32, viewBox: '0 0 32 32', fill: 'none', stroke: '#2DD4BF', strokeWidth: '1.5', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (type) {
    case 'lock':
      return (
        <svg {...props}>
          <rect x="8" y="14" width="16" height="14" rx="2" />
          <path d="M12 14V10a4 4 0 018 0v4" />
        </svg>
      );
    case 'code':
      return (
        <svg {...props}>
          <path d="M12 10l-6 6 6 6M20 10l6 6-6 6" />
        </svg>
      );
    case 'scale':
      return (
        <svg {...props}>
          <path d="M16 4v24M4 12l12-4 12 4M4 12l4 8h-8l4-8zM28 12l-4 8h8l-4-8z" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...props}>
          <path d="M16 2l12 5v9c0 7-5 12-12 16-7-4-12-9-12-16V7l12-5z" />
          <path d="M11 16l3 3 7-7" />
        </svg>
      );
    default:
      return null;
  }
}

export function SecuritySection() {
  return (
    <section className="relative py-24 md:py-32 px-6">
      <div className="max-w-[1200px] mx-auto">
        <SectionLabel className="mb-4">TRUST &amp; SECURITY</SectionLabel>
        <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] text-[var(--lp-text-primary)] tracking-[-0.02em] leading-[1.1] mb-12">
          Institutional-Grade From Day One
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {SECURITY_CARDS.map((card) => (
            <div
              key={card.title}
              className="border border-[var(--lp-border)] rounded-2xl p-8 hover:border-[var(--lp-border-hover)] transition-colors"
            >
              <div className="mb-4">
                <SecurityIcon type={card.icon} />
              </div>
              <h3 className="font-jakarta font-semibold text-lg text-[var(--lp-text-primary)] mb-2">
                {card.title}
              </h3>
              <p className="font-jakarta text-sm text-[var(--lp-text-secondary)] leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
