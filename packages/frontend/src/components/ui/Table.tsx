'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Skeleton } from './Skeleton';

/* ─── Types ─── */

type SortDirection = 'asc' | 'desc' | null;

interface Column<T> {
  /** Unique column key */
  key: string;
  /** Column header text */
  header: string;
  /** Cell render function */
  cell: (row: T, index: number) => React.ReactNode;
  /** Column is sortable */
  sortable?: boolean;
  /** Column is numeric (right-aligned, mono font) */
  numeric?: boolean;
  /** Column width */
  width?: string;
  /** Custom header class */
  headerClassName?: string;
  /** Custom cell class */
  cellClassName?: string;
}

interface TableProps<T> {
  /** Column definitions */
  columns: Column<T>[];
  /** Row data */
  data: T[];
  /** Unique key extractor for each row */
  rowKey: (row: T, index: number) => string;
  /** Currently sorted column */
  sortColumn?: string;
  /** Current sort direction */
  sortDirection?: SortDirection;
  /** Sort change handler */
  onSort?: (column: string, direction: SortDirection) => void;
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Whether data is loading */
  loading?: boolean;
  /** Number of skeleton rows when loading */
  loadingRows?: number;
  /** Content to show when data is empty */
  emptyState?: React.ReactNode;
  /** Compact row height */
  compact?: boolean;
  /** Additional table className */
  className?: string;
  /** Highlight the active row key */
  activeRowKey?: string;
}

/* ─── Sort Icon ─── */

function SortIcon({ direction }: { direction: SortDirection }) {
  if (direction === 'asc') return <ChevronUp className="h-3.5 w-3.5" />;
  if (direction === 'desc') return <ChevronDown className="h-3.5 w-3.5" />;
  return <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />;
}

/* ─── Table Component ─── */

function Table<T>({
  columns,
  data,
  rowKey,
  sortColumn,
  sortDirection,
  onSort,
  onRowClick,
  loading = false,
  loadingRows = 5,
  emptyState,
  compact = false,
  className,
  activeRowKey,
}: TableProps<T>) {
  const [focusedRow, setFocusedRow] = React.useState<number>(-1);
  const tableRef = React.useRef<HTMLTableElement>(null);

  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !onSort) return;
    const newDirection: SortDirection =
      sortColumn === column.key
        ? sortDirection === 'asc'
          ? 'desc'
          : sortDirection === 'desc'
            ? null
            : 'asc'
        : 'asc';
    onSort(column.key, newDirection);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!onRowClick || data.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedRow((prev) => Math.min(prev + 1, data.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedRow((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        if (focusedRow >= 0 && focusedRow < data.length) {
          const row = data[focusedRow];
          if (row !== undefined) {
            onRowClick(row, focusedRow);
          }
        }
        break;
    }
  };

  const rowHeight = compact ? 'h-9' : 'h-12';

  return (
    <div className={cn('overflow-auto rounded-xl border border-border-default shadow-card', className)}>
      <table
        ref={tableRef}
        className="w-full border-collapse"
        role="grid"
        onKeyDown={handleKeyDown}
        tabIndex={onRowClick ? 0 : undefined}
      >
        <thead className="sticky top-0 z-10">
          <tr className="bg-bg-secondary/95 backdrop-blur-md">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'h-10 px-4 text-left text-[10.5px] font-semibold uppercase tracking-wider text-text-tertiary select-none',
                  'border-b border-border-default',
                  col.numeric && 'text-right',
                  col.sortable && 'cursor-pointer select-none hover:text-text-primary transition-colors',
                  col.headerClassName
                )}
                style={col.width ? { width: col.width } : undefined}
                onClick={() => handleSort(col)}
                aria-sort={
                  sortColumn === col.key
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : sortDirection === 'desc'
                        ? 'descending'
                        : 'none'
                    : undefined
                }
              >
                <div className={cn('flex items-center gap-1', col.numeric && 'justify-end')}>
                  <span>{col.header}</span>
                  {col.sortable && (
                    <SortIcon direction={sortColumn === col.key ? sortDirection ?? null : null} />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: loadingRows }).map((_, i) => (
              <tr key={`skeleton-${i}`} className={rowHeight}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4">
                    <Skeleton variant="rect" height={16} width={col.numeric ? 80 : '70%'} />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-16 text-center">
                {emptyState ?? (
                  <p className="text-sm text-text-tertiary">No data available</p>
                )}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              const key = rowKey(row, rowIndex);
              return (
                <tr
                  key={key}
                  className={cn(
                    rowHeight,
                    'border-b border-border-subtle last:border-0 transition-colors duration-100',
                    'hover:bg-surface-selected table-row-interactive',
                    onRowClick && 'cursor-pointer',
                    focusedRow === rowIndex && 'bg-surface-selected',
                    activeRowKey === key && 'bg-surface-selected'
                  )}
                  onClick={() => onRowClick?.(row, rowIndex)}
                  onMouseEnter={() => setFocusedRow(rowIndex)}
                  role={onRowClick ? 'button' : undefined}
                  tabIndex={onRowClick ? -1 : undefined}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 text-[13px]',
                        col.numeric && 'text-right font-mono-nums',
                        col.cellClassName
                      )}
                    >
                      {col.cell(row, rowIndex)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export { Table, type TableProps, type Column, type SortDirection };
