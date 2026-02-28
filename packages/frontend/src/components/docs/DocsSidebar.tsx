'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DOCS_NAV } from '@/lib/docs/navigation';

interface DocsSidebarProps {
  open?: boolean;
  onClose?: () => void;
  onSearchOpen?: () => void;
}

export function DocsSidebar({ open, onClose, onSearchOpen }: DocsSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`docs-sidebar-overlay ${open ? 'open' : ''}`}
        {...(onClose ? { onClick: onClose } : {})}
      />

      <aside className={`docs-sidebar ${open ? 'open' : ''}`}>
        {/* Search trigger */}
        <button
          className="docs-search-trigger"
          onClick={onSearchOpen}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="7" r="5.5" />
            <path d="M11 11l3.5 3.5" strokeLinecap="round" />
          </svg>
          Search docs...
          <span className="docs-search-kbd">⌘K</span>
        </button>

        {/* Navigation sections */}
        {DOCS_NAV.map((section) => (
          <div key={section.label} className="docs-nav-section">
            <div className="docs-nav-label">
              <span>{section.icon}</span>
              {section.label}
            </div>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`docs-nav-link ${pathname === item.href ? 'active' : ''}`}
                {...(onClose ? { onClick: onClose } : {})}
              >
                {item.title}
              </Link>
            ))}
          </div>
        ))}
      </aside>
    </>
  );
}
