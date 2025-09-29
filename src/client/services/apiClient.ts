// Thin client for talking to the backend API (config, fs ops, upload, preview/download)
import type { ListResponse, FsItem } from '../core/types';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;
  readonly requestId?: string;

  constructor(init: {
    code?: string;
    message?: string;
    status?: number;
    details?: unknown;
    requestId?: string;
  }) {
    const message = init.message && String(init.message).trim();
    super(message && message.length > 0 ? message : 'Request failed');
    this.name = 'ApiError';
    this.code = (init.code && String(init.code)) || 'unknown_error';
    this.status = typeof init.status === 'number' ? init.status : 0;
    this.details = init.details;
    this.requestId = init.requestId;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

type ErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  code?: string;
  message?: string;
  details?: unknown;
  requestId?: string;
};

function extractErrorPayload(
  body: unknown
): { code?: string; message?: string; details?: unknown } | null {
  if (!body || typeof body !== 'object') return null;
  const payload = body as ErrorPayload;
  if (payload.error && typeof payload.error === 'object') {
    const { code, message, details } = payload.error;
    return {
      code: typeof code === 'string' && code ? code : undefined,
      message: typeof message === 'string' && message ? message : undefined,
      details,
    };
  }
  if (typeof payload.code === 'string' || typeof payload.message === 'string') {
    return {
      code: typeof payload.code === 'string' && payload.code ? payload.code : undefined,
      message: typeof payload.message === 'string' && payload.message ? payload.message : undefined,
      details: payload.details,
    };
  }
  return null;
}

function createApiError(params: {
  status?: number;
  body?: unknown;
  fallbackText?: string;
  requestId?: string;
}): ApiError {
  const { status = 0, body, fallbackText, requestId } = params;
  const extracted = extractErrorPayload(body);
  const code = extracted?.code || (status ? `http_${status}` : 'unknown_error');
  const fallbackMessage =
    fallbackText && fallbackText.trim().length > 0 ? fallbackText.trim() : undefined;
  const message = extracted?.message || fallbackMessage || 'Request failed';
  const details = extracted?.details ?? (body && typeof body === 'object' ? body : undefined);
  return new ApiError({ code, message, status, details, requestId });
}

function parseJsonSafe(text: string | null) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function json<T>(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init);
  const requestId = res.headers.get('x-request-id') || undefined;
  const text = await res.text();
  if (!res.ok) {
    const body = parseJsonSafe(text);
    throw createApiError({ status: res.status, body, fallbackText: text, requestId });
  }
  if (!text) {
    return null as T;
  }
  const body = parseJsonSafe(text);
  if (body === null) {
    throw new ApiError({
      code: 'invalid_json_response',
      message: 'Invalid JSON received from server',
      status: res.status,
      details: { text },
      requestId,
    });
  }
  return body as T;
}

type ServerConfig = {
  root: string;
  rootMasked?: boolean;
  maxUploadMB: number;
  allowedTypes?: string;
  ignoreNames?: string[];
  theme: 'light' | 'dark';
  adminDomain?: string;
  mediaDomain?: string;
};

let cfgCache: ServerConfig | null = null;
async function loadConfigCached() {
  if (cfgCache) return cfgCache;
  cfgCache = await json<ServerConfig>(`/api/config`);
  return cfgCache;
}

