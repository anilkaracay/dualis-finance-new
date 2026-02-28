'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { NAV_LINKS } from '@/lib/landing-data';
import { ThemeToggle } from './shared/ThemeToggle';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center transition-all duration-300 ${
        scrolled
          ? 'backdrop-blur-xl bg-[var(--lp-nav-bg)] border-b border-[var(--lp-border)]'
          : 'bg-transparent'
      }`}
    >
      <div className="w-full max-w-[1400px] mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-jakarta font-bold text-lg">
            <span className="text-[var(--lp-accent)]">D</span>
            <span className="text-[var(--lp-text-primary)]">UALIS</span>
          </span>
          <span className="font-jakarta font-light text-xs tracking-[0.2em] text-[var(--lp-text-secondary)]">
            FINANCE
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-jakarta text-sm text-[var(--lp-text-primary)] hover:text-[var(--lp-accent)] transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <a
            href="/DUALIS_FINANCE_WHITEPAPER_v1.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="lp-btn-ghost px-4 py-2 text-sm font-jakarta !text-[var(--lp-text-primary)] inline-flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Whitepaper
          </a>
          <Link
            href="/docs"
            className="lp-btn-ghost px-4 py-2 text-sm font-jakarta !text-[var(--lp-text-primary)]"
          >
            Docs
          </Link>
          <Link
            href="/auth"
            className="lp-btn-primary px-5 py-2.5 text-sm font-jakarta inline-flex items-center gap-1"
          >
            Launch App <span className="ml-1">&rarr;</span>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2"
          aria-label="Toggle menu"
        >
          <span
            className={`block w-5 h-[1.5px] bg-[var(--lp-hamburger)] transition-transform duration-300 ${
              mobileOpen ? 'rotate-45 translate-y-[4.5px]' : ''
            }`}
          />
          <span
            className={`block w-5 h-[1.5px] bg-[var(--lp-hamburger)] transition-opacity duration-300 ${
              mobileOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block w-5 h-[1.5px] bg-[var(--lp-hamburger)] transition-transform duration-300 ${
              mobileOpen ? '-rotate-45 -translate-y-[4.5px]' : ''
            }`}
          />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 top-16 bg-[var(--lp-mobile-bg)] backdrop-blur-xl z-40 md:hidden">
          <div className="flex flex-col items-center justify-center h-full gap-8">
            {NAV_LINKS.map((link, i) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="font-jakarta text-2xl text-[var(--lp-text-primary)] opacity-0 animate-fade-in-up"
                style={{
                  animationDelay: `${i * 80}ms`,
                  animationFillMode: 'forwards',
                }}
              >
                {link.label}
              </a>
            ))}
            <a
              href="/DUALIS_FINANCE_WHITEPAPER_v1.pdf"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              className="font-jakarta text-lg text-[var(--lp-accent)] opacity-0 animate-fade-in-up inline-flex items-center gap-2"
              style={{
                animationDelay: `${NAV_LINKS.length * 80}ms`,
                animationFillMode: 'forwards',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Whitepaper
            </a>
            <ThemeToggle />
            <Link
              href="/auth"
              className="lp-btn-primary px-8 py-3 text-base font-jakarta mt-4"
              onClick={() => setMobileOpen(false)}
            >
              Launch App &rarr;
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
