'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface TOCItem {
  id: string;
  text: string;
  depth: number;
}

export function DocsTableOfContents() {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const content = document.querySelector('.docs-prose');
    if (!content) return;

    const elements = content.querySelectorAll('h2[id], h3[id]');
    const items: TOCItem[] = [];
    elements.forEach((el) => {
      items.push({
        id: el.id,
        text: el.textContent || '',
        depth: el.tagName === 'H3' ? 3 : 2,
      });
    });
    setHeadings(items);

    // Intersection Observer for scroll-spy
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );

    elements.forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  if (headings.length === 0) return null;

  return (
    <nav className="docs-toc">
      <div className="docs-toc-title">On this page</div>
      {headings.map((h) => (
        <button
          key={h.id}
          onClick={() => scrollTo(h.id)}
          className={`docs-toc-link ${h.depth === 3 ? 'depth-3' : ''} ${
            activeId === h.id ? 'active' : ''
          }`}
          style={{ cursor: 'pointer', background: 'none', border: 'none', textAlign: 'left', width: '100%' }}
        >
          {h.text}
        </button>
      ))}
    </nav>
  );
}
