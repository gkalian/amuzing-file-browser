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
