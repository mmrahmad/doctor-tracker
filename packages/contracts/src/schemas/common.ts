import { z } from 'zod';
import { PAGINATION_DEFAULTS, SEARCH_TERM_MAX_LENGTH, SORT_DIRECTIONS } from '../constants';

export const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Must be a valid identifier');

export const personNameSchema = z
  .string()
  .trim()
  .min(2, 'Must be at least 2 characters')
  .max(100, 'Must be at most 100 characters');

export const emailSchema = z.email('Enter a valid email address').trim().toLowerCase().max(254);

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9\s\-()]{6,19}$/, 'Enter a valid phone number');

/** Calendar date in `YYYY-MM-DD` form, as produced by `<input type="date">`. */
export const calendarDateSchema = z.iso.date('Enter a valid date');

const emptyStringToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

export const optionalQueryValue = <TSchema extends z.ZodType>(schema: TSchema) =>
  z.preprocess(emptyStringToUndefined, schema.optional());

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION_DEFAULTS.page),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION_DEFAULTS.maxPageSize)
    .default(PAGINATION_DEFAULTS.pageSize),
});

export const searchQuerySchema = z.object({
  search: optionalQueryValue(z.string().trim().max(SEARCH_TERM_MAX_LENGTH)),
});

export const dateRangeQuerySchema = z.object({
  dateFrom: optionalQueryValue(calendarDateSchema),
  dateTo: optionalQueryValue(calendarDateSchema),
});

/** Adds the "start date must not be after end date" rule to any schema containing a date range. */
export const withOrderedDateRange = <TSchema extends z.ZodType<{ dateFrom?: string; dateTo?: string }>>(
  schema: TSchema,
) =>
  schema.refine(
    ({ dateFrom, dateTo }) => !dateFrom || !dateTo || dateFrom <= dateTo,
    { message: 'Start date must be on or before end date', path: ['dateTo'] },
  );

export const sortDirectionSchema = z.enum(SORT_DIRECTIONS).default('desc');

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
