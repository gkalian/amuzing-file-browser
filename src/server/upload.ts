// Upload helpers: configures Multer storage under the current ROOT and
// provides a lightweight preflight that rejects oversized uploads based on Content-Length.
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import express from 'express';
import { getMaxUploadMB, getAllowedTypes } from './config.js';
import { safeJoinRoot } from './paths.js';

// Generate a unique filename in dir by appending " (2)", "(3)", ... before extension
function resolveUniqueName(dir: string, original: string): string {
  const originalPath = path.join(dir, original);
  if (!fs.existsSync(originalPath)) return original;

  const parsed = path.parse(original); // { name, ext }
  // Detect existing suffix " (n)" and increment from there
  const m = parsed.name.match(/^(.*?)(?: \((\d+)\))?$/);
  const base = m ? m[1] : parsed.name;
  const start = m && m[2] ? Number(m[2]) + 1 : 2;

  let i = start;
  // Try base (i).ext until free
  // Note: ext already contains leading dot (or empty string)
  // Handle files without extension and dotfiles as-is
  // Examples: "file.txt" -> "file (2).txt"; ".env" -> ".env (2)"
  for (;;) {
    const candidate = `${base} (${i})${parsed.ext}`;
    if (!fs.existsSync(path.join(dir, candidate))) return candidate;
    i += 1;
  }
}

// Multer storage within ROOT
export function createMulter() {
  const storage = multer.diskStorage({
    destination: (req, _file, cb) => {
      try {
        // Resolve target directory safely within ROOT (defaults to '/')
        const dest = safeJoinRoot(String((req as any).query.path || '/'));
        fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
      } catch (e) {
        cb(e as Error, '');
      }
    },
    filename: (req, file, cb) => {
      try {
        const dest = safeJoinRoot(String((req as any).query.path || '/'));
        const name = resolveUniqueName(dest, file.originalname);
        cb(null, name);
      } catch (e) {
        cb(e as Error, file.originalname);
      }
    },
  });

  const fileFilter = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    try {
      const allowed = String(getAllowedTypes() || '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      if (allowed.length === 0) return cb(null, true);
      const name = file.originalname || '';
      const dot = name.lastIndexOf('.');
      const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
      if (allowed.includes(ext)) return cb(null, true);
      return cb(new Error(`Not allowed format: ${name}`));
    } catch (e) {
      return cb(e as Error);
    }
  };
  return multer({ storage, fileFilter });
}

// Pre-check content-length against dynamic limit
export function preUploadLimitCheck(): express.RequestHandler {
  return (req, res, next) => {
    const len = Number(req.headers['content-length'] || '0');
    const limit = getMaxUploadMB() * 1024 * 1024;
    // Fast reject when declared payload exceeds configured limit
    if (len && len > limit) {
      return res.status(413).json({ error: `Payload too large. Limit is ${getMaxUploadMB()}MB` });
    }
    next();
  };
}
