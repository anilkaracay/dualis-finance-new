'use client';

import Image from 'next/image';
import { ECOSYSTEM } from '@/lib/landing-data';
import { SectionLabel } from './shared/SectionLabel';

/* ── Node definitions with orbital positions + logo paths ── */
const PARTNER_NODES = [
  { id: 'canton',     label: 'Canton Network', logo: '/images/logos/canton-network.svg', x: 50, y: 8,  delay: 0 },
  { id: 'tifa',       label: 'TIFA Finance',   logo: '/images/logos/tifa-finance.svg',   x: 12, y: 32, delay: 1 },
  { id: 'partylayer', label: 'PartyLayer',      logo: '/images/logos/partylayer.svg',     x: 88, y: 32, delay: 2 },
  { id: 'dtcc',       label: 'DTCC',            logo: '/images/logos/dtcc.svg',           x: 8,  y: 72, delay: 3 },
  { id: 'goldman',    label: 'Goldman Sachs',   logo: '/images/logos/goldman-sachs.svg',  x: 92, y: 72, delay: 4 },
  { id: 'sync',       label: 'Global Sync',     logo: '/images/logos/global-sync.svg',    x: 50, y: 92, delay: 5 },
] as const;

const CENTER = { x: 50, y: 50 };

export function EcosystemMap() {
  return (
    <section id="ecosystem" className="relative py-24 md:py-32 px-6 bg-[var(--lp-bg-secondary)] overflow-hidden">
      {/* Background radial mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,var(--lp-accent-subtle)_0%,transparent_70%)] opacity-60" />
      </div>

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
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
        <div className="relative w-full max-w-[680px] mx-auto aspect-square mb-16">

          {/* SVG Connection Lines */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Gradient for lines: accent at center, fading out */}
              <linearGradient id="eco-line-grad-out" gradientUnits="objectBoundingBox">
                <stop offset="0%" stopColor="var(--lp-accent)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="var(--lp-accent)" stopOpacity="0.08" />
              </linearGradient>
              <linearGradient id="eco-line-grad-in" gradientUnits="objectBoundingBox">
                <stop offset="0%" stopColor="var(--lp-accent)" stopOpacity="0.08" />
                <stop offset="100%" stopColor="var(--lp-accent)" stopOpacity="0.5" />
              </linearGradient>
              {/* Glow filter */}
              <filter id="eco-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="0.4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Connection lines with animated particles */}
            {PARTNER_NODES.map((node, i) => {
              return (
                <g key={`conn-${node.id}`}>
                  {/* Base line */}
                  <line
                    x1={CENTER.x} y1={CENTER.y}
                    x2={node.x} y2={node.y}
                    stroke="var(--lp-accent)"
                    strokeOpacity="0.12"
                    strokeWidth="0.3"
                  />
                  {/* Animated particle line */}
                  <line
                    x1={CENTER.x} y1={CENTER.y}
                    x2={node.x} y2={node.y}
                    stroke="var(--lp-accent)"
                    strokeOpacity="0.6"
                    strokeWidth="0.3"
                    strokeDasharray="1.5 8"
                    filter="url(#eco-glow)"
                    className="eco-particle-line"
                    style={{ animationDelay: `${i * 0.5}s` }}
                  />
                  {/* Endpoint dot at node */}
                  <circle
                    cx={node.x} cy={node.y}
                    r="0.6"
                    fill="var(--lp-accent)"
                    opacity="0.4"
                  />
                </g>
              );
            })}

            {/* Center decorative rings */}
            <circle cx={CENTER.x} cy={CENTER.y} r="12" fill="none" stroke="var(--lp-accent)" strokeOpacity="0.06" strokeWidth="0.2" />
            <circle cx={CENTER.x} cy={CENTER.y} r="20" fill="none" stroke="var(--lp-accent)" strokeOpacity="0.04" strokeWidth="0.15" strokeDasharray="2 4" className="eco-spin-slow" />
            <circle cx={CENTER.x} cy={CENTER.y} r="28" fill="none" stroke="var(--lp-accent)" strokeOpacity="0.03" strokeWidth="0.1" strokeDasharray="1 6" className="eco-spin-reverse" />
          </svg>

          {/* ── Center — DUALIS hub ── */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="relative">
              {/* Outer glow rings */}
              <div className="absolute -inset-8 rounded-full bg-[var(--lp-accent)] opacity-[0.03] eco-breathe" />
              <div className="absolute -inset-5 rounded-full bg-[var(--lp-accent)] opacity-[0.05] eco-breathe" style={{ animationDelay: '0.5s' }} />
              <div className="absolute -inset-2.5 rounded-full border border-[var(--lp-accent)] opacity-[0.15]" />

              {/* Main node */}
              <div className="relative w-[84px] h-[84px] md:w-[96px] md:h-[96px] rounded-full bg-[var(--lp-bg-primary)] border-2 border-[var(--lp-accent)] flex items-center justify-center shadow-[0_0_60px_rgba(45,212,191,0.2)]">
                <div className="text-center">
                  <span className="text-[var(--lp-accent)] font-bold text-xs md:text-[13px] tracking-[0.2em] font-jakarta">
                    DUALIS
                  </span>
                  <div className="mt-0.5 h-[1.5px] w-8 mx-auto rounded-full bg-[var(--lp-accent)] opacity-40" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Partner Nodes ── */}
          {PARTNER_NODES.map((node) => (
            <div
              key={node.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group eco-float"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                animationDelay: `${node.delay * 0.6}s`,
              }}
            >
              {/* Card */}
              <div className="relative w-[140px] h-[52px] md:w-[172px] md:h-[60px] rounded-xl bg-[var(--lp-bg-primary)] border border-[var(--lp-node-stroke)] flex items-center justify-center transition-all duration-400 group-hover:border-[var(--lp-accent)] group-hover:shadow-[0_0_30px_var(--lp-accent-glow)] px-4 py-2 overflow-hidden">
                {/* Subtle glass shine on top */}
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--lp-border-hover)] to-transparent" />

                <Image
                  src={node.logo}
                  alt={node.label}
                  width={200}
                  height={50}
                  className="eco-logo w-full h-full object-contain opacity-75 group-hover:opacity-100 transition-opacity duration-300"
                />
              </div>

              {/* Label on hover */}
              <span className="mt-1.5 font-jakarta text-[9px] md:text-[10px] text-[var(--lp-text-tertiary)] group-hover:text-[var(--lp-accent)] transition-colors duration-300 opacity-0 group-hover:opacity-100">
                {node.label}
              </span>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[700px] mx-auto">
          {ECOSYSTEM.stats.map((stat, i) => (
            <div key={stat.label} className="relative group">
              {/* Accent top line */}
              <div
                className="mx-auto mb-4 h-[2px] w-8 rounded-full opacity-40"
                style={{
                  background: i === 0 ? '#2DD4BF' : i === 1 ? '#818CF8' : '#06B6D4',
                }}
              />
              <div className="font-data text-3xl md:text-4xl font-semibold text-[var(--lp-text-primary)] mb-1 group-hover:text-[var(--lp-accent)] transition-colors duration-300">
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
