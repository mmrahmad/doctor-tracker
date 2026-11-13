import { objectIdSchema } from '@doctor-tracker/contracts';
import type { Request } from 'express';
import { z } from 'zod';
import { parseWithSchema } from './parse-with-schema';

/** Reads and validates a single ObjectId route parameter, e.g. `/doctors/:doctorId`. */
export function readObjectIdParam(request: Request, parameterName: string): string {
  const paramsSchema = z.object({ [parameterName]: objectIdSchema });
  const parsedParams = parseWithSchema(paramsSchema, request.params) as Record<string, string>;
  return parsedParams[parameterName] as string;
}
