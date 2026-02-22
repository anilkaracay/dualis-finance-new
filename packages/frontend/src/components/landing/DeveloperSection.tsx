'use client';

import { DEV_SECTION } from '@/lib/landing-data';
import { SectionLabel } from './shared/SectionLabel';

/* Bullet icons — each SDK/tool gets a distinct mini-icon */
const BULLET_ICONS = [
  /* Wallet SDK */
  <svg key="w" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="12" height="9" rx="1.5" />
    <path d="M4 5V3.5A2 2 0 018 3.5V5" />
    <circle cx="11" cy="9.5" r="1" fill="currentColor" />
  </svg>,
  /* API */
  <svg key="a" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4h12M2 8h12M2 12h12" />
    <circle cx="5" cy="4" r="1" fill="currentColor" />
    <circle cx="9" cy="8" r="1" fill="currentColor" />
    <circle cx="7" cy="12" r="1" fill="currentColor" />
  </svg>,
  /* Contract/Template */
  <svg key="c" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 3l-3 5 3 5M11 3l3 5-3 5" />
    <path d="M9 2l-2 12" />
  </svg>,
  /* Institutional */
  <svg key="i" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 1l6 3v3H2V4l6-3z" />
    <path d="M4 7v5M8 7v5M12 7v5" />
    <path d="M2 12h12v2H2z" />
  </svg>,
];

function highlightCode(code: string): string {
  return code
    .replace(/\/\/.*/g, (m) => `<span class="comment">${m}</span>`)
    .replace(/'[^']*'/g, (m) => `<span class="string">${m}</span>`)
    .replace(/\b(import|from|const|await|new)\b/g, '<span class="keyword">$1</span>')
    .replace(/\b(console)\b/g, '<span class="function">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>');
}

function addLineNumbers(code: string): string {
  return code
    .split('\n')
    .map((line, i) => {
      const num = `<span class="line-num">${String(i + 1).padStart(2, ' ')}</span>`;
      return `${num}  ${line}`;
    })
    .join('\n');
}

export function DeveloperSection() {
  const highlighted = addLineNumbers(highlightCode(DEV_SECTION.code));

  return (
    <section id="developers" className="relative py-24 md:py-32 px-6 bg-[var(--lp-bg-secondary)]">
      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--lp-dot-subtle) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left */}
        <div>
          <SectionLabel className="mb-4">{DEV_SECTION.label}</SectionLabel>
          <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] text-[var(--lp-text-primary)] tracking-[-0.02em] leading-[1.1] mb-4">
            {DEV_SECTION.title}
          </h2>
          <p className="font-jakarta text-[var(--lp-text-secondary)] text-base leading-relaxed mb-8">
            {DEV_SECTION.subtitle}
          </p>

          {/* SDK/Tool cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {DEV_SECTION.bullets.map((b, i) => (
              <div
                key={b}
                className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--lp-border)] bg-[var(--lp-gradient-card)] hover:border-[var(--lp-border-hover)] transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--lp-bg-secondary)] border border-[var(--lp-border)] flex items-center justify-center text-[var(--lp-accent)] flex-shrink-0 group-hover:border-[var(--lp-accent)] group-hover:shadow-[0_0_12px_var(--lp-accent-glow)] transition-all duration-300">
                  {BULLET_ICONS[i]}
                </div>
                <span className="font-jakarta text-sm font-medium text-[var(--lp-text-primary)]">{b}</span>
              </div>
            ))}
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-6 pt-2">
            {[
              { value: 'TypeScript', label: 'First-class' },
              { value: '<50ms', label: 'Avg latency' },
              { value: '99.9%', label: 'Uptime SLA' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-data text-sm font-semibold text-[var(--lp-accent)]">{stat.value}</div>
                <div className="font-jakarta text-[10px] text-[var(--lp-text-tertiary)] uppercase tracking-wider mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Code Block */}
        <div className="relative">
          {/* Glow behind */}
          <div className="absolute -inset-4 rounded-3xl bg-[radial-gradient(ellipse,var(--lp-accent-subtle)_0%,transparent_70%)] opacity-40 pointer-events-none" />

          <div className="relative rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-code-bg)] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)]">
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--lp-border)] bg-[rgba(255,255,255,0.02)]">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
              </div>

              {/* Tab bar */}
              <div className="flex items-center gap-0.5">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-t-md bg-[var(--lp-code-bg)] border border-[var(--lp-border)] border-b-0 -mb-[1px] relative z-10">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1L1 6l5 5M11 1L6 6l5 5" stroke="#3178C6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="font-mono text-[10px] text-[var(--lp-text-secondary)]">example.ts</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-t-md">
                  <span className="font-mono text-[10px] text-[var(--lp-text-muted)]">types.d.ts</span>
                </div>
              </div>

              <button className="font-jakarta text-[10px] text-[var(--lp-text-tertiary)] hover:text-[var(--lp-accent)] transition-colors px-2 py-1 rounded border border-[var(--lp-border)] hover:border-[var(--lp-accent)] flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                  <rect x="3" y="1" width="6" height="6" rx="1" />
                  <path d="M1 3v5a1 1 0 001 1h5" />
                </svg>
                Copy
              </button>
            </div>

            {/* Code with line numbers */}
            <div className="p-5 overflow-x-auto">
              <pre className="lp-code font-mono text-[13px] leading-[1.7] text-[var(--lp-text-secondary)]">
                <code dangerouslySetInnerHTML={{ __html: highlighted }} />
              </pre>
            </div>

            {/* Bottom status bar */}
            <div className="flex items-center justify-between px-4 py-1.5 border-t border-[var(--lp-border)] bg-[rgba(255,255,255,0.02)]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#28C840]" />
                  <span className="font-mono text-[9px] text-[var(--lp-text-muted)]">TypeScript</span>
                </span>
                <span className="font-mono text-[9px] text-[var(--lp-text-muted)]">UTF-8</span>
              </div>
              <span className="font-mono text-[9px] text-[var(--lp-text-muted)]">Ln 1, Col 1</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
