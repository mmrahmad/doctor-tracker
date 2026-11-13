import { describe, expect, it } from 'vitest';
import { resolveAnalyticsWindow, truncateToBucket } from './analytics-window';

const WEDNESDAY_NOON = new Date('2026-11-11T12:00:00.000Z');

describe('truncateToBucket', () => {
  it('aligns weeks to Monday, matching $dateTrunc with startOfWeek=monday', () => {
    expect(truncateToBucket(WEDNESDAY_NOON, 'week').toISOString()).toBe('2026-11-09T00:00:00.000Z');
  });

  it('aligns months to the first day', () => {
    expect(truncateToBucket(WEDNESDAY_NOON, 'month').toISOString()).toBe('2026-11-01T00:00:00.000Z');
  });
});

describe('resolveAnalyticsWindow', () => {
  it('covers the last 7 calendar days including today', () => {
    const window = resolveAnalyticsWindow('7d', WEDNESDAY_NOON);
    expect(window.bucketStarts).toHaveLength(7);
    expect(window.windowStart.toISOString()).toBe('2026-11-05T00:00:00.000Z');
    expect(window.windowEnd.toISOString()).toBe('2026-11-12T00:00:00.000Z');
    expect(window.previousWindowStart.toISOString()).toBe('2026-10-29T00:00:00.000Z');
  });

  it('uses 12 monthly buckets ending with the current month', () => {
    const window = resolveAnalyticsWindow('12m', WEDNESDAY_NOON);
    expect(window.bucketUnit).toBe('month');
    expect(window.bucketStarts[0]?.toISOString()).toBe('2025-12-01T00:00:00.000Z');
    expect(window.bucketStarts.at(-1)?.toISOString()).toBe('2026-11-01T00:00:00.000Z');
  });

  it('uses weekly buckets for 90 days', () => {
    const window = resolveAnalyticsWindow('90d', WEDNESDAY_NOON);
    expect(window.bucketUnit).toBe('week');
    expect(window.bucketStarts).toHaveLength(13);
  });
});
