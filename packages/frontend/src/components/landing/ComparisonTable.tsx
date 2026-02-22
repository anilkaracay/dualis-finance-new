'use client';

import { COMPARISON } from '@/lib/landing-data';
import { SectionLabel } from './shared/SectionLabel';

export function ComparisonTable() {
  return (
    <section id="comparison" className="relative py-24 md:py-32 px-6">
      <div className="max-w-[1000px] mx-auto">
        <SectionLabel className="mb-4">{COMPARISON.label}</SectionLabel>
        <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] text-[#FAFAFA] tracking-[-0.02em] leading-[1.1] mb-12">
          {COMPARISON.title}
        </h2>

        <div className="overflow-x-auto -mx-6 px-6">
          <div className="min-w-[640px]">
            {/* Header */}
            <div className="grid grid-cols-5 gap-1 mb-2">
              {COMPARISON.headers.map((h, i) => (
                <div
                  key={h}
                  className={`px-4 py-3 font-jakarta text-xs uppercase tracking-widest ${
                    i === 4
                      ? 'text-[#2DD4BF] font-semibold'
                      : i === 0
                        ? 'text-[#71717A]'
                        : 'text-[#3F3F46]'
                  }`}
                >
                  {h}
                </div>
              ))}
            </div>

            {/* Rows */}
            {COMPARISON.rows.map((row) => (
              <div
                key={row.feature}
                className="grid grid-cols-5 gap-1 mb-1 lp-comparison-row rounded-lg"
              >
                <div className="px-4 py-3.5 font-jakarta text-sm font-medium text-[#FAFAFA]">
                  {row.feature}
                </div>
                {row.values.map((val, i) => {
                  const isDualis = i === 3;
                  const isNegative = val === '—' || val === 'None' || val === 'N/A';

                  return (
                    <div
                      key={`${row.feature}-${i}`}
                      className={`px-4 py-3.5 font-jakarta text-sm ${
                        isDualis
                          ? 'bg-[rgba(45,212,191,0.04)] rounded-lg'
                          : ''
                      }`}
                    >
                      {isDualis && !isNegative ? (
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="8" fill="rgba(45,212,191,0.2)" />
                            <path d="M5 8l2 2 4-4" stroke="#2DD4BF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="text-[#2DD4BF] font-medium">{val}</span>
                        </span>
                      ) : (
                        <span className={isNegative ? 'text-[#3F3F46]' : 'text-[#71717A]'}>
                          {val}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
