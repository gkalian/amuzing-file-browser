// Path helpers based on current configured root
import path from 'path';
import { getRoot } from './config.js';
import fs from 'fs';

export function safeJoinRoot(p: string) {
  const ROOT = getRoot();
  // Resolve actual ROOT real path to guard against external symlinks
  const ROOT_REAL = fs.realpathSync(ROOT);
  const rel = String(p || '/').replaceAll('\\', '/');
  const combined = path.resolve(ROOT_REAL, '.' + (rel.startsWith('/') ? rel : '/' + rel));

  try {
    // If the target exists, verify its realpath is inside ROOT
    const real = fs.realpathSync(combined);
    const inside = path.relative(ROOT_REAL, real);
    if (inside.startsWith('..') || path.isAbsolute(inside)) {
      const err = new Error('Path traversal detected');
      (err as any).status = 403;
      (err as any).appCode = 'forbidden';
      throw err;
    }
    return real;
  } catch (e: any) {
    if (e && e.code === 'ENOENT') {
      // Target may not exist yet (e.g., upload or new file). Validate parent dir.
      const parent = path.dirname(combined);
      const base = path.basename(combined);
      const parentReal = fs.realpathSync(parent);
      const inside = path.relative(ROOT_REAL, parentReal);
      if (inside.startsWith('..') || path.isAbsolute(inside)) {
        const err = new Error('Path traversal detected');
        (err as any).status = 403;
        (err as any).appCode = 'forbidden';
        throw err;
      }
      return path.join(parentReal, base);
    }
    throw e;
  }
}

export function toApiPath(abs: string) {
  const ROOT = getRoot();
  const rel = path.relative(ROOT, abs).split(path.sep).join('/');
  return '/' + rel.replace(/^\/+/, '');
}

// Variant of safeJoinRoot that does NOT resolve the leaf with realpath.
// Useful for operations on the symlink itself (e.g., unlink), while still
// guaranteeing the parent directory is inside ROOT.
export function safeJoinRootNoFollow(p: string) {
  const ROOT = getRoot();
  const ROOT_REAL = fs.realpathSync(ROOT);
  const rel = String(p || '/').replaceAll('\\', '/');
  const combined = path.resolve(ROOT_REAL, '.' + (rel.startsWith('/') ? rel : '/' + rel));

  // Validate parent directory is inside ROOT, but do not resolve the leaf.
  const parent = path.dirname(combined);
  const base = path.basename(combined);
  const parentReal = fs.realpathSync(parent);
  const inside = path.relative(ROOT_REAL, parentReal);
  if (inside.startsWith('..') || path.isAbsolute(inside)) {
    const err = new Error('Path traversal detected');
    (err as any).status = 403;
    (err as any).appCode = 'forbidden';
    throw err;
  }
  return path.join(parentReal, base);
}
