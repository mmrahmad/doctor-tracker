import type { ApiErrorBody, ApiErrorCode } from '@doctor-tracker/contracts';
import type { ErrorRequestHandler, RequestHandler, Response } from 'express';
import mongoose from 'mongoose';
import { ApplicationError, NotFoundError } from '../errors/application-errors';

const MONGO_DUPLICATE_KEY_CODE = 11000;

interface MongoDuplicateKeyError {
  code: number;
  keyValue?: Record<string, unknown>;
}

interface BodyParserError {
  type?: string;
  status?: number;
}

function sendError(
  response: Response,
  httpStatus: number,
  code: ApiErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>,
): void {
  const body: ApiErrorBody = {
    error: { code, message, requestId: String(response.req.id ?? '') },
  };
  if (fieldErrors) body.error.fieldErrors = fieldErrors;
  response.status(httpStatus).json(body);
}

function isDuplicateKeyError(error: unknown): error is MongoDuplicateKeyError {
  return (error as MongoDuplicateKeyError)?.code === MONGO_DUPLICATE_KEY_CODE;
}

export const handleRouteNotFound: RequestHandler = (request) => {
  throw new NotFoundError(`Route ${request.method} ${request.path}`);
};

/** Translates any thrown error into the standard error envelope without leaking internals. */
export const handleErrors: ErrorRequestHandler = (error, request, response, _next) => {
  if (response.headersSent) return;

  if (error instanceof ApplicationError) {
    sendError(response, error.httpStatus, error.code, error.message, error.fieldErrors);
    return;
  }

  if (isDuplicateKeyError(error)) {
    const duplicatedFields = Object.keys(error.keyValue ?? {});
    const fieldErrors = Object.fromEntries(
      duplicatedFields.map((fieldName) => [fieldName, [`This ${fieldName} is already in use`]]),
    );
    sendError(response, 409, 'CONFLICT', 'A record with the same details already exists', fieldErrors);
    return;
  }

  if (error instanceof mongoose.Error.CastError) {
    sendError(response, 422, 'VALIDATION_FAILED', 'One of the identifiers is malformed');
    return;
  }

  const bodyParserError = error as BodyParserError;
  if (bodyParserError?.type === 'entity.parse.failed') {
    sendError(response, 400, 'VALIDATION_FAILED', 'Request body is not valid JSON');
    return;
  }
  if (bodyParserError?.type === 'entity.too.large') {
    sendError(response, 413, 'VALIDATION_FAILED', 'Request body is too large');
    return;
  }

  request.log.error({ err: error }, 'Unhandled error');
  sendError(response, 500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.');
};
