import type { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import {
  CommentRequiredError,
  DomainError,
  ForbiddenTransitionError,
  IllegalTransitionError,
} from '../../domain/errors.js';
import { ApiError, type ApiErrorCode } from '../errors.js';

interface ErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
}

function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;

  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }));
    return new ApiError(422, 'VALIDATION_ERROR', 'Request validation failed', details);
  }

  // Domain errors from the pure state machine, mapped to HTTP semantics.
  if (err instanceof IllegalTransitionError) {
    return new ApiError(409, 'ILLEGAL_TRANSITION', err.message);
  }
  if (err instanceof ForbiddenTransitionError) {
    return ApiError.forbidden(err.message);
  }
  if (err instanceof CommentRequiredError) {
    return new ApiError(422, 'COMMENT_REQUIRED', err.message);
  }
  if (err instanceof DomainError) {
    return new ApiError(422, 'VALIDATION_ERROR', err.message);
  }

  if (err instanceof MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'File exceeds the maximum allowed size' : err.message;
    return new ApiError(422, 'VALIDATION_ERROR', message);
  }

  return new ApiError(500, 'INTERNAL_ERROR', 'Something went wrong');
}

// Express identifies error middleware by its four-parameter signature, so
// `next` must be present even though it is unused here.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const apiError = toApiError(err);

  if (apiError.status >= 500) {
    console.error(err);
  }

  const body: ErrorBody = {
    error: {
      code: apiError.code,
      message: apiError.message,
    },
  };
  if (apiError.details !== undefined) {
    body.error.details = apiError.details;
  }

  res.status(apiError.status).json(body);
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  } satisfies ErrorBody);
}
