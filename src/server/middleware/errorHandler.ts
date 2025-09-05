// Centralized error handler middleware: normalizes errors into JSON responses with proper HTTP codes.
// Maps common filesystem and validation errors, logs via centralized logger, and includes optional requestId.
import type { Request, Response, NextFunction } from 'express';
import { isLevelEnabled, type LogLevel } from '../config.js';
import { log } from '../log.js';

function statusFromError(err: any): { status: number; code: string; message: string; details?: unknown } {
  // Zod validation (duck-typing: no hard dependency required here)
  const isZod = err && (err.name === 'ZodError' || Array.isArray(err.issues));
  if (isZod) {
    return {
      status: 400,
      code: 'validation_error',
      message: 'Invalid request data',
      details: err.issues,
    };
  }

  // Node.js fs error codes
  const code = (err && (err.code as string)) || '';
  const msg = (err && (err.message as string)) || 'Internal Server Error';
  switch (code) {
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

  // App-specific signals (optionally mark errors with .status / .httpCode / .appCode)
  const httpStatus = (err && (err.status || err.statusCode || err.httpCode)) as number | undefined;
  const appCode = (err && (err.appCode as string)) || 'internal_error';
  if (httpStatus && httpStatus >= 400 && httpStatus <= 599) {
    return { status: httpStatus, code: appCode, message: msg };
  }

  return { status: 500, code: 'internal_error', message: msg };
}

export function errorHandler() {
  return (err: any, req: Request, res: Response, _next: NextFunction) => {
    const requestId = ((res.locals as any)?.requestId as string) || (req.headers['x-request-id'] as string) || undefined;
    if (requestId) res.setHeader('X-Request-Id', requestId);
    const { status, code, message, details } = statusFromError(err);

    // Log error (gate by LOG_LEVEL)
    const level: LogLevel = status >= 500 ? 'error' : 'warn';
    if (isLevelEnabled(level)) {
      log(level, {
        event: 'request_error',
        method: req.method,
        url: (req as any).originalUrl || req.url,
        status,
        code,
        message,
        requestId,
        // Only include stack when debug level is enabled
        stack: isLevelEnabled('debug') ? err?.stack : undefined,
      });
    }

    res.status(status).json({ error: { code, message, details }, requestId });
  };
}
