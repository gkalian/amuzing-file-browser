// Centralized error handler middleware: normalizes errors into JSON responses with proper HTTP codes.
// Maps common filesystem errors and app-specific status/appCode signals, logs via the centralized
// logger, and includes an optional requestId.
import type { Request, Response, NextFunction } from 'express';
import { isLevelEnabled, type LogLevel } from '../config.js';
import { log } from '../log.js';
import type { HttpAwareError } from '../lib/httpError.js';

function statusFromError(err: unknown): {
  status: number;
  code: string;
  message: string;
  details?: unknown;
} {
  const msg = err instanceof Error ? err.message : 'Internal Server Error';

  // Node.js fs error codes
  const errnoCode = err instanceof Error ? (err as NodeJS.ErrnoException).code : undefined;
  switch (errnoCode) {
    case 'ENOENT':
      return { status: 404, code: 'not_found', message: msg };
    case 'EISDIR':
      return { status: 400, code: 'is_directory', message: msg };
    case 'ENOTDIR':
      return { status: 400, code: 'not_a_directory', message: msg };
    case 'EACCES':
    case 'EPERM':
      return { status: 403, code: 'forbidden', message: msg };
    case 'EMFILE':
    case 'ENFILE':
      return { status: 503, code: 'server_busy', message: msg };
    default:
      break;
  }

  // App-specific signals (errors tagged via lib/httpError's withDefaultStatus/HttpError)
  const aware = err instanceof Error ? (err as HttpAwareError) : undefined;
  const httpStatus = aware?.status;
  const appCode = aware?.appCode || 'internal_error';
  if (httpStatus && httpStatus >= 400 && httpStatus <= 599) {
    return { status: httpStatus, code: appCode, message: msg };
  }

  return { status: 500, code: 'internal_error', message: msg };
}

export function errorHandler() {
  return (err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const requestId =
      (res.locals.requestId as string | undefined) ||
      (req.headers['x-request-id'] as string) ||
      undefined;
    if (requestId) res.setHeader('X-Request-Id', requestId);
    const { status, code, message, details } = statusFromError(err);

    // Log error (gate by LOG_LEVEL)
    const level: LogLevel = status >= 500 ? 'error' : 'warn';
    if (isLevelEnabled(level)) {
      log(level, {
        event: 'request_error',
        method: req.method,
        url: req.originalUrl || req.url,
        status,
        code,
        message,
        requestId,
        // Only include stack when debug level is enabled
        stack: isLevelEnabled('debug') && err instanceof Error ? err.stack : undefined,
      });
    }

    res.status(status).json({ error: { code, message, details }, requestId });
  };
}
