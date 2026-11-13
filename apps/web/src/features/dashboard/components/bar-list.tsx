import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatInteger } from '@/lib/formatters';

export interface BarListItem {
  key: string;
  /** Category label (text or a labeled badge) — identity is never carried by color. */
  label: ReactNode;
  value: number;
  secondaryText?: string;
}

interface BarListProps {
  items: BarListItem[] | undefined;
  valueLabel: string;
  emptyMessage: string;
  skeletonRowCount?: number;
}

/**
 * Ranked horizontal bars in a single hue with direct value labels. Every value is visible
 * without hovering, which makes this readable on touch screens and by screen readers.
 */
export function BarList({ items, valueLabel, emptyMessage, skeletonRowCount = 6 }: BarListProps) {
  if (!items) {
    return (
      <ul className="space-y-4" aria-hidden>
        {Array.from({ length: skeletonRowCount }, (_, index) => (
          <li key={index} className="space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-2 w-full rounded-full" />
          </li>
        ))}
      </ul>
    );
  }
  if (items.length === 0) return <p className="py-10 text-center text-sm text-muted-foreground">{emptyMessage}</p>;

  const largestValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <ul className="space-y-3.5">
      {items.map((item) => (
        <li key={item.key} className="group">
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-foreground">
              <span className="truncate">{item.label}</span>
              {item.secondaryText && (
                <span className="hidden truncate text-xs font-normal text-muted-foreground sm:inline">{item.secondaryText}</span>
              )}
            </div>
            <span className="shrink-0 text-[13px] font-semibold text-foreground tabular-nums">
              {formatInteger(item.value)}
              <span className="sr-only"> {valueLabel}</span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-chart-series transition-[width,opacity] duration-500 group-hover:opacity-80"
              style={{ width: `${Math.max((item.value / largestValue) * 100, 1.5)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
