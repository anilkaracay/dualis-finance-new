'use client';

import { useRef, useCallback, useState } from 'react';
import type { InnovationData } from '@/lib/landing-data';

const tintColors: Record<string, { primary: string; glow: string; bg: string }> = {
  teal:   { primary: '#2DD4BF', glow: 'rgba(45,212,191,0.12)', bg: 'rgba(45,212,191,0.06)' },
  amber:  { primary: '#FBBF24', glow: 'rgba(251,191,36,0.12)', bg: 'rgba(251,191,36,0.06)' },
  cyan:   { primary: '#06B6D4', glow: 'rgba(6,182,212,0.12)',  bg: 'rgba(6,182,212,0.06)' },
  indigo: { primary: '#818CF8', glow: 'rgba(129,140,248,0.12)', bg: 'rgba(129,140,248,0.06)' },
  violet: { primary: '#A78BFA', glow: 'rgba(167,139,250,0.12)', bg: 'rgba(167,139,250,0.06)' },
};

const CARD_TAGS: Record<string, string> = {
  credit: 'Credit',
  productive: 'RWA',
  seclending: 'SecLend',
  institutional: 'Dual-Track',
  privacy: 'Privacy',
};

/* ── Full-size visual panels for large cards ── */
function LargeVisual({ type, color }: { type: string; color: string }) {
  if (type === 'credit') {
    return (
      <div className="flex flex-col items-center gap-3 w-full">
        {/* Score gauge */}
        <svg width="160" height="90" viewBox="0 0 160 90" fill="none">
          <path d="M15 80 A65 65 0 0 1 145 80" stroke="var(--lp-border-medium)" strokeWidth="8" strokeLinecap="round" />
          <path d="M15 80 A65 65 0 0 1 120 22" stroke={color} strokeWidth="8" strokeLinecap="round" />
          <text x="80" y="68" textAnchor="middle" fill={color} fontSize="28" fontWeight="800" fontFamily="monospace">847</text>
          <text x="80" y="84" textAnchor="middle" fill="var(--lp-text-tertiary)" fontSize="9" fontFamily="system-ui" letterSpacing="0.1em">GOLD TIER</text>
        </svg>
        {/* Score breakdown */}
        <div className="w-full space-y-2 px-1">
          {[
            { label: 'On-chain history', pct: 92 },
            { label: 'ZK credentials', pct: 78 },
            { label: 'Ecosystem rep.', pct: 85 },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-2">
              <span className="text-[9px] font-jakarta text-[var(--lp-text-tertiary)] w-20 text-right flex-shrink-0">{row.label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-[var(--lp-border-medium)] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${row.pct}%`, background: color, opacity: 0.7 }} />
              </div>
              <span className="text-[9px] font-data w-6 text-right flex-shrink-0" style={{ color }}>{row.pct}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'productive') {
    return (
      <div className="flex flex-col gap-3 w-full">
        {/* Project card mockup */}
        <div className="rounded-lg border border-[var(--lp-border)] bg-[var(--lp-glass)] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-jakarta font-semibold text-[var(--lp-text-primary)]">Solar Konya-001</span>
            <span className="text-[8px] font-data px-1.5 py-0.5 rounded-full" style={{ color, background: `${color}15` }}>ACTIVE</span>
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-lg font-data font-bold" style={{ color }}>$2.4M</span>
            <span className="text-[9px] font-jakarta text-[var(--lp-text-tertiary)]">funded</span>
          </div>
          {/* Progress */}
          <div className="h-1.5 rounded-full bg-[var(--lp-border-medium)] overflow-hidden mb-1.5">
            <div className="h-full rounded-full" style={{ width: '72%', background: color }} />
          </div>
          <div className="flex justify-between">
            <span className="text-[8px] font-data text-[var(--lp-text-muted)]">72% deployed</span>
            <span className="text-[8px] font-data" style={{ color }}>8.5% APY</span>
          </div>
        </div>
        {/* Cash flow chart */}
        <svg width="100%" height="48" viewBox="0 0 180 48" fill="none" preserveAspectRatio="none">
          {[0, 16, 32, 48, 64, 80, 96, 112, 128, 144, 160].map((x, i) => {
            const heights = [18, 24, 20, 30, 28, 34, 32, 40, 38, 44, 36];
            const h = heights[i] ?? 18;
            return (
              <rect key={i} x={x} y={48 - h} width="12" height={h} rx="2"
                fill={i >= 7 ? color : 'var(--lp-border-medium)'}
                opacity={i >= 7 ? 0.7 : 0.3}
              />
            );
          })}
        </svg>
      </div>
    );
  }

  return null;
}

/* ── Background visuals for medium cards ── */
function MediumVisual({ type, color }: { type: string; color: string }) {
  if (type === 'seclending') {
    return (
      <svg width="160" height="80" viewBox="0 0 160 80" fill="none" className="opacity-[0.15]">
        <rect x="4" y="10" width="52" height="60" rx="8" stroke={color} strokeWidth="1.5" />
        <rect x="104" y="10" width="52" height="60" rx="8" stroke={color} strokeWidth="1.5" />
        <path d="M60 30h40M96 26l4 4-4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M100 50H60M64 54l-4-4 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'institutional') {
    return (
      <svg width="160" height="80" viewBox="0 0 160 80" fill="none" className="opacity-[0.12]">
        <rect x="4" y="4" width="70" height="28" rx="6" stroke={color} strokeWidth="1.2" />
        <rect x="86" y="4" width="70" height="28" rx="6" stroke={color} strokeWidth="1.2" />
        <path d="M40 32v12M120 32v12" stroke={color} strokeWidth="1" strokeDasharray="3 3" />
        <rect x="4" y="48" width="152" height="28" rx="6" stroke={color} strokeWidth="1.2" />
      </svg>
    );
  }
  if (type === 'privacy') {
    return (
      <svg width="120" height="100" viewBox="0 0 120 100" fill="none" className="opacity-[0.12]">
        <path d="M60 5l45 16v24c0 22-15 38-45 48C30 83 15 67 15 45V21L60 5z" stroke={color} strokeWidth="1.5" />
        <path d="M60 20l30 10v16c0 14-10 25-30 32" stroke={color} strokeWidth="1" />
        <path d="M60 20l-30 10v16c0 14 10 25 30 32" stroke={color} strokeWidth="1" opacity="0.5" />
        <circle cx="60" cy="48" r="8" stroke={color} strokeWidth="1.5" />
      </svg>
    );
  }
  return null;
}

function CardIcon({ type, color }: { type: string; color: string }) {
  const props = { width: 20, height: 20, viewBox: '0 0 20 20', fill: 'none', stroke: color, strokeWidth: '1.5', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (type) {
    case 'credit':
      return <svg {...props}><circle cx="7" cy="10" r="5" opacity="0.5" /><circle cx="10" cy="7" r="5" opacity="0.7" /><circle cx="13" cy="10" r="5" /></svg>;
    case 'productive':
      return <svg {...props}><circle cx="10" cy="12" r="5" /><path d="M10 4V2M10 2L8 4M10 2l2 2" /><path d="M5 7L3 6M15 7l2-1" /></svg>;
    case 'seclending':
      return <svg {...props}><rect x="1" y="4" width="7" height="7" rx="1.5" /><rect x="12" y="9" width="7" height="7" rx="1.5" /><path d="M8 9h4" /></svg>;
    case 'institutional':
      return <svg {...props}><path d="M10 2l9 4v1H1V6l9-4z" /><path d="M4 9v7M8 9v7M12 9v7M16 9v7" /><path d="M2 18h16" /></svg>;
    case 'privacy':
      return <svg {...props}><path d="M10 1l8 3v5c0 6-3 9-8 12-5-3-8-6-8-12V4l8-3z" /><circle cx="10" cy="9" r="2" /><path d="M10 7V6" /></svg>;
    default:
      return null;
  }
}

export function InnovationCard({ innovation }: { innovation: InnovationData }) {
  const defaultColors = { primary: '#2DD4BF', glow: 'rgba(45,212,191,0.12)', bg: 'rgba(45,212,191,0.06)' };
  const colors = tintColors[innovation.tint] ?? defaultColors;
  const isLarge = innovation.size === 'large';

  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative overflow-hidden rounded-2xl h-full transition-all duration-500 ease-out"
      style={{
        transform: isHovered ? 'translateY(-4px) scale(1.005)' : 'translateY(0) scale(1)',
        boxShadow: isHovered
          ? `0 20px 60px rgba(0,0,0,0.15), 0 0 40px ${colors.glow}`
          : '0 0 0 rgba(0,0,0,0)',
      }}
    >
      {/* ── Animated gradient border ── */}
      <div
        className="absolute inset-0 rounded-2xl innov-gradient-border opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          '--card-color': colors.primary,
          background: `conic-gradient(from var(--innov-border-angle, 0deg), transparent 40%, ${colors.primary}40 50%, ${colors.primary} 52%, ${colors.primary}40 54%, transparent 64%)`,
          padding: '1px',
        } as React.CSSProperties}
      >
        <div className="w-full h-full rounded-2xl bg-[var(--lp-bg-primary)]" />
      </div>

      {/* ── Static border (visible when not hovered) ── */}
      <div className="absolute inset-0 rounded-2xl border border-[var(--lp-border)] group-hover:border-transparent transition-[border-color] duration-500 pointer-events-none z-[1]" />

      {/* ── Card background fill ── */}
      <div className="absolute inset-[1px] rounded-2xl bg-[var(--lp-gradient-card)]" />

      {/* ── Cursor spotlight ── */}
      <div
        className="absolute pointer-events-none transition-opacity duration-300 z-[2]"
        style={{
          width: isLarge ? 500 : 380,
          height: isLarge ? 500 : 380,
          left: mousePos.x - (isLarge ? 250 : 190),
          top: mousePos.y - (isLarge ? 250 : 190),
          background: `radial-gradient(circle, ${colors.primary}08 0%, ${colors.primary}03 35%, transparent 70%)`,
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* ── Top glass shine ── */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--lp-border-hover)] to-transparent z-[3]" />

      {/* ── Hover accent top bar with sweep ── */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] z-[3] transition-all duration-500"
        style={{
          background: isHovered
            ? `linear-gradient(90deg, transparent 0%, ${colors.primary}60 20%, ${colors.primary} 50%, ${colors.primary}60 80%, transparent 100%)`
            : 'transparent',
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* ── Corner glow orb — follows mouse horizontally ── */}
      <div
        className="absolute w-64 h-64 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 z-[2]"
        style={{
          left: isHovered ? mousePos.x - 128 : -64,
          top: -96,
          background: colors.glow,
          opacity: isHovered ? 0.8 : 0,
        }}
      />

      {isLarge ? (
        /* ── Large card: two-column layout ── */
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-5 h-full">
          {/* Left — text */}
          <div className="md:col-span-3 flex flex-col justify-between p-7 md:p-8">
            <div>
              <div className="flex items-center gap-2.5 mb-5">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center border border-[var(--lp-border)] transition-all duration-500"
                  style={{
                    background: colors.bg,
                    boxShadow: isHovered ? `0 0 20px ${colors.glow}` : 'none',
                  }}
                >
                  <CardIcon type={innovation.icon} color={colors.primary} />
                </div>
                <span className="text-[10px] font-jakarta font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>
                  {CARD_TAGS[innovation.id]}
                </span>
              </div>
              <h3 className="font-display text-2xl md:text-[28px] text-[var(--lp-text-primary)] tracking-[-0.02em] mb-3">
                {innovation.title}
              </h3>
              <p className="font-jakarta text-[15px] text-[var(--lp-text-secondary)] leading-relaxed">
                {innovation.description}
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-[var(--lp-border)]">
              <span className="font-data text-[11px] tracking-wide" style={{ color: colors.primary, opacity: 0.7 }}>
                {innovation.stat}
              </span>
            </div>
          </div>

          {/* Right — visual panel */}
          <div className="md:col-span-2 flex items-center justify-center p-5 md:p-6 md:border-l border-[var(--lp-border)]">
            <LargeVisual type={innovation.icon} color={colors.primary} />
          </div>
        </div>
      ) : (
        /* ── Medium card ── */
        <div className="relative z-10 flex flex-col justify-between h-full p-6 md:p-7">
          {/* Background visual — bottom right */}
          <div className="absolute bottom-2 right-2 pointer-events-none">
            <MediumVisual type={innovation.icon} color={colors.primary} />
          </div>

          <div className="relative">
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center border border-[var(--lp-border)] transition-all duration-500"
                style={{
                  background: colors.bg,
                  boxShadow: isHovered ? `0 0 20px ${colors.glow}` : 'none',
                }}
              >
                <CardIcon type={innovation.icon} color={colors.primary} />
              </div>
              <span className="text-[10px] font-jakarta font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>
                {CARD_TAGS[innovation.id]}
              </span>
            </div>
            <h3 className="font-display text-xl md:text-2xl text-[var(--lp-text-primary)] tracking-[-0.02em] mb-2.5">
              {innovation.title}
            </h3>
            <p className="font-jakarta text-sm text-[var(--lp-text-secondary)] leading-relaxed">
              {innovation.description}
            </p>
          </div>

          <div className="relative pt-4 mt-auto border-t border-[var(--lp-border)]">
            <span className="font-data text-[11px] tracking-wide" style={{ color: colors.primary, opacity: 0.7 }}>
              {innovation.stat}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
