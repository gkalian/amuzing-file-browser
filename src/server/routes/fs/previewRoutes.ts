// Preview route for images
import express from 'express';
import fs from 'fs';
import fsp from 'fs/promises';
import mime from 'mime-types';
import { isImageLike } from '../../utils.js';
import { safeJoinRoot, toApiPath } from '../../paths.js';
import { logAction, makeActionMeta } from '../../log.js';
import { httpError } from '../../lib/httpError.js';

export function fsPreviewRoutes(app: express.Application) {
  // Preview: images only
  app.get('/api/fs/preview', async (req, res, next) => {
    try {
      const target = safeJoinRoot(String(req.query.path || '/'));
      const st = await fsp.stat(target);
      if (st.isDirectory()) {
        throw httpError(400, 'invalid_operation', 'Cannot preview a directory');
      }
      const type = mime.lookup(target) || false;
      if (isImageLike(type)) {
        logAction('preview', { path: toApiPath(target), bytes: st.size }, makeActionMeta(req, res));
        res.type((type as string) || 'application/octet-stream');
        fs.createReadStream(target).pipe(res);
      } else {
        throw httpError(415, 'unsupported_type', 'Unsupported preview type');
      }
    } catch (e: any) {
      (e as any).status = (e as any).status || 400;
      next(e);
    }
  });
}
