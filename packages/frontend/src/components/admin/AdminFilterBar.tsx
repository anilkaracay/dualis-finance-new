'use client';

import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterDropdown {
  key: string;
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

interface AdminFilterBarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterDropdown[];
  dateRange?: {
    from: string;
    to: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
  };
  actions?: React.ReactNode;
  className?: string;
}

export function AdminFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
  dateRange,
  actions,
  className,
}: AdminFilterBarProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2 mb-4', className)}>
      {/* Search */}
      {onSearchChange && (
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
          <input
            type="text"
            value={search ?? ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-8 pl-8 pr-8 rounded-md bg-surface-input border border-border-default text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none transition-colors"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Filter dropdowns */}
      {filters?.map((filter) => (
        <select
          key={filter.key}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          className="h-8 px-2 rounded-md bg-surface-input border border-border-default text-sm text-text-primary focus:border-border-focus focus:outline-none transition-colors appearance-none cursor-pointer"
        >
          <option value="">{filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ))}

      {/* Date range */}
      {dateRange && (
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => dateRange.onFromChange(e.target.value)}
            className="h-8 px-2 rounded-md bg-surface-input border border-border-default text-xs text-text-primary focus:border-border-focus focus:outline-none"
          />
          <span className="text-xs text-text-tertiary">to</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => dateRange.onToChange(e.target.value)}
            className="h-8 px-2 rounded-md bg-surface-input border border-border-default text-xs text-text-primary focus:border-border-focus focus:outline-none"
          />
        </div>
      )}

      {/* Action buttons */}
      {actions && <div className="flex items-center gap-2 ml-auto">{actions}</div>}
    </div>
  );
}
