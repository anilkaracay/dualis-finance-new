'use client';

import { INNOVATIONS } from '@/lib/landing-data';
import { InnovationCard } from './InnovationCard';
import { SectionLabel } from './shared/SectionLabel';

export function InnovationsGrid() {
  const largeCards = INNOVATIONS.filter((i) => i.size === 'large');
  const mediumCards = INNOVATIONS.filter((i) => i.size === 'medium');

  return (
    <section id="innovations" className="relative py-24 md:py-32 px-6">
      {/* Subtle background accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-0 top-1/4 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.04)_0%,transparent_70%)]" />
        <div className="absolute right-0 bottom-1/4 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(129,140,248,0.04)_0%,transparent_70%)]" />
      </div>

      <div className="relative max-w-[1200px] mx-auto">
        {/* Header — centered */}
        <div className="text-center mb-16">
          <SectionLabel className="mb-4 inline-block">FIVE INNOVATIONS</SectionLabel>
          <h2 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] text-[var(--lp-text-primary)] tracking-[-0.02em] leading-[1.1] mb-4">
            Built Different. By Design.
          </h2>
          <p className="font-jakarta text-[var(--lp-text-secondary)] text-[clamp(1rem,1.2vw,1.125rem)] max-w-[600px] mx-auto leading-relaxed">
            Every feature exists because existing DeFi couldn&apos;t serve institutions. We rebuilt
            from first principles.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="flex flex-col gap-4 md:gap-5">
          {/* Row 1 — Large cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {largeCards.map((innovation) => (
              <div key={innovation.id} className="min-h-[360px] md:min-h-[440px]">
                <InnovationCard innovation={innovation} />
              </div>
            ))}
          </div>

          {/* Row 2 — Medium cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {mediumCards.map((innovation) => (
              <div key={innovation.id} className="min-h-[280px] md:min-h-[320px]">
                <InnovationCard innovation={innovation} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
