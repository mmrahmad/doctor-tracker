'use client';

import { PAGINATION_DEFAULTS, type PaginationMeta } from '@doctor-tracker/contracts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/class-names';
import { formatInteger } from '@/lib/formatters';
import { Button } from './button';
import { SelectInput } from './select-input';

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  itemLabel: string;
}

const PAGE_SIZE_OPTIONS = PAGINATION_DEFAULTS.pageSizeOptions.map((pageSize) => ({
  value: String(pageSize),
  label: `${pageSize} / page`,
}));

type PageSlot = number | 'gap-start' | 'gap-end';

/** Always shows first, last, current ±1 — with gaps — so the control width stays stable. */
export function buildPageSlots(currentPage: number, totalPages: number): PageSlot[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const nearbyStart = Math.max(2, Math.min(currentPage - 1, totalPages - 4));
  const nearbyEnd = Math.min(totalPages - 1, Math.max(currentPage + 1, 5));
  const slots: PageSlot[] = [1];
  if (nearbyStart > 2) slots.push('gap-start');
  for (let page = nearbyStart; page <= nearbyEnd; page += 1) slots.push(page);
  if (nearbyEnd < totalPages - 1) slots.push('gap-end');
  slots.push(totalPages);
  return slots;
}

export function Pagination({ pagination, onPageChange, onPageSizeChange, itemLabel }: PaginationProps) {
  const { page, pageSize, totalItems, totalPages } = pagination;
  const firstItemNumber = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItemNumber = Math.min(page * pageSize, totalItems);

  return (
    <nav
      aria-label={`${itemLabel} pagination`}
      className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
    >
      <div className="flex items-center justify-between gap-3 sm:justify-start">
        <p className="text-[13px] text-muted-foreground">
          <span className="font-medium text-foreground tabular-nums">
            {formatInteger(firstItemNumber)}–{formatInteger(lastItemNumber)}
          </span>{' '}
          of <span className="font-medium text-foreground tabular-nums">{formatInteger(totalItems)}</span> {itemLabel}
        </p>
        <SelectInput
          aria-label="Rows per page"
          value={String(pageSize)}
          onValueChange={(nextPageSize) => onPageSizeChange(Number(nextPageSize))}
          options={PAGE_SIZE_OPTIONS}
          className="h-8 w-[118px] text-[13px]"
        />
      </div>

      <div className="flex items-center justify-between gap-1 sm:justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft />
          <span className="sm:sr-only">Previous</span>
        </Button>

        <span className="text-[13px] text-muted-foreground sm:hidden">
          Page {page} of {totalPages}
        </span>

        <ol className="hidden items-center gap-1 sm:flex">
          {buildPageSlots(page, totalPages).map((slot) =>
            typeof slot === 'number' ? (
              <li key={slot}>
                <button
                  type="button"
                  onClick={() => onPageChange(slot)}
                  aria-current={slot === page ? 'page' : undefined}
                  className={cn(
                    'h-8 min-w-8 rounded-lg px-2 text-[13px] font-medium tabular-nums transition-colors',
                    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring',
                    slot === page
                      ? 'bg-primary-soft text-primary'
                      : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground',
                  )}
                >
                  {slot}
                </button>
              </li>
            ) : (
              <li key={slot} className="w-6 text-center text-subtle-foreground" aria-hidden>
                …
              </li>
            ),
          )}
        </ol>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <span className="sm:sr-only">Next</span>
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}
