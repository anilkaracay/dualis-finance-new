'use client';

import { useEffect, useRef } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { MetricsBar } from '@/components/landing/MetricsBar';
import { MissionStatement } from '@/components/landing/MissionStatement';
import { InnovationsGrid } from '@/components/landing/InnovationsGrid';
import { PlatformPreview } from '@/components/landing/PlatformPreview';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { EcosystemMap } from '@/components/landing/EcosystemMap';
import { ComparisonTable } from '@/components/landing/ComparisonTable';
import { SecuritySection } from '@/components/landing/SecuritySection';
import { DeveloperSection } from '@/components/landing/DeveloperSection';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  const mainRef = useRef<HTMLDivElement>(null);

  /* ── GSAP scroll-triggered section reveals ── */
  useEffect(() => {
    let ctx: { revert: () => void } | null = null;

    const initGSAP = async () => {
      try {
        const gsapModule = await import('gsap');
        const scrollTriggerModule = await import('gsap/ScrollTrigger');

        const gsap = gsapModule.default || gsapModule;
        const ScrollTrigger = scrollTriggerModule.ScrollTrigger || scrollTriggerModule.default;

        gsap.registerPlugin(ScrollTrigger);

        const sections = mainRef.current?.querySelectorAll<HTMLElement>('.lp-section');
        if (!sections || sections.length === 0) return;

        // Mark that GSAP is ready — hide sections for animation
        sections.forEach((s) => {
          s.style.opacity = '0';
          s.style.transform = 'translateY(60px)';
        });

        ctx = gsap.context(() => {
          sections.forEach((section) => {
            gsap.to(section, {
              opacity: 1,
              y: 0,
              duration: 0.9,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: section,
                start: 'top 85%',
                once: true,
              },
            });
          });
        }, mainRef);
      } catch {
        // GSAP failed — sections stay visible (no initial opacity:0)
      }
    };

    initGSAP();

    return () => {
      ctx?.revert();
    };
  }, []);

  return (
    <div ref={mainRef} className="relative min-h-screen overflow-x-hidden">
      {/* ── Fixed Navigation ── */}
      <Navbar />

      {/* ── Hero — full viewport cinematic intro ── */}
      <HeroSection />

      {/* ── Metrics Bar — key stats strip ── */}
      <MetricsBar />

      {/* ── Each section below gets GSAP scroll-reveal via .lp-section ── */}

      <div className="lp-section">
        <MissionStatement />
      </div>

      <div className="lp-section">
        <InnovationsGrid />
      </div>

      <div className="lp-section">
        <PlatformPreview />
      </div>

      <div className="lp-section">
        <HowItWorks />
      </div>

      <div className="lp-section">
        <EcosystemMap />
      </div>

      <div className="lp-section">
        <ComparisonTable />
      </div>

      <div className="lp-section">
        <SecuritySection />
      </div>

      <div className="lp-section">
        <DeveloperSection />
      </div>

      <div className="lp-section">
        <CTASection />
      </div>

      {/* ── Footer — always visible ── */}
      <Footer />
    </div>
  );
}
