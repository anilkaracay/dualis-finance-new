'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HERO } from '@/lib/landing-data';
import { GradientText } from './shared/GradientText';
import { CountUpNumber } from './shared/CountUpNumber';
import { NoiseOverlay } from './shared/NoiseOverlay';

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleLine1Ref = useRef<HTMLDivElement>(null);
  const titleLine2Ref = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const trustRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import('gsap').then(({ default: gsap }) => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Set initial states
      const elements = [
        titleLine1Ref.current,
        titleLine2Ref.current,
        subtitleRef.current,
        ctaRef.current,
        trustRef.current,
      ].filter(Boolean);

      gsap.set(elements, { opacity: 0, y: 40 });

      // Staggered reveal sequence
      tl.to(titleLine1Ref.current, { opacity: 1, y: 0, duration: 0.8, delay: 0.3 })
        .to(titleLine2Ref.current, { opacity: 1, y: 0, duration: 1 }, '-=0.5')
        .to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.8 }, '-=0.6')
        .to(ctaRef.current, { opacity: 1, y: 0, duration: 0.8 }, '-=0.5')
        .to(trustRef.current, { opacity: 1, y: 0, duration: 0.8 }, '-=0.4');
    });
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* ── Background Layer 1: Base color ── */}
      <div className="absolute inset-0 bg-[var(--lp-bg-primary)]" />

      {/* ── Background Layer 2: Hero photo (dark mode only, hidden in light) ── */}
      <Image
        src="/images/hero-bg.jpg"
        alt=""
        fill
        priority
        quality={90}
        className="object-cover object-center lp-hero-photo"
      />

      {/* ── Background Layer 3: Dark overlay for text readability over photo ── */}
      <div
        className="absolute inset-0 lp-hero-overlay"
        style={{
          background: 'linear-gradient(180deg, rgba(9,9,11,0.45) 0%, rgba(9,9,11,0.70) 50%, rgba(15,15,18,0.92) 100%)',
        }}
      />

      {/* ── Background Layer 4: CSS gradient mesh (visible in both modes, stronger in light) ── */}
      <div
        className="absolute inset-0"
        style={{
          background: 'var(--lp-hero-mesh)',
        }}
      />

      {/* ── Background Layer 3: Animated floating orbs ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Teal orb - top center */}
        <div
          className="absolute w-[800px] h-[800px] rounded-full opacity-[var(--lp-orb-opacity-1)]"
          style={{
            background: 'radial-gradient(circle, #2DD4BF 0%, transparent 70%)',
            top: '-20%',
            left: '50%',
            transform: 'translateX(-50%)',
            animation: 'heroOrbFloat1 12s ease-in-out infinite',
          }}
        />
        {/* Indigo orb - left */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-[var(--lp-orb-opacity-2)]"
          style={{
            background: 'radial-gradient(circle, #818CF8 0%, transparent 70%)',
            top: '30%',
            left: '-10%',
            animation: 'heroOrbFloat2 15s ease-in-out infinite',
          }}
        />
        {/* Cyan orb - right */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-[var(--lp-orb-opacity-3)]"
          style={{
            background: 'radial-gradient(circle, #06B6D4 0%, transparent 70%)',
            bottom: '10%',
            right: '-5%',
            animation: 'heroOrbFloat3 18s ease-in-out infinite',
          }}
        />
      </div>

      {/* ── Background Layer 4: Grid pattern ── */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--lp-grid-color) 1px, transparent 1px),
            linear-gradient(90deg, var(--lp-grid-color) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 70% 50% at 50% 40%, black 0%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 50% at 50% 40%, black 0%, transparent 80%)',
        }}
      />

      {/* ── Background Layer 5: Noise overlay ── */}
      <NoiseOverlay />

      {/* ── Background Layer 6: Radial teal glow at top ── */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] pointer-events-none"
        style={{
          background: 'var(--lp-hero-glow)',
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-[1100px] mx-auto pt-24 pb-20">
        {/* Hero headline */}
        <div className="mb-8">
          {/* Line 1 */}
          <div ref={titleLine1Ref} className="mb-2">
            <span className="font-jakarta font-light text-[var(--lp-text-secondary)] text-[clamp(1.5rem,4vw,3.5rem)] leading-tight block">
              {HERO.titleLine1}
            </span>
          </div>

          {/* Line 2 */}
          <div ref={titleLine2Ref}>
            <h1 className="font-display text-[clamp(3rem,8vw,7rem)] leading-[0.95] tracking-tight">
              <GradientText className="font-display">
                {HERO.titleLine2.split(' ')[0]}
              </GradientText>
              <span className="text-[var(--lp-text-primary)]">
                {' '}{HERO.titleLine2.split(' ').slice(1).join(' ')}
              </span>
            </h1>
          </div>
        </div>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="font-jakarta text-[var(--lp-text-secondary)] text-[clamp(1rem,1.5vw,1.25rem)] leading-relaxed max-w-[640px] mb-12"
        >
          {HERO.subtitle}
        </p>

        {/* CTA buttons */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <Link
            href="/auth"
            className="lp-btn-primary px-8 py-4 text-base font-jakarta font-semibold inline-flex items-center gap-2 min-w-[200px] justify-center"
          >
            {HERO.ctaPrimary}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="ml-1"
            >
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <a
            href="#developers"
            className="lp-btn-ghost px-8 py-4 text-base font-jakarta inline-flex items-center gap-2 min-w-[200px] justify-center"
          >
            {HERO.ctaSecondary}
          </a>
        </div>

        {/* Trust bar */}
        <div ref={trustRef} className="flex flex-col items-center gap-6">
          {/* Partner logos — monochrome wordmarks */}
          <div className="flex flex-wrap items-center justify-center gap-7 md:gap-10">
            {/* Goldman Sachs — serif wordmark */}
            <span
              className="text-[var(--lp-text-primary)] opacity-[0.35] hover:opacity-60 transition-opacity duration-300 cursor-default select-none font-serif text-[13px] tracking-[0.18em]"
              title="Goldman Sachs"
            >
              GOLDMAN SACHS
            </span>

            {/* DTCC — bold sans wordmark */}
            <span
              className="text-[var(--lp-text-primary)] opacity-[0.35] hover:opacity-60 transition-opacity duration-300 cursor-default select-none font-jakarta text-[15px] font-bold tracking-[0.22em]"
              title="DTCC"
            >
              DTCC
            </span>

            {/* BNP Paribas — stars mark + wordmark */}
            <span
              className="inline-flex items-center gap-1.5 text-[var(--lp-text-primary)] opacity-[0.35] hover:opacity-60 transition-opacity duration-300 cursor-default select-none"
              title="BNP Paribas"
            >
              <svg width="16" height="14" viewBox="0 0 20 18" fill="currentColor" aria-hidden="true">
                <circle cx="4" cy="14" r="1.8" />
                <circle cx="8.5" cy="9" r="1.8" />
                <circle cx="13" cy="5.5" r="1.8" />
                <circle cx="17.5" cy="9" r="1.8" />
              </svg>
              <span className="font-jakarta text-[13px] font-semibold tracking-[0.1em]">BNP PARIBAS</span>
            </span>

            {/* HSBC — hexagonal mark + wordmark */}
            <span
              className="inline-flex items-center gap-1.5 text-[var(--lp-text-primary)] opacity-[0.35] hover:opacity-60 transition-opacity duration-300 cursor-default select-none"
              title="HSBC"
            >
              <svg width="20" height="16" viewBox="0 0 34 26" fill="currentColor" aria-hidden="true">
                <polygon points="0,0 17,13 0,26" />
                <polygon points="34,0 17,13 34,26" />
              </svg>
              <span className="font-jakarta text-[14px] font-bold tracking-[0.18em]">HSBC</span>
            </span>

            {/* S&P Global — sans wordmark */}
            <span
              className="text-[var(--lp-text-primary)] opacity-[0.35] hover:opacity-60 transition-opacity duration-300 cursor-default select-none font-jakarta text-[13px] font-semibold tracking-[0.08em]"
              title="S&P Global"
            >
              S&amp;P GLOBAL
            </span>
          </div>

          {/* Trust statement with counter */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center">
            <span className="font-jakarta text-sm text-[var(--lp-text-tertiary)]">
              {HERO.trustLabel}
            </span>
            <CountUpNumber
              value={6_000_000_000_000}
              prefix="$"
              suffix="T+"
              decimals={0}
              className="text-2xl font-bold text-[var(--lp-accent)]"
            />
            <span className="font-jakarta text-sm text-[var(--lp-text-tertiary)]">
              {HERO.trustSuffix}
            </span>
          </div>
        </div>
      </div>

      {/* ── Bottom gradient fade ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-[2]"
        style={{
          background: 'var(--lp-hero-fade)',
        }}
      />

    </section>
  );
}