export const api = {
  getConfig: () => json<ServerConfig>(`/api/config`),
  setConfig: (payload: {
    root?: string;
    maxUploadMB?: number;
    allowedTypes?: string;
    theme?: 'light' | 'dark';
  }) =>
    json<{
      ok: true;
      root: string;
      maxUploadMB: number;
      allowedTypes?: string;
      theme: 'light' | 'dark';
    }>(`/api/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  health: () => json<{ ok: boolean; root: string }>('/api/health'),
  list: (path: string) => json<ListResponse>(`/api/fs/list?path=${encodeURIComponent(path)}`),
  stat: (path: string) =>
    json<{ path: string; isDir: boolean; size: number; mtimeMs: number }>(
      `/api/fs/stat?path=${encodeURIComponent(path)}`
    ),
  mkdir: (path: string) =>
    json<{ ok: true; path: string; name: string }>(`/api/fs/mkdir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    }),
  rename: (from: string, to: string) =>
    json<{ ok: true }>(`/api/fs/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to }),
    }),
  delete: (path: string) =>
    json<{ ok: true }>(`/api/fs/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    }),
  upload: async (dirPath: string, files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f, f.name));
    return json<{
      ok: true;
      files: { originalname: string; filename: string; size: number; path: string }[];
    }>(`/api/fs/upload?path=${encodeURIComponent(dirPath)}`, {
      method: 'POST',
      body: fd,
    });
  },
  uploadWithProgress: (
    dirPath: string,
    files: File[],
    onProgress?: (uploaded: number, total: number) => void
  ) =>
    // Backward-compatible wrapper around the cancelable variant
    api.uploadWithProgressCancelable(dirPath, files, onProgress).promise,
  /**
   * Cancelable upload with progress reporting. Returns a pair: { promise, abort }.
   */
  uploadWithProgressCancelable: (
    dirPath: string,
    files: File[],
    onProgress?: (uploaded: number, total: number) => void
  ) => {
    let xhr: XMLHttpRequest | null = null;
    const promise = new Promise<{
      ok: true;
      files: { originalname: string; filename: string; size: number; path: string }[];
    }>((resolve, reject) => {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f, f.name));
      xhr = new XMLHttpRequest();
      xhr.open('POST', `/api/fs/upload?path=${encodeURIComponent(dirPath)}`);
      xhr.responseType = 'json';
      xhr.upload.onprogress = (e) => {
        if (onProgress && e.lengthComputable) onProgress(e.loaded, e.total);
      };
      xhr.onerror = () =>
        reject(
          new ApiError({ code: 'network_error', message: 'Network error during upload', status: 0 })
        );
      xhr.onabort = () =>
        reject(new ApiError({ code: 'aborted', message: 'Upload aborted by user', status: 0 }));
      xhr.onload = () => {
        if (xhr && xhr.status >= 200 && xhr.status < 300) {
          // Some browsers may not fill response when responseType json from node; fallback
          // Avoid accessing responseText when responseType is 'json' (InvalidStateError)
          let data: any = null;
          if (xhr.response !== null && xhr.response !== undefined) {
            data = xhr.response;
          } else if (xhr.responseType === '' || xhr.responseType === 'text') {
            try {
              data = JSON.parse(xhr.responseText || '{}');
            } catch {
              data = {};
            }
          }
          resolve(data as any);
        } else if (xhr) {
          let rawBody: any = null;
          let fallbackText: string | undefined;
          if (xhr.responseType === 'json' && xhr.response) {
            rawBody = xhr.response;
          } else if (typeof xhr.response === 'string' && xhr.response) {
            fallbackText = xhr.response;
            rawBody = parseJsonSafe(xhr.response);
          } else if (xhr.responseType === '' || xhr.responseType === 'text') {
            const txt = xhr.responseText;
            fallbackText = txt || undefined;
            rawBody = parseJsonSafe(txt || null);
          }
          const requestId = xhr.getResponseHeader
            ? xhr.getResponseHeader('X-Request-Id') || undefined
            : undefined;
          reject(createApiError({ status: xhr.status, body: rawBody, fallbackText, requestId }));
        }
      };
      xhr.send(fd);
    });
    const abort = () => {
      try {
        xhr?.abort();
      } catch {
        // ignore
      }
    };
    return { promise, abort } as const;
  },
  downloadUrl: (path: string) => `/api/fs/download?path=${encodeURIComponent(path)}`,
  previewUrl: (path: string) => `/api/fs/preview?path=${encodeURIComponent(path)}`,
  publicFileUrl: async (path: string) => {
    const cfg = await loadConfigCached();
    const base = cfg.mediaDomain
      ? `${window.location.protocol}//${cfg.mediaDomain}`
      : window.location.origin;
    return new URL('/files' + path, base).toString();
  },
};

export type { ListResponse, FsItem };
