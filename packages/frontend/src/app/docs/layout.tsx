'use client';

import { useState, useEffect, useCallback } from 'react';
import { DocsSidebar } from '@/components/docs/DocsSidebar';
import { DocsTableOfContents } from '@/components/docs/DocsTableOfContents';
import { DocsPagination } from '@/components/docs/DocsPagination';
import { DocsThemeToggle } from '@/components/docs/DocsThemeToggle';
import { DocsSearch } from '@/components/docs/DocsSearch';
import Link from 'next/link';
import '@/styles/docs.css';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  // Global Cmd/Ctrl+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="docs-page">
      {/* ─── Search Modal ─── */}
      <DocsSearch open={searchOpen} onClose={closeSearch} />

      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center backdrop-blur-xl bg-[var(--docs-nav-bg)] border-b border-[var(--docs-nav-border)]">
        <div className="w-full max-w-[1400px] mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="font-jakarta font-bold text-lg">
              <span className="text-[var(--docs-accent)]">D</span>
              <span className="text-[var(--docs-text)]">UALIS</span>
            </span>
            <span className="font-jakarta font-light text-xs tracking-[0.2em] text-[var(--docs-text-secondary)]">
              FINANCE
            </span>
          </Link>

          {/* Center: Docs label */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/docs"
              className="font-jakarta text-sm font-medium text-[var(--docs-accent)] border-b-2 border-[var(--docs-accent)] pb-0.5"
            >
              Documentation
            </Link>
            <a
              href="https://github.com/cayvox/dualis-finance"
              target="_blank"
              rel="noopener noreferrer"
              className="font-jakarta text-sm text-[var(--docs-text-secondary)] hover:text-[var(--docs-text)] transition-colors"
            >
              GitHub
            </a>
          </div>

          {/* Right: Theme + Launch App */}
          <div className="hidden md:flex items-center gap-3">
            <DocsThemeToggle />
            <Link
              href="/auth"
              className="px-5 py-2 text-sm font-jakarta font-medium rounded-full bg-[var(--docs-accent)] text-[#09090B] hover:opacity-90 transition-opacity"
            >
              Launch App
            </Link>
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <DocsThemeToggle />
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex flex-col gap-1.5 p-2"
              aria-label="Toggle sidebar"
            >
              <span className={`block w-5 h-[1.5px] bg-[var(--docs-text)] transition-transform duration-300 ${sidebarOpen ? 'rotate-45 translate-y-[4.5px]' : ''}`} />
              <span className={`block w-5 h-[1.5px] bg-[var(--docs-text)] transition-opacity duration-300 ${sidebarOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-[1.5px] bg-[var(--docs-text)] transition-transform duration-300 ${sidebarOpen ? '-rotate-45 -translate-y-[4.5px]' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Body ─── */}
      <div className="docs-layout">
        <DocsSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSearchOpen={openSearch} />

        <main className="docs-main">
          <div className="docs-content">
            <article className="docs-prose">
              {children}
            </article>
            <DocsPagination />
          </div>
          <DocsTableOfContents />
        </main>
      </div>
    </div>
  );
}
