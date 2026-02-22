'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'lp-theme';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY) as 'dark' | 'light' | null;
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const landingEl = document.querySelector('.landing-page');
    if (!landingEl) return;

    if (theme === 'light') {
      landingEl.setAttribute('data-lp-theme', 'light');
    } else {
      landingEl.removeAttribute('data-lp-theme');
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, mounted]);

  const toggle = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  if (!mounted) return <div className="w-9 h-9" />;

  return (
    <button
      onClick={toggle}
      className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--lp-border-hover)] hover:border-[var(--lp-text-tertiary)] bg-[var(--lp-glass)] hover:bg-[var(--lp-glass-hover)] transition-all duration-200"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        /* Sun icon */
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--lp-text-primary)]">
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5M3.17 3.17l1.06 1.06M11.77 11.77l1.06 1.06M3.17 12.83l1.06-1.06M11.77 4.23l1.06-1.06" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ) : (
        /* Moon icon */
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--lp-text-primary)]">
          <path d="M13.36 10.36a6 6 0 01-7.72-7.72A6 6 0 1013.36 10.36z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
