'use client';

import { METRICS } from '@/lib/landing-data';
import { CountUpNumber } from './shared/CountUpNumber';

export function MetricsBar() {
  return (
    <section className="relative w-full py-8 md:py-10 bg-[var(--lp-bg-secondary)] border-t border-b border-[var(--lp-border)]">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {METRICS.map((metric) => (
            <div key={metric.label} className="flex items-start gap-4">
              {/* Teal left border accent */}
              <div className="w-[3px] h-14 bg-[var(--lp-accent)] rounded-full shrink-0 mt-1" />
              <div className="flex flex-col gap-1">
                <CountUpNumber
                  value={metric.value}
                  prefix={metric.prefix}
                  suffix={metric.suffix}
                  className="font-semibold text-[clamp(1.75rem,4vw,3rem)] text-[var(--lp-text-primary)] leading-none"
                />
                <span className="font-jakarta text-xs uppercase tracking-widest text-[var(--lp-text-tertiary)]">
                  {metric.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
