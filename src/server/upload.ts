import fs from 'fs';
import path from 'path';
import multer from 'multer';
import express from 'express';
import { getMaxUploadMB } from './config.js';
import { safeJoinRoot } from './paths.js';

// Multer storage within ROOT
export function createMulter() {
  const storage = multer.diskStorage({
    destination: (req, _file, cb) => {
      try {
        const dest = safeJoinRoot(String((req as any).query.path || '/'));
        fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
      } catch (e) {
        cb(e as Error, '');
      }
    },
    filename: (_req, file, cb) => cb(null, file.originalname),
  });
  return multer({ storage });
}

// Pre-check content-length against dynamic limit
export function preUploadLimitCheck(): express.RequestHandler {
  return (req, res, next) => {
    const len = Number(req.headers['content-length'] || '0');
    const limit = getMaxUploadMB() * 1024 * 1024;
    if (len && len > limit) {
      return res.status(413).json({ error: `Payload too large. Limit is ${getMaxUploadMB()}MB` });
    }
    next();
  };
}
