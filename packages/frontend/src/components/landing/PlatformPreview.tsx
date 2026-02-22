'use client';

import Link from 'next/link';
import { SectionLabel } from './shared/SectionLabel';

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
          <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] text-[#FAFAFA] tracking-[-0.02em] leading-[1.1] mb-4">
            Professional-Grade Interface
          </h2>
          <p className="font-jakarta text-[#A1A1AA] text-base leading-relaxed mb-8">
            Built for traders and institutions who demand precision. Real-time data, advanced charting, and one-click execution.
          </p>
          <ul className="space-y-3 mb-8">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="10" fill="rgba(45,212,191,0.15)" />
                  <path d="M6 10l3 3 5-6" stroke="#2DD4BF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-jakarta text-sm text-[#A1A1AA]">{b}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/overview"
            className="font-jakarta text-sm font-semibold text-[#2DD4BF] hover:text-[#14B8A6] transition-colors inline-flex items-center gap-1"
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
            className="rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.06)] bg-[#18181B] shadow-[0_60px_120px_-20px_rgba(0,0,0,0.5)]"
            style={{
              transform: 'perspective(1200px) rotateY(-8deg) rotateX(4deg)',
            }}
          >
            {/* Title Bar */}
            <div className="h-10 bg-[#0F0F12] flex items-center px-4 gap-2 border-b border-[rgba(255,255,255,0.06)]">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
              </div>
              <div className="flex-1 text-center">
                <span className="font-mono text-[10px] text-[#71717A]">app.dualis.finance</span>
              </div>
              <div className="w-12" />
            </div>

            {/* Dashboard Content Mockup */}
            <div className="aspect-video bg-[#09090B] p-4 md:p-6">
              {/* KPI Row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {['#2DD4BF', '#818CF8', '#FBBF24'].map((color, i) => (
                  <div key={i} className="rounded-lg bg-[#0F0F12] p-3 border border-[rgba(255,255,255,0.04)]">
                    <div className="h-1 w-8 rounded mb-2" style={{ background: color }} />
                    <div className="h-2 w-16 rounded bg-[rgba(255,255,255,0.08)] mb-1" />
                    <div className="h-3 w-12 rounded bg-[rgba(255,255,255,0.12)]" />
                  </div>
                ))}
              </div>

              {/* Chart Area */}
              <div className="rounded-lg bg-[#0F0F12] p-3 mb-4 border border-[rgba(255,255,255,0.04)]">
                <div className="h-2 w-20 rounded bg-[rgba(255,255,255,0.08)] mb-3" />
                <div className="h-24 md:h-32 relative overflow-hidden rounded">
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(45,212,191,0.1)] to-transparent" />
                  <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="platformChartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2DD4BF" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 100 Q50 80 100 70 T200 50 T300 30 T400 20"
                      stroke="rgba(45,212,191,0.3)"
                      strokeWidth="2"
                      fill="none"
                    />
                    <path
                      d="M0 100 Q50 80 100 70 T200 50 T300 30 T400 20 V120 H0 Z"
                      fill="url(#platformChartGrad)"
                      opacity="0.2"
                    />
                  </svg>
                </div>
              </div>

              {/* Table Rows */}
              <div className="space-y-1.5">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="flex gap-4 items-center h-6 px-3 rounded bg-[#0F0F12]">
                    <div className="h-1.5 w-12 rounded bg-[rgba(255,255,255,0.06)]" />
                    <div className="h-1.5 w-20 rounded bg-[rgba(255,255,255,0.04)]" />
                    <div className="flex-1" />
                    <div className="h-1.5 w-8 rounded bg-[rgba(45,212,191,0.15)]" />
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
