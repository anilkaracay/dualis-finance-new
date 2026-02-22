'use client';

import { ECOSYSTEM } from '@/lib/landing-data';
import { SectionLabel } from './shared/SectionLabel';

/* ── Node definitions with positions + monograms ── */
const PARTNER_NODES = [
  { id: 'canton', label: 'Canton Network', monogram: 'CN', x: 50, y: 12, size: 'md' as const },
  { id: 'tifa', label: 'TIFA Finance', monogram: 'TF', x: 18, y: 30, size: 'sm' as const },
  { id: 'partylayer', label: 'PartyLayer', monogram: 'PL', x: 82, y: 30, size: 'sm' as const },
  { id: 'dtcc', label: 'DTCC', monogram: 'D', x: 13, y: 68, size: 'sm' as const, bold: true },
  { id: 'goldman', label: 'Goldman Sachs', monogram: 'GS', x: 87, y: 68, size: 'sm' as const, serif: true },
  { id: 'sync', label: 'Global Sync', monogram: 'GS', x: 50, y: 88, size: 'sm' as const },
] as const;

export function EcosystemMap() {
  return (
    <section id="ecosystem" className="relative py-24 md:py-32 px-6 bg-[var(--lp-bg-secondary)]">
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--lp-dot-color) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative max-w-[1000px] mx-auto text-center">
        <SectionLabel className="mb-4 inline-block">{ECOSYSTEM.label}</SectionLabel>
        <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] text-[var(--lp-text-primary)] tracking-[-0.02em] leading-[1.1] mb-4">
          {ECOSYSTEM.title}
        </h2>
        <p className="font-jakarta text-[var(--lp-text-secondary)] text-base max-w-[640px] mx-auto mb-16 leading-relaxed">
          {ECOSYSTEM.subtitle}
        </p>

        {/* ── Network Visualization ── */}
        <div className="relative w-full max-w-[600px] mx-auto aspect-square mb-16">

          {/* SVG Connection Lines (background layer) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
          >
            {PARTNER_NODES.map((node, i) => (
              <line
                key={`line-${node.id}`}
                x1="50" y1="50"
                x2={node.x} y2={node.y}
                stroke="rgba(45,212,191,0.12)"
                strokeWidth="0.25"
                strokeDasharray="1 2"
              >
                <animate
                  attributeName="opacity"
                  values="0.2;0.7;0.2"
                  dur="3s"
                  repeatCount="indefinite"
                  begin={`${i * 0.4}s`}
                />
              </line>
            ))}
          </svg>

          {/* ── Center — DUALIS node ── */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="relative">
              {/* Outer glow pulse */}
              <div className="absolute -inset-4 rounded-full bg-[#2DD4BF]/[0.06] animate-pulse" />
              <div className="absolute -inset-2 rounded-full bg-[#2DD4BF]/[0.04]" />
              {/* Main node */}
              <div className="relative w-[76px] h-[76px] rounded-full bg-[var(--lp-bg-primary)] border-[1.5px] border-[#2DD4BF] flex items-center justify-center shadow-[0_0_40px_rgba(45,212,191,0.15)]">
                <span className="text-[#2DD4BF] font-bold text-[11px] tracking-[0.2em] font-jakarta">
                  DUALIS
                </span>
              </div>
            </div>
          </div>

          {/* ── Partner Nodes ── */}
          {PARTNER_NODES.map((node) => {
            const isLarger = node.size === 'md';
            const circleSize = isLarger ? 'w-[52px] h-[52px]' : 'w-[44px] h-[44px]';
            const monoSize = isLarger ? 'text-[11px]' : 'text-[10px]';

            return (
              <div
                key={node.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 group"
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
              >
                {/* Monogram circle */}
                <div
                  className={`${circleSize} rounded-full bg-[var(--lp-node-fill)] border border-[var(--lp-node-stroke)] flex items-center justify-center transition-all duration-300 group-hover:border-[#2DD4BF]/40 group-hover:shadow-[0_0_16px_rgba(45,212,191,0.08)]`}
                >
                  {/* Special marks for real companies */}
                  {node.id === 'goldman' ? (
                    <span className={`${monoSize} font-serif font-bold text-[var(--lp-text-secondary)] group-hover:text-[var(--lp-text-primary)] transition-colors`}>
                      GS
                    </span>
                  ) : node.id === 'dtcc' ? (
                    <span className={`${monoSize} font-jakarta font-extrabold tracking-[0.1em] text-[var(--lp-text-secondary)] group-hover:text-[var(--lp-text-primary)] transition-colors`}>
                      D
                    </span>
                  ) : (
                    <span className={`${monoSize} font-jakarta font-semibold text-[var(--lp-text-secondary)] group-hover:text-[var(--lp-text-primary)] transition-colors`}>
                      {node.monogram}
                    </span>
                  )}
                </div>
                {/* Label */}
                <span className="text-[10px] md:text-[11px] text-[var(--lp-text-tertiary)] font-jakarta whitespace-nowrap group-hover:text-[var(--lp-text-secondary)] transition-colors">
                  {node.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[700px] mx-auto">
          {ECOSYSTEM.stats.map((stat) => (
            <div key={stat.label}>
              <div className="font-data text-3xl md:text-4xl font-semibold text-[var(--lp-text-primary)] mb-1">
                {stat.value}
              </div>
              <div className="font-jakarta text-xs uppercase tracking-widest text-[var(--lp-text-tertiary)]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
