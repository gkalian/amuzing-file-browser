// Public files route: serves files under the configured ROOT via pretty URLs like /files/<path>.
// It performs safe path resolution and streams content with proper Content-Type.
import express from 'express';
import fsp from 'fs/promises';
import mime from 'mime-types';
import { safeJoinRoot, toApiPath } from '../paths.js';
import { logAction } from '../log.js';

export function registerFilesRoutes(app: express.Application) {
  // Pretty public file URL: /files/<path within root>
  app.get(/^\/files\/.+$/, async (req, res, next) => {
    try {
      const rel = req.path.slice('/files'.length) || '/';
      const target = safeJoinRoot(rel);
      const st = await fsp.stat(target);
      if (st.isDirectory()) return res.status(403).json({ error: 'Forbidden' });
      const type = mime.lookup(target) || 'application/octet-stream';
      res.setHeader('Content-Type', String(type));
      // Action log (download-like access but via files URL)
      logAction('files_serve', { path: toApiPath(target), bytes: st.size }, { ua: req.get('user-agent') || '' });
      return res.sendFile(target);
    } catch (e) {
      next(e);
    }
  });
}
