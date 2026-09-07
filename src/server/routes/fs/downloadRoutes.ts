// Download route
import express from 'express';
import fsp from 'fs/promises';
import { safeJoinRoot, toApiPath } from '../../paths.js';
import { logAction, makeActionMeta } from '../../log.js';
import { httpError, withDefaultStatus } from '../../lib/httpError.js';

export function registerFsDownloadRoutes(app: express.Application) {
  // Download
  app.get('/api/fs/download', async (req, res, next) => {
    try {
      const target = safeJoinRoot(String(req.query.path || '/'));
      const st = await fsp.stat(target);
      if (st.isDirectory()) {
        throw httpError(400, 'not_supported', 'Download for directories is not supported');
      }
      // Action log: download
      logAction('download', { path: toApiPath(target), bytes: st.size }, makeActionMeta(req, res));
      res.download(target);
    } catch (e) {
      next(withDefaultStatus(e, 400));
    }
  });
}
