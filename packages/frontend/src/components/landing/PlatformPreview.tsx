'use client';

import Link from 'next/link';
import { SectionLabel } from './shared/SectionLabel';

/* ── Static mock data for the dashboard preview ── */
const KPI_DATA = [
  { label: 'Net Worth', value: '$1,570,368', change: '+3.2%', positive: true, color: '#2DD4BF' },
  { label: 'Total Supplied', value: '$1,570,368', change: '+2.8%', positive: true, color: '#818CF8' },
  { label: 'Health Factor', value: '1.67', change: '', positive: true, color: '#FBBF24' },
  { label: 'Total Borrowed', value: '$206,234', change: '-1.4%', positive: false, color: '#F87171' },
];

const POSITIONS = [
  { asset: 'USDC', type: 'Stablecoin', deposited: '$512,345', apy: '8.24%', color: '#2775CA' },
  { asset: 'T-BILL-2026', type: 'Treasury', deposited: '$1,023,456', apy: '5.12%', color: '#10B981' },
  { asset: 'ETH', type: 'Crypto', deposited: '$34,567', apy: '3.56%', color: '#627EEA' },
];

/* Mini sparkline points for KPI cards */
const SPARKLINES: Record<number, string> = {
  0: 'M0,8 L3,7 L6,7.5 L9,6 L12,5 L15,4.5 L18,3 L21,2',
  1: 'M0,7 L3,6.5 L6,7 L9,5.5 L12,4 L15,3.5 L18,3 L21,2.5',
  2: 'M0,5 L3,4.5 L6,5 L9,4.8 L12,5 L15,4.5 L18,5 L21,4.5',
  3: 'M0,3 L3,4 L6,3.5 L9,5 L12,5.5 L15,6 L18,5.8 L21,6.5',
};

