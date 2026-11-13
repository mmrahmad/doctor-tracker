import { IDEMPOTENCY_KEY_HEADER } from '@doctor-tracker/contracts';
import type { RequestHandler } from 'express';
import type { KeyValueStore } from '../../infrastructure/cache/key-value-store';
import { ConflictError, ValidationError } from '../errors/application-errors';

const IN_PROGRESS_MARKER = 'in-progress';
const IN_PROGRESS_TTL_SECONDS = 60;
const COMPLETED_RESPONSE_TTL_SECONDS = 24 * 60 * 60;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

interface StoredResponse {
  httpStatus: number;
  body: unknown;
}

/**
 * Makes create endpoints safe to retry (double clicks, flaky networks, client retries).
 * The first request with a given `Idempotency-Key` runs; concurrent duplicates get 409; later
 * duplicates replay the stored successful response. Without the header — or if the store is
 * unavailable — the request runs normally.
 */
export function enforceIdempotency(keyValueStore: KeyValueStore): RequestHandler {
  return async (request, response, next) => {
    const idempotencyKey = request.get(IDEMPOTENCY_KEY_HEADER);
    if (!idempotencyKey) return next();
    if (!IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
      throw new ValidationError({ [IDEMPOTENCY_KEY_HEADER]: ['Malformed idempotency key'] });
    }

    const ownerId = request.authenticatedUser?.id ?? 'anonymous';
    const storageKey = `doctor-tracker:idempotency:${ownerId}:${request.method}:${request.baseUrl}${request.path}:${idempotencyKey}`;

    const claimed = await keyValueStore.setIfAbsent(storageKey, IN_PROGRESS_MARKER, IN_PROGRESS_TTL_SECONDS);
    if (claimed === null) return next();

    if (!claimed) {
      const storedValue = await keyValueStore.get(storageKey);
      if (!storedValue || storedValue === IN_PROGRESS_MARKER) {
        throw new ConflictError('An identical request is already being processed');
      }
      const storedResponse = JSON.parse(storedValue) as StoredResponse;
      response.setHeader('Idempotent-Replayed', 'true');
      response.status(storedResponse.httpStatus).json(storedResponse.body);
      return;
    }

    const sendJson = response.json.bind(response);
    response.json = (body: unknown) => {
      const isSuccessful = response.statusCode >= 200 && response.statusCode < 300;
      const storedResponse: StoredResponse = { httpStatus: response.statusCode, body };
      void (isSuccessful
        ? keyValueStore.set(storageKey, JSON.stringify(storedResponse), COMPLETED_RESPONSE_TTL_SECONDS)
        : keyValueStore.delete(storageKey));
      return sendJson(body);
    };
    next();
  };
}
