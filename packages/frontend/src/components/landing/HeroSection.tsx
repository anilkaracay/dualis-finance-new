'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { HERO, TRUST_PARTNERS } from '@/lib/landing-data';
import { GradientText } from './shared/GradientText';
import { CountUpNumber } from './shared/CountUpNumber';
import { NoiseOverlay } from './shared/NoiseOverlay';

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
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
        eyebrowRef.current,
        titleLine1Ref.current,
        titleLine2Ref.current,
        subtitleRef.current,
        ctaRef.current,
        trustRef.current,
      ].filter(Boolean);

      gsap.set(elements, { opacity: 0, y: 40 });

      // Staggered reveal sequence
      tl.to(eyebrowRef.current, { opacity: 1, y: 0, duration: 0.8, delay: 0.3 })
        .to(titleLine1Ref.current, { opacity: 1, y: 0, duration: 0.8 }, '-=0.5')
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
      <div className="absolute inset-0 bg-[#09090B]" />

      {/* ── Background Layer 2: Animated CSS gradient mesh ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(45, 212, 191, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 20% 50%, rgba(129, 140, 248, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse 60% 50% at 80% 50%, rgba(6, 182, 212, 0.05) 0%, transparent 50%),
            radial-gradient(ellipse 50% 40% at 50% 100%, rgba(45, 212, 191, 0.04) 0%, transparent 50%),
            linear-gradient(135deg, #0F172A 0%, #09090B 50%, #0C1220 100%)
          `,
        }}
      />

      {/* ── Background Layer 3: Animated floating orbs ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Teal orb - top center */}
        <div
          className="absolute w-[800px] h-[800px] rounded-full opacity-[0.07]"
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
          className="absolute w-[600px] h-[600px] rounded-full opacity-[0.05]"
          style={{
            background: 'radial-gradient(circle, #818CF8 0%, transparent 70%)',
            top: '30%',
            left: '-10%',
            animation: 'heroOrbFloat2 15s ease-in-out infinite',
          }}
        />
        {/* Cyan orb - right */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-[0.04]"
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
            linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)
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
          background: 'radial-gradient(ellipse 100% 100% at 50% 0%, rgba(45, 212, 191, 0.12) 0%, transparent 70%)',
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-[1100px] mx-auto pt-24 pb-20">
        {/* Eyebrow pill badge */}
        <div ref={eyebrowRef} className="mb-8">
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] backdrop-blur-sm">
            <span className="lp-pulse-dot w-2 h-2 rounded-full bg-[#2DD4BF] inline-block" />
            <span className="font-jakarta text-sm text-[#A1A1AA] tracking-wide">
              {HERO.eyebrow}
            </span>
          </div>
        </div>

        {/* Hero headline */}
        <div className="mb-8">
          {/* Line 1 */}
          <div ref={titleLine1Ref} className="mb-2">
            <span className="font-jakarta font-light text-[#A1A1AA] text-[clamp(1.5rem,4vw,3.5rem)] leading-tight block">
              {HERO.titleLine1}
            </span>
          </div>

          {/* Line 2 */}
          <div ref={titleLine2Ref}>
            <h1 className="font-display text-[clamp(3rem,8vw,7rem)] leading-[0.95] tracking-tight">
              <GradientText className="font-display">
                {HERO.titleLine2.split(' ')[0]}
              </GradientText>
              <span className="text-[#FAFAFA]">
                {' '}{HERO.titleLine2.split(' ').slice(1).join(' ')}
              </span>
            </h1>
          </div>
        </div>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="font-jakarta text-[#A1A1AA] text-[clamp(1rem,1.5vw,1.25rem)] leading-relaxed max-w-[640px] mb-12"
        >
          {HERO.subtitle}
        </p>

        {/* CTA buttons */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <Link
            href="/overview"
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
          {/* Partner chips */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {TRUST_PARTNERS.map((partner) => (
              <div
                key={partner.abbr}
                className="px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] backdrop-blur-sm"
                title={partner.name}
              >
                <span className="font-jakarta text-xs font-medium text-[#71717A] tracking-wider">
                  {partner.abbr}
                </span>
              </div>
            ))}
          </div>

          {/* Trust statement with counter */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center">
            <span className="font-jakarta text-sm text-[#71717A]">
              {HERO.trustLabel}
            </span>
            <CountUpNumber
              value={6_000_000_000_000}
              prefix="$"
              suffix="T+"
              decimals={0}
              className="text-2xl font-bold text-[#2DD4BF]"
            />
            <span className="font-jakarta text-sm text-[#71717A]">
              {HERO.trustSuffix}
            </span>
          </div>
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3">
        <span className="font-jakarta text-xs text-[#71717A] tracking-widest uppercase">
          Scroll
        </span>
        <div className="lp-scroll-indicator">
          <svg
            width="20"
            height="28"
            viewBox="0 0 20 28"
            fill="none"
            className="text-[#71717A]"
          >
            <rect
              x="1"
              y="1"
              width="18"
              height="26"
              rx="9"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <circle cx="10" cy="9" r="2" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* ── Bottom gradient fade ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-[2]"
        style={{
          background: 'linear-gradient(to top, #0F0F12 0%, transparent 100%)',
        }}
      />

      {/* ── Keyframe animations for floating orbs ── */}
      <style jsx>{`
        @keyframes heroOrbFloat1 {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(20px); }
        }
        @keyframes heroOrbFloat2 {
          0%, 100% { transform: translateY(0) translateX(0); }
          33% { transform: translateY(-15px) translateX(10px); }
          66% { transform: translateY(10px) translateX(-5px); }
        }
        @keyframes heroOrbFloat3 {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-25px) translateX(-15px); }
        }
      `}</style>
    </section>
  );
}
