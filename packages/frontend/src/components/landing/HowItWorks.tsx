'use client';

import { HOW_IT_WORKS } from '@/lib/landing-data';
import { SectionLabel } from './shared/SectionLabel';

export function HowItWorks() {
  return (
    <section className="relative py-24 md:py-32 px-6">
      <div className="max-w-[1000px] mx-auto">
        <SectionLabel className="mb-4">HOW IT WORKS</SectionLabel>
        <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] text-[#FAFAFA] tracking-[-0.02em] leading-[1.1] mb-16">
          From Connection to Returns in Minutes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.step} className="relative flex flex-col md:px-8 first:md:pl-0 last:md:pr-0">
              {/* Connector line (desktop only, not on last) */}
              {i < HOW_IT_WORKS.length - 1 && (
                <div className="hidden md:block absolute top-0 right-0 h-full w-px border-l border-dashed border-[rgba(255,255,255,0.1)]" />
              )}

              <span className="font-data text-[clamp(2rem,4vw,3rem)] text-[#2DD4BF] opacity-30 leading-none mb-4">
                {step.step}
              </span>
              <h3 className="font-jakarta font-semibold text-lg text-[#FAFAFA] mb-2">
                {step.title}
              </h3>
              <p className="font-jakarta text-sm text-[#A1A1AA] leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
