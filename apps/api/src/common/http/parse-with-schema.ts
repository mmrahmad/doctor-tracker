import type { z } from 'zod';
import { ValidationError } from '../errors/application-errors';

/**
 * Validates an untrusted request part (body, query, params) and returns the typed, sanitized value.
 * Unknown keys are stripped by Zod objects, so operator-injection payloads never reach queries.
 */
export function parseWithSchema<TSchema extends z.ZodType>(
  schema: TSchema,
  untrustedInput: unknown,
): z.infer<TSchema> {
  const parseResult = schema.safeParse(untrustedInput);
  if (parseResult.success) return parseResult.data;

  const fieldErrors: Record<string, string[]> = {};
  for (const issue of parseResult.error.issues) {
    const fieldPath = issue.path.join('.') || 'request';
    (fieldErrors[fieldPath] ??= []).push(issue.message);
  }
  throw new ValidationError(fieldErrors);
}
