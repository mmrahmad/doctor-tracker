import { differenceInYears, format, parseISO } from 'date-fns';

const integerFormatter = new Intl.NumberFormat('en-US');
const compactFormatter = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

export function formatInteger(value: number): string {
  return integerFormatter.format(value);
}

export function formatCompactNumber(value: number): string {
  return value >= 10_000 ? compactFormatter.format(value) : integerFormatter.format(value);
}

/** Formats an ISO timestamp or `YYYY-MM-DD` date as e.g. "Nov 13, 2026". */
export function formatDisplayDate(isoDate: string): string {
  return format(parseISO(isoDate), 'MMM d, yyyy');
}

export function formatAge(dateOfBirth: string): string {
  return `${differenceInYears(new Date(), parseISO(dateOfBirth))} yrs`;
}

export function getInitials(fullName: string): string {
  const meaningfulWords = fullName
    .replace(/^dr\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean);
  const firstInitial = meaningfulWords[0]?.[0] ?? '';
  const lastInitial = meaningfulWords.length > 1 ? (meaningfulWords.at(-1)?.[0] ?? '') : '';
  return `${firstInitial}${lastInitial}`.toUpperCase();
}

/** Percentage change between two periods, or `null` when there is no baseline. */
export function calculatePercentageChange(currentValue: number, previousValue: number): number | null {
  if (previousValue === 0) return null;
  return Math.round(((currentValue - previousValue) / previousValue) * 1000) / 10;
}

export function pluralize(count: number, singularNoun: string, pluralNoun = `${singularNoun}s`): string {
  return `${formatInteger(count)} ${count === 1 ? singularNoun : pluralNoun}`;
}
