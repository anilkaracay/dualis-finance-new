'use client';

import Link from 'next/link';

export function CTASection() {
  return (
    <section className="relative py-32 md:py-40 px-6 overflow-hidden">
      {/* Background mesh */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 30% 50%, var(--lp-cta-mesh-1), transparent 50%),
            radial-gradient(ellipse at 70% 50%, var(--lp-cta-mesh-2), transparent 50%)
          `,
        }}
      />

      <div className="relative max-w-[700px] mx-auto text-center">
        <h2 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] text-[var(--lp-text-primary)] tracking-[-0.02em] leading-[1.1] mb-6">
          Ready to Reshape Finance?
        </h2>
        <p className="font-jakarta text-[var(--lp-text-secondary)] text-lg mb-10 leading-relaxed">
          Join the institutions and innovators building the future of capital markets.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            href="/overview"
            className="lp-btn-primary h-14 px-8 text-base font-jakarta inline-flex items-center gap-2"
          >
            Launch Protocol <span>&rarr;</span>
          </Link>
          <a
            href="#"
            className="lp-btn-ghost h-14 px-8 text-base font-jakarta inline-flex items-center"
          >
            Talk to Sales
          </a>
        </div>

        {/* Participants */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex -space-x-2">
            {[
              'linear-gradient(135deg, #2DD4BF, #06B6D4)',
              'linear-gradient(135deg, #818CF8, #A78BFA)',
              'linear-gradient(135deg, #FBBF24, #F59E0B)',
              'linear-gradient(135deg, #06B6D4, #2DD4BF)',
              'linear-gradient(135deg, #A78BFA, #818CF8)',
              'linear-gradient(135deg, #F59E0B, #FBBF24)',
              'linear-gradient(135deg, #2DD4BF, #818CF8)',
              'linear-gradient(135deg, #818CF8, #2DD4BF)',
            ].map((bg, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-[var(--lp-avatar-border)]"
                style={{ background: bg }}
              />
            ))}
          </div>
          <span className="font-jakarta text-sm text-[var(--lp-text-tertiary)]">
            +2,400 protocol participants
          </span>
        </div>
      </div>
    </section>
  );
}
