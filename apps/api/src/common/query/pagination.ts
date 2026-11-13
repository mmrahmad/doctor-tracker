import type { PaginatedResult, PaginationQuery, SortDirection } from '@doctor-tracker/contracts';

export interface RecordPage<TRecord> {
  records: TRecord[];
  totalItems: number;
}

export interface PageWindow {
  skip: number;
  limit: number;
}

export function toPageWindow({ page, pageSize }: PaginationQuery): PageWindow {
  return { skip: (page - 1) * pageSize, limit: pageSize };
}

export function buildPaginatedResult<TItem>(
  items: TItem[],
  totalItems: number,
  { page, pageSize }: PaginationQuery,
): PaginatedResult<TItem> {
  return {
    items,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    },
  };
}

/** Sort spec with `_id` as a deterministic tiebreaker so pages never overlap or skip records. */
export function buildStableSort(
  fieldName: string,
  direction: SortDirection,
): Record<string, 1 | -1> {
  const mongoDirection = direction === 'asc' ? 1 : -1;
  return { [fieldName]: mongoDirection, _id: mongoDirection };
}

export function hasActiveFilters(filter: Record<string, unknown>): boolean {
  return Object.keys(filter).length > 0;
}
