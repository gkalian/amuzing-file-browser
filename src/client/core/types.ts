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

// Minimal i18next-style translate function accepted by hooks that only need
// a defaultValue and simple string/number interpolation values.
export type TranslateOptions = { defaultValue?: string } & Record<string, string | number>;
export type TranslateFn = (key: string, opts?: TranslateOptions) => string;
