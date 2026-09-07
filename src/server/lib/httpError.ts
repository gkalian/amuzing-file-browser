// Small helper for building HTTP errors with a status code and an app-specific code.
// The centralized error handler (middleware/errorHandler.ts) reads `.status` and `.appCode`.

export class HttpError extends Error {
  readonly status: number;
  readonly appCode: string;

  constructor(status: number, appCode: string, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.appCode = appCode;
  }
}

/**
 * Create an HttpError carrying an HTTP status and an app-specific code.
 * @param status HTTP status code (e.g. 400, 403)
 * @param appCode machine-readable code surfaced to the client (e.g. 'forbidden')
 * @param message human-readable message
 */
export function httpError(status: number, appCode: string, message: string): HttpError {
  return new HttpError(status, appCode, message);
}

// Shape the centralized error handler looks for on any caught error, whether
// it's an HttpError, a Node fs error, or a plain thrown Error.
export type HttpAwareError = Error & { status?: number; appCode?: string };

/**
 * Tag a caught error (or non-Error throw) with a default HTTP status/appCode
 * before forwarding it to the centralized error handler, without clobbering
 * values it may already carry (e.g. from HttpError or a Node errno code).
 */
export function withDefaultStatus(err: unknown, status: number, appCode?: string): HttpAwareError {
  const e = (err instanceof Error ? err : new Error(String(err))) as HttpAwareError;
  e.status = e.status ?? status;
  if (appCode) e.appCode = e.appCode ?? appCode;
  return e;
}
