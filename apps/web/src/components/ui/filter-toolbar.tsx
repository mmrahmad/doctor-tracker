import { FilterX } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './button';

interface FilterToolbarProps {
  /** Primary control, usually the search box; takes the remaining width. */
  primaryControl: ReactNode;
  children: ReactNode;
  activeFilterCount: number;
  onClearFilters: () => void;
}

/**
 * Responsive filter row: one column on phones, two on tablets, and a wrapping row on desktop
 * where filters keep their natural width (never squeezed) and search absorbs the remaining space.
 */
export function FilterToolbar({ primaryControl, children, activeFilterCount, onClearFilters }: FilterToolbarProps) {
  return (
    <div className="grid grid-cols-1 gap-3 border-b border-border p-4 sm:grid-cols-2 sm:px-6 lg:flex lg:flex-wrap lg:items-center lg:*:shrink-0">
      <div className="min-w-0 sm:col-span-2 lg:min-w-64 lg:flex-1 lg:shrink!">{primaryControl}</div>
      {children}
      {activeFilterCount > 0 && (
        <Button variant="ghost" onClick={onClearFilters} className="sm:col-span-2 lg:col-span-1">
          <FilterX />
          Clear
          <span className="rounded-full bg-primary-soft px-1.5 text-xs text-primary tabular-nums">{activeFilterCount}</span>
        </Button>
      )}
    </div>
  );
}
