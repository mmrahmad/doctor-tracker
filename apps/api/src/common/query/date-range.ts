const MILLISECONDS_PER_DAY = 86_400_000;

/** Converts a `YYYY-MM-DD` calendar date to a UTC midnight `Date`. */
export function calendarDateToUtcDate(calendarDate: string): Date {
  return new Date(`${calendarDate}T00:00:00.000Z`);
}

export function utcDateToCalendarDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Builds an inclusive calendar-day range filter for a date field, e.g. `{ admittedAt: { $gte, $lt } }`.
 * `dateTo` is inclusive, so the upper bound is the start of the following day.
 */
export function buildDateRangeFilter(
  fieldName: string,
  dateFrom: string | undefined,
  dateTo: string | undefined,
): Record<string, unknown> {
  if (!dateFrom && !dateTo) return {};
  const bounds: Record<string, Date> = {};
  if (dateFrom) bounds.$gte = calendarDateToUtcDate(dateFrom);
  if (dateTo) bounds.$lt = new Date(calendarDateToUtcDate(dateTo).getTime() + MILLISECONDS_PER_DAY);
  return { [fieldName]: bounds };
}
