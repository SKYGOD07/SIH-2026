import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response';

export class AppError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode = 500, details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof ZodError) {
    return sendError(res, 'Validation Error', 400, err.errors);
  }

  // A body express.json() could not parse is the caller's mistake, not ours.
  // Left unhandled it surfaced as a 500 carrying the parser's message, which
  // both misreports whose fault it is and tells a caller more than they need.
  if (err instanceof SyntaxError && 'body' in err) {
    return sendError(res, 'Malformed JSON body', 400);
  }

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.details);
  }

  console.error('[Unhandled Error]:', err);
  return sendError(
    res,
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error',
    500
  );
};
