'use client';

import { INNOVATIONS } from '@/lib/landing-data';
import { InnovationCard } from './InnovationCard';
import { SectionLabel } from './shared/SectionLabel';

export function InnovationsGrid() {
  const largeCards = INNOVATIONS.filter((i) => i.size === 'large');
  const mediumCards = INNOVATIONS.filter((i) => i.size === 'medium');

  return (
    <section id="innovations" className="relative py-24 md:py-32 px-6">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-16">
          <SectionLabel className="mb-4">FIVE INNOVATIONS</SectionLabel>
          <h2 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] text-[#FAFAFA] tracking-[-0.02em] leading-[1.1] mb-4">
            Built Different. By Design.
          </h2>
          <p className="font-jakarta text-[#A1A1AA] text-[clamp(1rem,1.2vw,1.125rem)] max-w-[600px] leading-relaxed">
            Every feature exists because existing DeFi couldn&apos;t serve institutions. We rebuilt
            from first principles.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="flex flex-col gap-4 md:gap-6">
          {/* Row 1 — Large cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {largeCards.map((innovation) => (
              <div key={innovation.id} className="min-h-[320px] md:min-h-[380px]">
                <InnovationCard innovation={innovation} />
              </div>
            ))}
          </div>

          {/* Row 2 — Medium cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
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
