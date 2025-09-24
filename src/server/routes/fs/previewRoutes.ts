// Preview route for images
import express from 'express';
import fs from 'fs';
import fsp from 'fs/promises';
import mime from 'mime-types';
import { isImageLike } from '../../utils.js';
import { safeJoinRoot, toApiPath } from '../../paths.js';
import { logAction, makeActionMeta } from '../../log.js';

export function fsPreviewRoutes(app: express.Application) {
  // Preview: images only
  app.get('/api/fs/preview', async (req, res, next) => {
    try {
      const target = safeJoinRoot(String(req.query.path || '/'));
      const st = await fsp.stat(target);
      if (st.isDirectory()) {
        const err = new Error('Cannot preview a directory');
        (err as any).status = 400;
        (err as any).appCode = 'invalid_operation';
        throw err;
      }
      const type = mime.lookup(target) || false;
      if (isImageLike(type)) {
        logAction('preview', { path: toApiPath(target), bytes: st.size }, makeActionMeta(req, res));
        res.type((type as string) || 'application/octet-stream');
        fs.createReadStream(target).pipe(res);
      } else {
        const err = new Error('Unsupported preview type');
        (err as any).status = 415;
        (err as any).appCode = 'unsupported_type';
        throw err;
      }
    } catch (e: any) {
      (e as any).status = (e as any).status || 400;
      next(e);
    }
  });
}
