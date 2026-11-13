import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiRequestError } from './http/api-request-error';

/**
 * Shows server-side validation/conflict messages next to the matching form fields.
 * Returns `true` when at least one field error was applied (so callers can skip a generic toast).
 */
export function applyServerFieldErrors<TFieldValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>,
  knownFieldNames: readonly string[],
): boolean {
  if (!(error instanceof ApiRequestError)) return false;
  let appliedAny = false;
  for (const [fieldName, messages] of Object.entries(error.fieldErrors)) {
    if (!knownFieldNames.includes(fieldName) || !messages[0]) continue;
    setError(fieldName as Path<TFieldValues>, { type: 'server', message: messages[0] });
    appliedAny = true;
  }
  return appliedAny;
}