export function PlatformPreview() {
  const bullets = [
    'Real-time market data and portfolio analytics',
    'Composite credit score dashboard',
    'Productive lending project management',
  ];

  return (
    <section className="relative py-24 md:py-32 px-6 overflow-hidden">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
        {/* Left */}
        <div className="lg:col-span-2">
          <SectionLabel className="mb-4">THE PLATFORM</SectionLabel>
          <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] text-[var(--lp-text-primary)] tracking-[-0.02em] leading-[1.1] mb-4">
            Professional-Grade Interface
          </h2>
          <p className="font-jakarta text-[var(--lp-text-secondary)] text-base leading-relaxed mb-8">
            Built for traders and institutions who demand precision. Real-time data, advanced charting, and one-click execution.
          </p>
          <ul className="space-y-3 mb-8">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="10" fill="var(--lp-accent-glow)" />
                  <path d="M6 10l3 3 5-6" stroke="#2DD4BF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-jakarta text-sm text-[var(--lp-text-secondary)]">{b}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/overview"
            className="font-jakarta text-sm font-semibold text-[var(--lp-accent)] hover:text-[var(--lp-accent-dim)] transition-colors inline-flex items-center gap-1"
          >
            Explore Dashboard <span>&rarr;</span>
          </Link>
        </div>

        {/* Right — Browser Mockup */}
        <div className="lg:col-span-3 relative">
          {/* Glow behind */}
          <div className="absolute inset-0 -z-10 flex items-center justify-center">
            <div className="w-[80%] h-[80%] rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.08)_0%,transparent_60%)]" />
          </div>

          <div
            className="rounded-2xl overflow-hidden border border-[var(--lp-border)] bg-[var(--lp-bg-tertiary)] shadow-[0_60px_120px_-20px_rgba(0,0,0,0.5)]"
            style={{
              transform: 'perspective(1200px) rotateY(-8deg) rotateX(4deg)',
            }}
          >
            {/* Title Bar */}
            <div className="h-10 bg-[var(--lp-bg-secondary)] flex items-center px-4 gap-2 border-b border-[var(--lp-border)]">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
              </div>
              <div className="flex-1 text-center">
                <span className="font-mono text-[10px] text-[var(--lp-text-tertiary)]">app.dualis.finance</span>
              </div>
              <div className="w-12" />
            </div>

            {/* ── Dashboard Content ── */}
            <div className="bg-[var(--lp-bg-primary)] p-3 md:p-5 space-y-3">

              {/* KPI Row */}
              <div className="grid grid-cols-4 gap-2">
                {KPI_DATA.map((kpi, i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-[var(--lp-bg-secondary)] p-2.5 border border-[var(--lp-border)] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[8px] md:text-[9px] font-jakarta font-medium uppercase tracking-wider text-[var(--lp-text-tertiary)]">
                        {kpi.label}
                      </span>
                      {/* Mini sparkline */}
                      <svg width="24" height="10" viewBox="0 0 24 10" className="opacity-60">
                        <path
                          d={SPARKLINES[i]}
                          stroke={kpi.color}
                          strokeWidth="1.2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[11px] md:text-sm font-jakarta font-bold text-[var(--lp-text-primary)] tabular-nums">
                        {kpi.value}
                      </span>
                      {kpi.change && (
                        <span
                          className={`text-[7px] md:text-[8px] font-jakarta font-semibold tabular-nums ${
                            kpi.positive ? 'text-[#10B981]' : 'text-[#F87171]'
                          }`}
                        >
                          {kpi.change}
                        </span>
                      )}
                    </div>
                    {/* Accent bar */}
                    <div className="mt-1.5 h-[2px] w-6 rounded-full" style={{ background: kpi.color, opacity: 0.6 }} />
                  </div>
                ))}
              </div>

              {/* Chart + Portfolio Split */}
              <div className="grid grid-cols-3 gap-2">
                {/* Chart Area */}
                <div className="col-span-2 rounded-lg bg-[var(--lp-bg-secondary)] p-3 border border-[var(--lp-border)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] md:text-[10px] font-jakarta font-semibold text-[var(--lp-text-primary)]">
                      Portfolio Value
                    </span>
                    <div className="flex gap-1.5">
                      {['1D', '1W', '1M'].map((period, i) => (
                        <span
                          key={period}
                          className={`text-[7px] md:text-[8px] font-jakarta px-1.5 py-0.5 rounded ${
                            i === 2
                              ? 'bg-[var(--lp-accent-subtle)] text-[var(--lp-accent)] font-semibold'
                              : 'text-[var(--lp-text-tertiary)]'
                          }`}
                        >
                          {period}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="h-20 md:h-28 relative overflow-hidden rounded">
                    <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="prevChartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {/* Grid lines */}
                      {[30, 60, 90].map((y) => (
                        <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="var(--lp-border)" strokeWidth="0.5" />
                      ))}
                      {/* Y-axis labels */}
                      <text x="4" y="28" fill="var(--lp-text-muted)" fontSize="7" fontFamily="monospace">$1.6M</text>
                      <text x="4" y="58" fill="var(--lp-text-muted)" fontSize="7" fontFamily="monospace">$1.4M</text>
                      <text x="4" y="88" fill="var(--lp-text-muted)" fontSize="7" fontFamily="monospace">$1.2M</text>
                      {/* Area fill */}
                      <path
                        d="M0,110 C20,105 40,100 60,95 C80,90 100,92 120,85 C140,78 160,75 180,70 C200,65 220,60 240,55 C260,48 280,45 300,38 C320,32 340,28 360,22 C380,18 400,15 400,15 V120 H0 Z"
                        fill="url(#prevChartGrad)"
                      />
                      {/* Line */}
                      <path
                        d="M0,110 C20,105 40,100 60,95 C80,90 100,92 120,85 C140,78 160,75 180,70 C200,65 220,60 240,55 C260,48 280,45 300,38 C320,32 340,28 360,22 C380,18 400,15 400,15"
                        stroke="#2DD4BF"
                        strokeWidth="2"
                        fill="none"
                      />
                      {/* Dot at end */}
                      <circle cx="400" cy="15" r="3" fill="#2DD4BF" />
                      <circle cx="400" cy="15" r="6" fill="#2DD4BF" opacity="0.2" />
                    </svg>
                  </div>
                </div>

                {/* Portfolio Composition (mini donut) */}
                <div className="rounded-lg bg-[var(--lp-bg-secondary)] p-3 border border-[var(--lp-border)] flex flex-col">
                  <span className="text-[9px] md:text-[10px] font-jakarta font-semibold text-[var(--lp-text-primary)] mb-2">
                    Allocation
                  </span>
                  <div className="flex-1 flex items-center justify-center">
                    <svg width="64" height="64" viewBox="0 0 64 64" className="md:w-[76px] md:h-[76px]">
                      <circle cx="32" cy="32" r="24" fill="none" stroke="#10B981" strokeWidth="7" strokeDasharray="98 52" strokeDashoffset="0" transform="rotate(-90 32 32)" />
                      <circle cx="32" cy="32" r="24" fill="none" stroke="#2775CA" strokeWidth="7" strokeDasharray="49 101" strokeDashoffset="-98" transform="rotate(-90 32 32)" />
                      <circle cx="32" cy="32" r="24" fill="none" stroke="#627EEA" strokeWidth="7" strokeDasharray="3.3 146.7" strokeDashoffset="-147" transform="rotate(-90 32 32)" />
                      <text x="32" y="30" textAnchor="middle" fill="var(--lp-text-primary)" fontSize="7" fontWeight="700" fontFamily="system-ui">$1.57M</text>
                      <text x="32" y="38" textAnchor="middle" fill="var(--lp-text-tertiary)" fontSize="5" fontFamily="system-ui">Total</text>
                    </svg>
                  </div>
                  <div className="space-y-1 mt-2">
                    {[
                      { label: 'T-BILL', pct: '65.1%', color: '#10B981' },
                      { label: 'USDC', pct: '32.6%', color: '#2775CA' },
                      { label: 'ETH', pct: '2.2%', color: '#627EEA' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                        <span className="text-[7px] md:text-[8px] font-jakarta text-[var(--lp-text-secondary)] flex-1">{item.label}</span>
                        <span className="text-[7px] md:text-[8px] font-jakarta font-semibold text-[var(--lp-text-primary)] tabular-nums">{item.pct}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Positions Table */}
              <div className="rounded-lg bg-[var(--lp-bg-secondary)] border border-[var(--lp-border)] overflow-hidden">
                {/* Table tabs */}
                <div className="flex items-center gap-4 px-3 pt-2.5 pb-0 border-b border-[var(--lp-border)]">
                  {['Supply', 'Borrow', 'SecLend'].map((tab, i) => (
                    <span
                      key={tab}
                      className={`text-[8px] md:text-[9px] font-jakarta font-semibold pb-2 ${
                        i === 0
                          ? 'text-[var(--lp-accent)] border-b-2 border-[var(--lp-accent)]'
                          : 'text-[var(--lp-text-tertiary)]'
                      }`}
                    >
                      {tab}
                    </span>
                  ))}
                  <div className="flex-1" />
                  <span className="text-[7px] font-jakarta text-[var(--lp-text-muted)] pb-2">
                    Credit Tier: <span className="text-[#FBBF24] font-semibold">Gold</span>
                  </span>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 px-3 py-1.5 text-[7px] md:text-[8px] font-jakarta font-medium text-[var(--lp-text-tertiary)] uppercase tracking-wider">
                  <span className="col-span-3">Asset</span>
                  <span className="col-span-2">Type</span>
                  <span className="col-span-3 text-right">Deposited</span>
                  <span className="col-span-2 text-right">APY</span>
                  <span className="col-span-2 text-right">Status</span>
                </div>

                {/* Table Rows */}
                {POSITIONS.map((pos, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-12 gap-2 px-3 py-2 items-center border-t border-[var(--lp-border)] hover:bg-[var(--lp-glass)] transition-colors"
                  >
                    <div className="col-span-3 flex items-center gap-1.5">
                      <div
                        className="w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-[6px] md:text-[7px] font-bold text-white flex-shrink-0"
                        style={{ background: pos.color }}
                      >
                        {pos.asset[0]}
                      </div>
                      <span className="text-[9px] md:text-[10px] font-jakarta font-semibold text-[var(--lp-text-primary)]">
                        {pos.asset}
                      </span>
                    </div>
                    <span className="col-span-2 text-[8px] md:text-[9px] font-jakarta text-[var(--lp-text-tertiary)]">
                      {pos.type}
                    </span>
                    <span className="col-span-3 text-right text-[9px] md:text-[10px] font-jakarta font-semibold text-[var(--lp-text-primary)] tabular-nums">
                      {pos.deposited}
                    </span>
                    <span className="col-span-2 text-right text-[9px] md:text-[10px] font-jakarta font-bold text-[#10B981] tabular-nums">
                      {pos.apy}
                    </span>
                    <div className="col-span-2 flex justify-end">
                      <span className="text-[7px] md:text-[8px] font-jakarta font-semibold px-2 py-0.5 rounded-full bg-[rgba(16,185,129,0.1)] text-[#10B981]">
                        Active
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
