'use client';

import { ANALYTICS_RANGE_LABELS, ANALYTICS_RANGES, type AnalyticsRange } from '@doctor-tracker/contracts';
import { cn } from '@/lib/class-names';

const SHORT_RANGE_LABELS: Record<AnalyticsRange, string> = { '7d': '7D', '30d': '30D', '90d': '90D', '12m': '12M' };

interface RangeSelectorProps {
  selectedRange: AnalyticsRange;
  onRangeChange: (range: AnalyticsRange) => void;
}

/** Segmented preset control; one row above the dashboard and scoping every number on it. */
export function RangeSelector({ selectedRange, onRangeChange }: RangeSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Date range" className="inline-flex rounded-lg border border-border bg-surface p-1 shadow-card">
      {ANALYTICS_RANGES.map((range) => {
        const isSelected = range === selectedRange;
        return (
          <button
            key={range}
            type="button"
            role="radio"
            aria-checked={isSelected}
            title={ANALYTICS_RANGE_LABELS[range]}
            onClick={() => onRangeChange(range)}
            className={cn(
              'h-8 min-w-12 rounded-md px-3 text-[13px] font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring',
              isSelected ? 'bg-primary text-primary-foreground shadow-card' : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground',
            )}
          >
            {SHORT_RANGE_LABELS[range]}
          </button>
        );
      })}
    </div>
  );
}
