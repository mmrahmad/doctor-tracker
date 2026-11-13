'use client';

import { cn } from '@/lib/class-names';
import { Input } from './input';

interface DateRangeFilterProps {
  label: string;
  dateFrom: string;
  dateTo: string;
  onChange: (range: { dateFrom: string; dateTo: string }) => void;
  className?: string;
}

/** Two native date inputs (great mobile pickers) that keep `from <= to` by construction. */
export function DateRangeFilter({ label, dateFrom, dateTo, onChange, className }: DateRangeFilterProps) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <fieldset className={cn('flex min-w-0 items-center gap-2', className)}>
      <legend className="sr-only">{label}</legend>
      <Input
        type="date"
        aria-label={`${label} from`}
        value={dateFrom}
        max={dateTo || today}
        onChange={(event) => onChange({ dateFrom: event.target.value, dateTo })}
        className="min-w-0 flex-1 tabular-nums"
      />
      <span className="text-sm text-subtle-foreground" aria-hidden>
        –
      </span>
      <Input
        type="date"
        aria-label={`${label} to`}
        value={dateTo}
        min={dateFrom || undefined}
        max={today}
        onChange={(event) => onChange({ dateFrom, dateTo: event.target.value })}
        className="min-w-0 flex-1 tabular-nums"
      />
    </fieldset>
  );
}
