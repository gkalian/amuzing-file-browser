// Async handler helper: wraps async route handlers and forwards rejections to next(err).
// Use to avoid boilerplate try/catch in routes while leveraging centralized error handling.
import type { Request, Response, NextFunction, RequestHandler } from 'express';

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
