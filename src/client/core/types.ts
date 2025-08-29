// Shared type definitions for filesystem items and API responses
export type FsItem = {
  name: string;
  path: string; // api-style path starting with '/'
  isDir: boolean;
  size: number;
  mtimeMs: number;
  mime: string | null;
};

export type ListResponse = { path: string; items: FsItem[] };
