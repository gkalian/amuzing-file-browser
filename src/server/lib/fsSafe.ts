// Filesystem safety helpers: allowed-types check, path validation, and symlink protection.
// Exposes utilities for safe file operations and path validation.

import * as path from 'path';
import * as fsp from 'fs/promises';

/**
 * Check if a filename matches one of the allowed extensions.
 * @param filename original filename (may include extension)
 * @param allowed list of allowed extensions, either as comma-separated string or array of strings
 */
export function isAllowedType(filename: string, allowed: string | string[] | undefined): boolean {
  const list = (Array.isArray(allowed) ? allowed : String(allowed || '').split(','))
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (list.length === 0) return true; // empty list means allow all
  const name = filename || '';
  const dot = name.lastIndexOf('.');
  const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
  return list.includes(ext);
}

/**
 * Sanitize a filename to be safe for saving on the server filesystem.
 * - Normalizes Unicode (NFKC)
 * - Removes path separators and control characters
 * - Replaces reserved characters with '_'
 * - Collapses whitespace and dots
 * - Prevents dot-only or empty names
 * - Limits total length while preserving extension when possible
 */
export function sanitizeFilename(input: string): string {
  const MAX_LEN = 120;
  const normalized = String(input || '')
    .normalize('NFKC')
    .trim();

  // Remove any path components; we only want a base name
  const justName = normalized.split(/[\\/]+/).pop() || '';

  // Split extension at last dot (but ignore dotfiles like ".env" as having no ext)
  const lastDot = justName.lastIndexOf('.');
  const hasExt = lastDot > 0 && lastDot < justName.length - 1;
  let base = hasExt ? justName.slice(0, lastDot) : justName;
  let ext = hasExt ? justName.slice(lastDot + 1) : '';

  // Character-wise transform to avoid control-character regex (eslint no-control-regex)
  // - Control chars and path separators are dropped
  // - Windows-reserved characters are replaced with '_'
  const RESERVED_SET = new Set([...'<>:"|?*']);
  const transformChar = (ch: string) => {
    const code = ch.charCodeAt(0);
    if (code < 32 || code === 127) return '';
    if (ch === '/' || ch === '\\') return '';
    if (RESERVED_SET.has(ch)) return '_';
    return ch;
  };
  const clean = (s: string) =>
    Array.from(s)
      .map((ch) => transformChar(ch))
      .join('')
      .replace(/_+/g, '_')
      .replace(/\s+/g, ' ')
      .replace(/^\s+|\s+$/g, '')
      .replace(/\.+$/g, '')
      .replace(/^\.+/g, '')
      .trim();

  base = clean(base);
  ext = clean(ext);

  // Disallow special names and empties
  if (!base || base === '.' || base === '..') base = 'unnamed';

  // Rebuild name, enforce length limit (preserve extension if possible)
  let candidate = ext ? `${base}.${ext}` : base;
  if (candidate.length > MAX_LEN) {
    if (ext && ext.length < MAX_LEN - 1) {
      const keep = MAX_LEN - (ext.length + 1);
      base = base.slice(0, Math.max(1, keep));
      candidate = `${base}.${ext}`;
    } else {
      candidate = candidate.slice(0, MAX_LEN);
    }
  }

  return candidate;
}

/**
 * Check if a path is a symlink and resolve it to its real path if it is.
 * @param path The path to check
 * @returns Object with { isSymlink: boolean, realPath: string }
 */
export async function resolveSymlinkSafe(
  path: string
): Promise<{ isSymlink: boolean; realPath: string; isBroken: boolean }> {
  try {
    const stats = await fsp.lstat(path);
    if (stats.isSymbolicLink()) {
      try {
        const realPath = await fsp.realpath(path);
        return { isSymlink: true, realPath, isBroken: false };
      } catch (err: unknown) {
        // Broken symlink: report as symlink but mark broken, keep original path as fallback realPath
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.warn(`Broken symlink ${path}: ${errorMessage}`);
        return { isSymlink: true, realPath: path, isBroken: true };
      }
    }
    return { isSymlink: false, realPath: path, isBroken: false };
  } catch (error: unknown) {
    // If there's an error (e.g., broken symlink), treat it as a non-symlink
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Error resolving symlink ${path}: ${errorMessage}`);
    return { isSymlink: false, realPath: path, isBroken: false };
  }
}

/**
 * Check if a path is within the allowed root directory
 * @param filePath The path to check
 * @param root The root directory
 * @returns boolean indicating if the path is safe
 */
export function isPathSafe(filePath: string, root: string): boolean {
  // Resolve both paths to handle relative paths and normalize them
  const resolvedPath = path.resolve(filePath);
  const resolvedRoot = path.resolve(root);

  // Check if the resolved path starts with the root path
  return resolvedPath.startsWith(resolvedRoot + path.sep) || resolvedPath === resolvedRoot;
}
