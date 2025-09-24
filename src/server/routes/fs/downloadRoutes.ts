// Download route
import express from 'express';
import fsp from 'fs/promises';
import { safeJoinRoot, toApiPath } from '../../paths.js';
import { logAction } from '../../log.js';

export function fsDownloadRoutes(app: express.Application) {
  // Download
  app.get('/api/fs/download', async (req, res, next) => {
    try {
      const target = safeJoinRoot(String(req.query.path || '/'));
      const st = await fsp.stat(target);
      if (st.isDirectory()) {
        const err = new Error('Download for directories is not supported');
        (err as any).status = 400;
        (err as any).appCode = 'not_supported';
        throw err;
      }
      // Action log: download
      logAction(
        'download',
        { path: toApiPath(target), bytes: st.size },
        {
          ua: req.get('user-agent') || '',
          ip: req.ip,
          xff: (req.headers['x-forwarded-for'] as string) || '',
          host: (req.headers['x-forwarded-host'] as string) || (req.headers['host'] as string) || '',
          requestId: (res.locals as any)?.requestId,
        }
      );
      res.download(target);
    } catch (e: any) {
      (e as any).status = (e as any).status || 400;
      next(e);
    }
  });
}
