'use client';

import { ECOSYSTEM } from '@/lib/landing-data';
import { SectionLabel } from './shared/SectionLabel';

export function EcosystemMap() {
  return (
    <section id="ecosystem" className="relative py-24 md:py-32 px-6 bg-[var(--lp-bg-secondary)]">
      {/* Subtle grid pattern */}
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

        {/* Network Visualization */}
        <div className="relative w-full max-w-[600px] mx-auto aspect-square mb-16">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Connection lines */}
            {ECOSYSTEM.nodes.filter(n => n.id !== 'dualis').map((node) => (
              <line
                key={`line-${node.id}`}
                x1="50" y1="50"
                x2={node.x} y2={node.y}
                stroke="rgba(45,212,191,0.15)"
                strokeWidth="0.3"
                strokeDasharray="1 2"
              >
                <animate
                  attributeName="opacity"
                  values="0.3;0.8;0.3"
                  dur="3s"
                  repeatCount="indefinite"
                  begin={`${Math.random() * 2}s`}
                />
              </line>
            ))}

            {/* Other nodes */}
            {ECOSYSTEM.nodes.filter(n => n.id !== 'dualis').map((node) => (
              <g key={node.id}>
                <circle
                  cx={node.x} cy={node.y} r={node.size === 'md' ? 4 : 3}
                  fill="var(--lp-node-fill)"
                  stroke="var(--lp-node-stroke)"
                  strokeWidth="0.5"
                />
                <text
                  x={node.x}
                  y={node.y + (node.size === 'md' ? 7 : 6)}
                  textAnchor="middle"
                  fill="var(--lp-text-tertiary)"
                  fontSize="2.5"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  {node.label}
                </text>
              </g>
            ))}

            {/* Center — DUALIS node */}
            <circle cx="50" cy="50" r="8" fill="rgba(45,212,191,0.1)" />
            <circle cx="50" cy="50" r="6" fill="var(--lp-bg-primary)" stroke="#2DD4BF" strokeWidth="0.8">
              <animate
                attributeName="r"
                values="5.5;6.5;5.5"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
            <text
              x="50" y="51.5"
              textAnchor="middle"
              fill="#2DD4BF"
              fontSize="3"
              fontWeight="700"
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              DUALIS
            </text>
          </svg>
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
