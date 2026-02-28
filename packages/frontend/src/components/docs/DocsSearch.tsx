'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DOCS_NAV, type NavSection } from '@/lib/docs/navigation';

interface SearchResult {
  title: string;
  href: string;
  section: string;
  icon: string;
}

function buildIndex(): SearchResult[] {
  return DOCS_NAV.flatMap((section: NavSection) =>
    section.items.map((item) => ({
      title: item.title,
      href: item.href,
      section: section.label,
      icon: section.icon,
    }))
  );
}

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  // char-by-char fuzzy
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

function scoreMatch(query: string, result: SearchResult): number {
  const q = query.toLowerCase();
  const title = result.title.toLowerCase();
  const section = result.section.toLowerCase();
  if (title === q) return 100;
  if (title.startsWith(q)) return 80;
  if (title.includes(q)) return 60;
  if (section.includes(q)) return 40;
  return 20; // fuzzy match
}

interface DocsSearchProps {
  open: boolean;
  onClose: () => void;
}

export function DocsSearch({ open, onClose }: DocsSearchProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const index = useMemo(() => buildIndex(), []);

  const results = useMemo(() => {
    if (!query.trim()) return index;
    return index
      .filter(
        (r) =>
          fuzzyMatch(query, r.title) ||
          fuzzyMatch(query, r.section) ||
          fuzzyMatch(query, r.href)
      )
      .sort((a, b) => scoreMatch(query, b) - scoreMatch(query, a));
  }, [query, index]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Scroll active item into view
  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const active = container.children[activeIndex] as HTMLElement | undefined;
    if (active) {
      active.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const navigate = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((i) => Math.min(i + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[activeIndex]) {
            navigate(results[activeIndex].href);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [results, activeIndex, navigate, onClose]
  );

  // Global Cmd/Ctrl+K
  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
      }
    }
    document.addEventListener('keydown', handleGlobalKey);
    return () => document.removeEventListener('keydown', handleGlobalKey);
  }, []);

  if (!open) return null;

  // Group results by section
  const grouped: { section: string; icon: string; items: SearchResult[] }[] = [];
  const sectionMap = new Map<string, SearchResult[]>();
  for (const r of results) {
    const existing = sectionMap.get(r.section);
    if (existing) {
      existing.push(r);
    } else {
      sectionMap.set(r.section, [r]);
    }
  }
  for (const [section, items] of sectionMap) {
    grouped.push({ section, icon: items[0]?.icon ?? '', items });
  }

  let flatIndex = 0;

  return (
    <>
      {/* Backdrop */}
      <div className="docs-search-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="docs-search-modal" onKeyDown={handleKeyDown}>
        {/* Input */}
        <div className="docs-search-input-wrapper">
          <svg
            width="18"
            height="18"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="docs-search-input-icon"
          >
            <circle cx="7" cy="7" r="5.5" />
            <path d="M11 11l3.5 3.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search documentation..."
            className="docs-search-input"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <kbd className="docs-search-esc">ESC</kbd>
        </div>

        {/* Results */}
        <div className="docs-search-results" ref={listRef}>
          {results.length === 0 ? (
            <div className="docs-search-empty">
              <p>No results found for &ldquo;{query}&rdquo;</p>
              <p className="docs-search-empty-hint">Try a different search term</p>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.section} className="docs-search-group">
                <div className="docs-search-group-label">
                  <span>{group.icon}</span> {group.section}
                </div>
                {group.items.map((item) => {
                  const idx = flatIndex++;
                  return (
                    <button
                      key={item.href}
                      className={`docs-search-item ${idx === activeIndex ? 'active' : ''}`}
                      onClick={() => navigate(item.href)}
                      onMouseEnter={() => setActiveIndex(idx)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="docs-search-item-icon"
                      >
                        <path d="M4 2h6l4 4v8a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" />
                        <path d="M10 2v4h4" />
                      </svg>
                      <span className="docs-search-item-title">{item.title}</span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="docs-search-item-arrow"
                      >
                        <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="docs-search-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </>
  );
}
