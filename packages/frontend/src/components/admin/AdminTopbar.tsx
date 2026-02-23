'use client';

import { Bell, Search } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { AdminBreadcrumb } from './AdminBreadcrumb';

interface AdminTopbarProps {
  onSearchClick: () => void;
  alertCount?: number;
}

export function AdminTopbar({ onSearchClick, alertCount = 0 }: AdminTopbarProps) {
  return (
    <header className="flex items-center h-16 border-b border-border-default bg-bg-primary px-4 md:px-6 shrink-0">
      {/* Breadcrumb */}
      <div className="flex-1 min-w-0">
        <AdminBreadcrumb />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          onClick={onSearchClick}
          className="flex items-center gap-2 h-8 px-3 rounded-md bg-bg-tertiary border border-border-default text-text-tertiary hover:text-text-secondary hover:border-border-hover transition-colors text-xs"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Search</span>
          <kbd className="hidden md:inline ml-2 text-[10px] font-mono text-text-disabled">⌘K</kbd>
        </button>

        {/* Alert bell */}
        <button
          className={cn(
            'relative h-8 w-8 rounded-md flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors',
          )}
        >
          <Bell className="h-4 w-4" />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-negative text-white text-[10px] font-bold flex items-center justify-center">
              {alertCount > 99 ? '99+' : alertCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
