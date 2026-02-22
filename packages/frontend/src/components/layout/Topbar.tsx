'use client';

import { cn } from '@/lib/utils/cn';
import { Search, Bell, Moon, Sun } from 'lucide-react';

interface TopbarProps {
  title?: string | undefined;
  onSearchClick?: (() => void) | undefined;
  onNotificationClick?: (() => void) | undefined;
  onThemeToggle?: (() => void) | undefined;
  theme?: 'dark' | 'light' | undefined;
  unreadCount?: number | undefined;
  walletSlot?: React.ReactNode | undefined;
  className?: string | undefined;
}

function Topbar({
  title,
  onSearchClick,
  onNotificationClick,
  onThemeToggle,
  theme = 'dark',
  unreadCount = 0,
  walletSlot,
  className,
}: TopbarProps) {
  return (
    <header
      className={cn(
        'flex items-center justify-between h-14 px-6 bg-bg-primary border-b border-border-subtle sticky top-0 z-50',
        className
      )}
    >
      {/* Left: Title */}
      <div className="flex items-center">
        {title && (
          <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          onClick={onSearchClick}
          className="flex items-center gap-2 h-7 px-2.5 rounded-md bg-bg-tertiary text-text-tertiary text-xs hover:text-text-secondary hover:bg-bg-hover transition-colors"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-bg-primary text-[10px] font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <button
          onClick={onNotificationClick}
          className="relative flex items-center justify-center h-7 w-7 rounded-md text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-3.5 min-w-[14px] px-0.5 rounded-full bg-negative text-[9px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onThemeToggle}
          className="flex items-center justify-center h-7 w-7 rounded-md text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors"
        >
          {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        {/* Wallet */}
        {walletSlot}
      </div>
    </header>
  );
}

export { Topbar, type TopbarProps };
