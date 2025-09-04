// Path helpers based on current configured root
import path from 'path';
import { getRoot } from './config.js';

export function safeJoinRoot(p: string) {
  const ROOT = getRoot();
  const rel = p.replaceAll('\\', '/');
  const target = path.resolve(ROOT, '.' + (rel.startsWith('/') ? rel : '/' + rel));
  const inside = path.relative(ROOT, target);
  
  if (inside.startsWith('..') || path.isAbsolute(inside)) {
    throw new Error('Path traversal detected');
  }
  return target;
}

export function toApiPath(abs: string) {
  const ROOT = getRoot();
  const rel = path.relative(ROOT, abs).split(path.sep).join('/');
  return '/' + rel.replace(/^\/+/, '');
}
