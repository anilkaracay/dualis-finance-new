'use client';

import { DEV_SECTION } from '@/lib/landing-data';
import { SectionLabel } from './shared/SectionLabel';

function highlightCode(code: string): string {
  return code
    .replace(/\/\/.*/g, (m) => `<span class="comment">${m}</span>`)
    .replace(/'[^']*'/g, (m) => `<span class="string">${m}</span>`)
    .replace(/\b(import|from|const|await|new)\b/g, '<span class="keyword">$1</span>')
    .replace(/\b(console)\b/g, '<span class="function">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>');
}

export function DeveloperSection() {
  return (
    <section id="developers" className="relative py-24 md:py-32 px-6 bg-[#0F0F12]">
      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left */}
        <div>
          <SectionLabel className="mb-4">{DEV_SECTION.label}</SectionLabel>
          <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] text-[#FAFAFA] tracking-[-0.02em] leading-[1.1] mb-4">
            {DEV_SECTION.title}
          </h2>
          <p className="font-jakarta text-[#A1A1AA] text-base leading-relaxed mb-8">
            {DEV_SECTION.subtitle}
          </p>
          <ul className="space-y-3">
            {DEV_SECTION.bullets.map((b) => (
              <li key={b} className="flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="10" fill="rgba(45,212,191,0.15)" />
                  <path d="M6 10l3 3 5-6" stroke="#2DD4BF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-jakarta text-sm text-[#A1A1AA]">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — Code Block */}
        <div className="relative rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#09090B] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
            </div>
            <span className="font-mono text-[10px] text-[#71717A]">example.ts</span>
            <button className="font-jakarta text-[10px] text-[#71717A] hover:text-[#A1A1AA] transition-colors px-2 py-1 rounded border border-[rgba(255,255,255,0.06)]">
              Copy
            </button>
          </div>

          {/* Code */}
          <div className="p-6 overflow-x-auto">
            <pre className="lp-code font-mono text-sm leading-relaxed text-[#A1A1AA]">
              <code dangerouslySetInnerHTML={{ __html: highlightCode(DEV_SECTION.code) }} />
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
