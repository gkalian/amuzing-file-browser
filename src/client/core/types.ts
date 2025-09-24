// Shared type definitions for filesystem items and API responses
export type FsItem = {
  name: string;
  path: string; // api-style path starting with '/'
  isDir: boolean;
  size: number;
  mtimeMs: number;
  mime: string | null;
  // Optional flags provided by the server for symlink handling
  isSymlink?: boolean;
  isBroken?: boolean;
  isUnsafe?: boolean; // symlink pointing outside ROOT
};

export type ListResponse = { path: string; items: FsItem[] };
