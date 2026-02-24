'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { Search, Bell, Moon, Sun, Monitor } from 'lucide-react';
import type { ThemePreference } from '@/stores/useUIStore';

interface TopbarProps {
  title?: string | undefined;
  onSearchClick?: (() => void) | undefined;
  onNotificationClick?: (() => void) | undefined;
  onThemeCycle?: (() => void) | undefined;
  themePreference?: ThemePreference | undefined;
  unreadCount?: number | undefined;
  walletSlot?: React.ReactNode | undefined;
  className?: string | undefined;
}

const THEME_ICONS: Record<ThemePreference, React.ElementType> = {
  dark: Moon,
  light: Sun,
  system: Monitor,
};

const PAGE_NAMES: Record<string, string> = {
  overview: 'Dashboard',
  markets: 'Markets',
  borrow: 'Borrow',
  'sec-lending': 'Securities Lending',
  credit: 'Credit',
  governance: 'Governance',
  staking: 'Staking',
  portfolio: 'Portfolio',
  settings: 'Settings',
  productive: 'Productive',
  institutional: 'Institutional',
  privacy: 'Privacy',
  attestations: 'Attestations',
  netting: 'Netting',
};

function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      {segments.map((segment, index) => {
        const href = '/' + segments.slice(0, index + 1).join('/');
        const isLast = index === segments.length - 1;
        const label =
          PAGE_NAMES[segment] ??
          segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

        return (
          <span key={href} className="flex items-center gap-1.5">
            {index > 0 && <span className="text-text-disabled">/</span>}
            {isLast ? (
              <span className="text-text-primary font-medium">{label}</span>
            ) : (
              <Link
                href={href}
                className="text-text-tertiary hover:text-text-secondary transition-colors duration-150"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

function Topbar({
  onSearchClick,
  onNotificationClick,
  onThemeCycle,
  themePreference = 'dark',
  unreadCount = 0,
  walletSlot,
  className,
}: TopbarProps) {
  const ThemeIcon = THEME_ICONS[themePreference];

  return (
    <header
      className={cn(
        'flex items-center justify-between h-14 px-6 bg-bg-secondary/90 backdrop-blur-xl border-b border-border-subtle sticky top-0 z-50',
        className
      )}
    >
      {/* Left: Breadcrumbs */}
      <div className="flex items-center min-w-0">
        <Breadcrumbs />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Network selector */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-positive/[0.06] border border-positive/15 text-xs text-positive/80">
          <span className="h-1.5 w-1.5 rounded-full bg-positive animate-pulse shrink-0" />
          <span>Canton Mainnet</span>
        </div>

        {/* Search */}
        <button
          onClick={onSearchClick}
          className="flex items-center gap-2 h-9 px-3.5 rounded-lg bg-bg-tertiary/60 border border-border-subtle text-text-tertiary text-xs hover:text-text-secondary hover:bg-bg-hover hover:border-border-default transition-all duration-200"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-bg-primary/40 border border-border-subtle/60 text-[10px] font-mono text-text-disabled">
            ⌘K
          </kbd>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onThemeCycle}
          title={`Theme: ${themePreference}`}
          className="flex items-center justify-center h-9 w-9 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-hover/80 active:scale-95 transition-all duration-150"
        >
          <ThemeIcon className="h-4 w-4" />
        </button>

        {/* Notifications */}
        <button
          onClick={onNotificationClick}
          className="relative flex items-center justify-center h-9 w-9 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-hover/80 active:scale-95 transition-all duration-150"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center h-[18px] min-w-[18px] px-1 rounded-full bg-negative text-[9px] font-bold text-white shadow-glow-danger ring-2 ring-bg-secondary">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Wallet */}
        {walletSlot}
      </div>
    </header>
  );
}

export { Topbar, type TopbarProps };
