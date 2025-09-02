// Thin client for talking to the backend API (config, fs ops, upload, preview/download)
import type { ListResponse, FsItem } from '../core/types';

async function json<T>(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init);
  if (!res.ok) {
    // Try to parse structured error first
    try {
      const data = await res.json();
      const msg = (data && (data.error || data.message)) as string | undefined;
      if (msg) throw new Error(msg);
    } catch {
      // Fallback to raw text
      const txt = await res.text();
      throw new Error(txt || `HTTP ${res.status}`);
    }
  }
  return (await res.json()) as T;
}

export const api = {
  getConfig: () =>
    json<{
      root: string;
      maxUploadMB: number;
      allowedTypes?: string;
      ignoreNames?: string[];
      theme: 'light' | 'dark';
    }>(`/api/config`),
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
  write: (path: string, content: string) =>
    json<{ ok: true }>(`/api/fs/write`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content }),
    }),
  upload: async (dirPath: string, files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f, f.name));
    const res = await fetch(`/api/fs/upload?path=${encodeURIComponent(dirPath)}`, {
      method: 'POST',
      body: fd,
    });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as {
      ok: true;
      files: { originalname: string; filename: string; size: number; path: string }[];
    };
  },
  uploadWithProgress: (
    dirPath: string,
    files: File[],
    onProgress?: (uploaded: number, total: number) => void
  ) =>
    new Promise<{
      ok: true;
      files: { originalname: string; filename: string; size: number; path: string }[];
    }>((resolve, reject) => {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f, f.name));
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `/api/fs/upload?path=${encodeURIComponent(dirPath)}`);
      xhr.responseType = 'json';
      xhr.upload.onprogress = (e) => {
        if (onProgress && e.lengthComputable) onProgress(e.loaded, e.total);
      };
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
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
        } else {
          // Build a meaningful error message without violating responseType constraints
          let msg = `Upload failed: ${xhr.status}`;
          try {
            if (xhr.responseType === 'json' && xhr.response) {
              const r: any = xhr.response as any;
              msg = (r && (r.error || r.message)) || msg;
            } else if (xhr.responseType === '' || xhr.responseType === 'text') {
              msg = xhr.responseText || msg;
            }
          } catch {
            // Ignore parsing/access errors and use default msg
          }
          reject(new Error(msg));
        }
      };
      xhr.send(fd);
    }),
  downloadUrl: (path: string) => `/api/fs/download?path=${encodeURIComponent(path)}`,
  previewUrl: (path: string) => `/api/fs/preview?path=${encodeURIComponent(path)}`,
};

export type { ListResponse, FsItem };
