import type { AnalyticsRange, TrendBucketUnit } from '@doctor-tracker/contracts';

export interface AnalyticsWindow {
  bucketUnit: TrendBucketUnit;
  /** Inclusive start of the current window, aligned to a bucket boundary (UTC). */
  windowStart: Date;
  /** Exclusive end of the current window (start of the bucket after "now"). */
  windowEnd: Date;
  /** Inclusive start of the equally long window right before the current one. */
  previousWindowStart: Date;
  bucketStarts: Date[];
}

const RANGE_SHAPES: Record<AnalyticsRange, { bucketUnit: TrendBucketUnit; bucketCount: number }> = {
  '7d': { bucketUnit: 'day', bucketCount: 7 },
  '30d': { bucketUnit: 'day', bucketCount: 30 },
  '90d': { bucketUnit: 'week', bucketCount: 13 },
  '12m': { bucketUnit: 'month', bucketCount: 12 },
};

/** Start of the bucket containing `date`. Weeks start on Monday, matching `$dateTrunc` below. */
export function truncateToBucket(date: Date, bucketUnit: TrendBucketUnit): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  if (bucketUnit === 'month') return new Date(Date.UTC(year, month, 1));
  if (bucketUnit === 'week') {
    const daysSinceMonday = (date.getUTCDay() + 6) % 7;
    return new Date(Date.UTC(year, month, day - daysSinceMonday));
  }
  return new Date(Date.UTC(year, month, day));
}

export function shiftByBuckets(date: Date, bucketUnit: TrendBucketUnit, bucketOffset: number): Date {
  const shiftedDate = new Date(date);
  if (bucketUnit === 'month') shiftedDate.setUTCMonth(shiftedDate.getUTCMonth() + bucketOffset);
  else shiftedDate.setUTCDate(shiftedDate.getUTCDate() + bucketOffset * (bucketUnit === 'week' ? 7 : 1));
  return shiftedDate;
}

export function resolveAnalyticsWindow(range: AnalyticsRange, now: Date = new Date()): AnalyticsWindow {
  const { bucketUnit, bucketCount } = RANGE_SHAPES[range];
  const currentBucketStart = truncateToBucket(now, bucketUnit);
  const windowStart = shiftByBuckets(currentBucketStart, bucketUnit, -(bucketCount - 1));
  const bucketStarts = Array.from({ length: bucketCount }, (_, bucketIndex) =>
    shiftByBuckets(windowStart, bucketUnit, bucketIndex),
  );

  return {
    bucketUnit,
    windowStart,
    windowEnd: shiftByBuckets(currentBucketStart, bucketUnit, 1),
    previousWindowStart: shiftByBuckets(windowStart, bucketUnit, -bucketCount),
    bucketStarts,
  };
}
