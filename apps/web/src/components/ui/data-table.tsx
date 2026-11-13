'use client';

import type { Key, ReactNode } from 'react';
import { cn } from '@/lib/class-names';
import { Skeleton } from './skeleton';

export interface DataTableColumn<TRow> {
  id: string;
  header: string;
  renderCell: (row: TRow) => ReactNode;
  className?: string;
  align?: 'start' | 'end';
}

interface DataTableProps<TRow> {
  caption: string;
  columns: DataTableColumn<TRow>[];
  rows: TRow[] | undefined;
  getRowKey: (row: TRow) => Key;
  isLoading: boolean;
  /** True while a new page/filter loads and the previous rows are still shown. */
  isRefreshing?: boolean;
  emptyState: ReactNode;
  /** Card layout used below the `md` breakpoint instead of a horizontally scrolling table. */
  renderMobileCard: (row: TRow) => ReactNode;
  skeletonRowCount?: number;
}

/**
 * Generic, accessible data table shared by the doctors and patients lists.
 * Desktop: semantic table. Mobile: stacked cards. Loading: shape-matched skeletons.
 */
export function DataTable<TRow>({
  caption,
  columns,
  rows,
  getRowKey,
  isLoading,
  isRefreshing = false,
  emptyState,
  renderMobileCard,
  skeletonRowCount = 8,
}: DataTableProps<TRow>) {
  if (!isLoading && rows?.length === 0) return <>{emptyState}</>;

  const skeletonRows = Array.from({ length: skeletonRowCount }, (_, rowIndex) => rowIndex);

  return (
    <div
      className={cn('transition-opacity duration-200', isRefreshing && 'opacity-60')}
      aria-busy={isLoading || isRefreshing}
    >
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={cn(
                    'border-b border-border bg-surface-muted/60 px-4 py-3 text-xs font-medium tracking-wide whitespace-nowrap text-muted-foreground uppercase first:pl-6 last:pr-6',
                    column.align === 'end' ? 'text-right' : 'text-left',
                    column.className,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? skeletonRows.map((rowIndex) => (
                  <tr key={rowIndex}>
                    {columns.map((column) => (
                      <td key={column.id} className="border-b border-border px-4 py-4 first:pl-6 last:pr-6">
                        <Skeleton className="h-4 w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows?.map((row) => (
                  <tr key={getRowKey(row)} className="group transition-colors hover:bg-surface-hover">
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={cn(
                          'border-b border-border px-4 py-3.5 align-middle whitespace-nowrap text-foreground group-last:border-b-0 first:pl-6 last:pr-6',
                          column.align === 'end' && 'text-right',
                          column.className,
                        )}
                      >
                        {column.renderCell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-border md:hidden" aria-label={caption}>
        {isLoading
          ? skeletonRows.slice(0, 5).map((rowIndex) => (
              <li key={rowIndex} className="flex items-center gap-3 px-4 py-4">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </li>
            ))
          : rows?.map((row) => (
              <li key={getRowKey(row)} className="px-4 py-4">
                {renderMobileCard(row)}
              </li>
            ))}
      </ul>
    </div>
  );
}
