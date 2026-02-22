'use client';

import { HOW_IT_WORKS } from '@/lib/landing-data';
import { SectionLabel } from './shared/SectionLabel';

/* Step icons as inline SVGs */
const STEP_ICONS = [
  /* Wallet */
  <svg key="wallet" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-1" />
    <path d="M16 12a1 1 0 102 0 1 1 0 00-2 0z" fill="currentColor" />
    <path d="M3 7l9-4 9 4" />
  </svg>,
  /* Deploy / Layers */
  <svg key="deploy" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>,
  /* Chart / Returns */
  <svg key="returns" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>,
];

export function HowItWorks() {
  return (
    <section className="relative py-24 md:py-32 px-6 overflow-hidden">
      {/* Subtle background mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse,var(--lp-accent-subtle)_0%,transparent_70%)] opacity-50" />
      </div>

      <div className="relative max-w-[1100px] mx-auto">
        <div className="text-center mb-16">
          <SectionLabel className="mb-4 inline-block">HOW IT WORKS</SectionLabel>
          <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] text-[var(--lp-text-primary)] tracking-[-0.02em] leading-[1.1]">
            From Connection to Returns in Minutes
          </h2>
        </div>

        {/* Steps grid with connecting line */}
        <div className="relative">
          {/* Horizontal connector line (desktop only) */}
          <div className="hidden md:block absolute top-[52px] left-[16.67%] right-[16.67%] h-px">
            <div className="w-full h-full bg-gradient-to-r from-transparent via-[var(--lp-accent)] to-transparent opacity-20" />
            {/* Animated particle on the line */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
              <div className="h-px bg-gradient-to-r from-transparent via-[var(--lp-accent)] to-transparent opacity-60 eco-slide" style={{ width: '30%' }} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="group relative">
                {/* Card */}
                <div className="relative rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-gradient-card)] p-6 md:p-8 transition-all duration-300 hover:border-[var(--lp-border-hover)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.1)] h-full">
                  {/* Top glass shine */}
                  <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-[var(--lp-border-hover)] to-transparent" />

                  {/* Icon circle */}
                  <div className="relative mb-6">
                    <div className="w-[72px] h-[72px] rounded-2xl bg-[var(--lp-bg-secondary)] border border-[var(--lp-border)] flex items-center justify-center transition-all duration-300 group-hover:border-[var(--lp-accent)] group-hover:shadow-[0_0_24px_var(--lp-accent-glow)]">
                      {/* Step number badge */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--lp-accent)] flex items-center justify-center shadow-[0_0_12px_var(--lp-accent-glow)]">
                        <span className="text-[10px] font-jakarta font-bold text-white">{i + 1}</span>
                      </div>
                      {/* Icon */}
                      <div className="text-[var(--lp-accent)] transition-transform duration-300 group-hover:scale-110">
                        {STEP_ICONS[i]}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="font-jakarta font-semibold text-lg md:text-xl text-[var(--lp-text-primary)] mb-3 group-hover:text-[var(--lp-accent)] transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="font-jakarta text-sm text-[var(--lp-text-secondary)] leading-relaxed">
                    {step.description}
                  </p>

                  {/* Bottom accent bar */}
                  <div className="mt-6 h-[2px] w-10 rounded-full bg-[var(--lp-accent)] opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
                </div>

                {/* Mobile connector arrow (not on last) */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="md:hidden flex justify-center py-3">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[var(--lp-accent)] opacity-30">
                      <path d="M10 4v12M6 12l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
