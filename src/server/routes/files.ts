// Public files route: serves files under the configured ROOT via pretty URLs like /files/<path>.
// It performs safe path resolution and streams content with proper Content-Type.
import express from 'express';
import fsp from 'fs/promises';
import fs from 'fs';
import mime from 'mime-types';
import { safeJoinRoot, toApiPath } from '../paths.js';
import { logAction } from '../log.js';

export function registerFilesRoutes(app: express.Application) {
  // Pretty public file URL: /files/<path within root>
  app.get(/^\/files\/.+$/, async (req, res, next) => {
    try {
      // Use decodeURIComponent to normalize any percent-encoded characters (e.g., spaces as %20)
      // Express req.path may retain percent-encoding when using a regex route, so decode explicitly.
      const relRaw = req.path.slice('/files'.length) || '/';
      const rel = decodeURIComponent(relRaw);
      const target = safeJoinRoot(rel);
      const st = await fsp.stat(target);
      if (st.isDirectory()) return res.status(403).json({ error: 'Forbidden' });

      const type = mime.lookup(target) || 'application/octet-stream';
      res.setHeader('Content-Type', String(type));

      // ETag / Last-Modified
      const mtime = new Date(st.mtimeMs);
      const etag = `W/"${st.size}-${Number(st.mtimeMs).toString(16)}"`;
      res.setHeader('Last-Modified', mtime.toUTCString());
      res.setHeader('ETag', etag);
      res.setHeader('Accept-Ranges', 'bytes');
      // Conservative cache; optionally make configurable later
      res.setHeader('Cache-Control', 'public, max-age=86400');

      const inm = req.headers['if-none-match'];
      const ims = req.headers['if-modified-since'];
      if (
        (typeof inm === 'string' && inm === etag) ||
        (typeof ims === 'string' && new Date(ims).getTime() >= mtime.getTime())
      ) {
        return res.status(304).end();
      }

      // Range / If-Range support
      const rangeHeader = req.headers.range as string | undefined;
      const ifRange = req.headers['if-range'] as string | undefined;

      const shouldIgnoreRange = (() => {
        if (!rangeHeader) return true;
        if (!ifRange) return false; // client didn't send If-Range: proceed with Range
        // If-Range can be ETag or HTTP date; if mismatch, ignore Range and send full content
        // Compare against our current etag or last-modified
        const t = Date.parse(ifRange);
        if (!Number.isNaN(t)) {
          return t < mtime.getTime();
        }
        return ifRange !== etag;
      })();

      if (!shouldIgnoreRange && rangeHeader) {
        const m = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
        if (!m) {
          res.setHeader('Content-Range', `bytes */${st.size}`);
          return res.status(416).end();
        }
        const startStr = m[1];
        const endStr = m[2];
        let start: number;
        let end: number;
        if (startStr === '' && endStr !== '') {
          // suffix range: last N bytes
          const n = Number(endStr);
          if (Number.isNaN(n)) {
            res.setHeader('Content-Range', `bytes */${st.size}`);
            return res.status(416).end();
          }
          start = Math.max(0, st.size - n);
          end = st.size - 1;
        } else {
          start = Number(startStr);
          end = endStr ? Number(endStr) : st.size - 1;
          if (
            Number.isNaN(start) ||
            Number.isNaN(end) ||
            start > end ||
            start < 0 ||
            end >= st.size
          ) {
            res.setHeader('Content-Range', `bytes */${st.size}`);
            return res.status(416).end();
          }
        }

        const chunkSize = end - start + 1;
        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${st.size}`);
        res.setHeader('Content-Length', String(chunkSize));
        // Action log (partial)
        logAction(
          'files_serve',
          { path: toApiPath(target), bytes: chunkSize, range: `${start}-${end}` },
          { ua: req.get('user-agent') || '' }
        );
        return fs.createReadStream(target, { start, end }).pipe(res);
      }

      // Full response
      res.setHeader('Content-Length', String(st.size));
      // Action log (download-like access but via files URL)
      logAction(
        'files_serve',
        { path: toApiPath(target), bytes: st.size },
        { ua: req.get('user-agent') || '' }
      );
      return fs.createReadStream(target).pipe(res);
    } catch (e) {
      next(e);
    }
  });
}
