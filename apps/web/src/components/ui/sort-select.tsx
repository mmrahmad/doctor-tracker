'use client';

import type { SortDirection } from '@doctor-tracker/contracts';
import { SelectInput } from './select-input';

export interface SortOption<TSortField extends string> {
  label: string;
  sortBy: TSortField;
  sortDirection: SortDirection;
}

interface SortSelectProps<TSortField extends string> {
  options: readonly SortOption<TSortField>[];
  sortBy: TSortField;
  sortDirection: SortDirection;
  onSortChange: (sort: { sortBy: TSortField; sortDirection: SortDirection }) => void;
  className?: string;
}

const encodeSort = (sortBy: string, sortDirection: SortDirection) => `${sortBy}:${sortDirection}`;

/** One control for field + direction, phrased in plain language ("Name A–Z", "Most patients"). */
export function SortSelect<TSortField extends string>({
  options,
  sortBy,
  sortDirection,
  onSortChange,
  className,
}: SortSelectProps<TSortField>) {
  return (
    <SelectInput
      aria-label="Sort by"
      className={className}
      value={encodeSort(sortBy, sortDirection)}
      options={options.map((option) => ({
        value: encodeSort(option.sortBy, option.sortDirection),
        label: option.label,
      }))}
      onValueChange={(encodedSort) => {
        const selectedOption = options.find(
          (option) => encodeSort(option.sortBy, option.sortDirection) === encodedSort,
        );
        if (selectedOption) {
          onSortChange({ sortBy: selectedOption.sortBy, sortDirection: selectedOption.sortDirection });
        }
      }}
    />
  );
}
