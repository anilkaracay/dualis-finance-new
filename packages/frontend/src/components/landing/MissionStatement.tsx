'use client';

import { useRef, useEffect, useState } from 'react';
import { MISSION } from '@/lib/landing-data';
import { SectionLabel } from './shared/SectionLabel';

export function MissionStatement() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const windowH = window.innerHeight;
      // Progress from 0 (just entering) to 1 (fully scrolled past center)
      const raw = 1 - (rect.top + rect.height * 0.3) / windowH;
      setProgress(Math.max(0, Math.min(1, raw)));
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Render statement with highlighted words
  const renderStatement = () => {
    let text: string = MISSION.statement;
    const parts: { text: string; highlight: boolean }[] = [];

    for (const hw of MISSION.highlightWords) {
      const idx = text.indexOf(hw);
      if (idx >= 0) {
        if (idx > 0) parts.push({ text: text.slice(0, idx), highlight: false });
        parts.push({ text: hw, highlight: true });
        text = text.slice(idx + hw.length);
      }
    }
    if (text) parts.push({ text, highlight: false });

    return parts.map((part, i) =>
      part.highlight ? (
        <span key={i} className="lp-gradient-text font-semibold">
          {part.text}
        </span>
      ) : (
        <span key={i}>{part.text}</span>
      )
    );
  };

  return (
    <section
      ref={sectionRef}
      className="relative py-32 md:py-40 flex items-center justify-center px-6"
    >
      <div className="max-w-[800px] mx-auto">
        <SectionLabel className="mb-8">{MISSION.label}</SectionLabel>

        <h2
          className="font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.15] tracking-[-0.02em] text-[#FAFAFA] mb-8"
          style={{ opacity: 0.2 + progress * 0.8 }}
        >
          {renderStatement()}
        </h2>

        <p
          className="font-jakarta text-[clamp(1rem,1.2vw,1.125rem)] text-[#A1A1AA] leading-relaxed max-w-[700px]"
          style={{ opacity: Math.max(0, (progress - 0.3) * 1.4) }}
        >
          {MISSION.detail}
        </p>
      </div>
    </section>
  );
}
