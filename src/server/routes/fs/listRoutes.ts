// List and Stat routes for filesystem API
import express from 'express';
import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import mime from 'mime-types';
import { safeJoinRoot, toApiPath } from '../../paths.js';
import { getIgnoreNames, getRoot } from '../../config.js';
import { resolveSymlinkSafe, isPathSafe } from '../../lib/fsSafe.js';

export function fsListRoutes(app: express.Application) {
  // List directory (with pagination and sorting)
  app.get('/api/fs/list', async (req, res, next) => {
    try {
      const target = safeJoinRoot(String(req.query.path || '/'));

      // Pagination and sorting parameters
      const pageRaw = String(req.query.page ?? '1');
      const limitRaw = String(req.query.limit ?? '100');
      const sortRaw = String(req.query.sort ?? 'name');
      const orderRaw = String(req.query.order ?? 'asc');

      const pageNum = Math.max(1, Math.floor(Number(pageRaw)) || 1);
      const limitNum = Math.min(1000, Math.max(1, Math.floor(Number(limitRaw)) || 100));
      const sortKey = ['name', 'mtime', 'size'].includes(sortRaw)
        ? (sortRaw as 'name' | 'mtime' | 'size')
        : 'name';
      const order = orderRaw === 'desc' ? 'desc' : 'asc';

      const entries = await fsp.readdir(target, { withFileTypes: true });
      const ignore = getIgnoreNames();
      const visible = entries.filter((ent) => !ignore.includes(ent.name));

      // Collect metadata for visible items
      const allItems = await Promise.all(
        visible.map(async (ent) => {
          const abs = path.join(target, ent.name);

          // Check if the path is a symlink and resolve it
          const { isSymlink, realPath, isBroken } = await resolveSymlinkSafe(abs);

          // If symlink is broken or points outside ROOT, return minimal metadata
          if (isSymlink && (isBroken || !isPathSafe(realPath, getRoot()))) {
            // Return minimal info for unsafe symlinks
            return {
              name: ent.name,
              path: toApiPath(abs),
              isDir: false,
              isSymlink: true,
              isBroken: Boolean(isBroken),
              isUnsafe: true,
              size: 0,
              mtimeMs: 0,
              mime: null,
            };
          }

          // For safe paths or non-symlinks, get full stats (based on resolved target)
          let st: fs.Stats;
          try {
            st = await fsp.stat(isSymlink ? realPath : abs);
          } catch {
            // In case of race condition (deleted after readdir), return minimal
            return {
              name: ent.name,
              path: toApiPath(abs),
              isDir: false,
              isSymlink: Boolean(isSymlink),
              isBroken: true,
              isUnsafe: false,
              size: 0,
              mtimeMs: 0,
              mime: null,
            };
          }
          const isDir = st.isDirectory();
          const mimeType = !isDir ? mime.lookup(ent.name) || false : false;

          return {
            name: ent.name,
            path: toApiPath(abs),
            isDir,
            isSymlink,
            isBroken: false,
            isUnsafe: false,
            size: st.size,
            mtimeMs: st.mtimeMs,
            mime: mimeType || null,
          };
        })
      );

      // Sorting
      const dirFirst = (a: any, b: any) => (a.isDir === b.isDir ? 0 : a.isDir ? -1 : 1);
      allItems.sort((a, b) => {
        // Directories first (UX standard), then sort by key
        const dirCmp = dirFirst(a, b);
        if (dirCmp !== 0) return dirCmp;
        switch (sortKey) {
          case 'mtime': {
            const cmp = a.mtimeMs - b.mtimeMs;
            return order === 'asc' ? cmp : -cmp;
          }
          case 'size': {
            const cmp = a.size - b.size;
            return order === 'asc' ? cmp : -cmp;
          }
          case 'name':
          default: {
            const cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
            return order === 'asc' ? cmp : -cmp;
          }
        }
      });

      // Pagination
      const total = allItems.length;
      const start = (pageNum - 1) * limitNum;
      const end = Math.min(start + limitNum, total);
      const pageItems = start < total ? allItems.slice(start, end) : [];
      const hasMore = end < total;

      res.json({
        path: toApiPath(target),
        items: pageItems,
        page: pageNum,
        limit: limitNum,
        total,
        hasMore,
        sort: sortKey,
        order,
      });
    } catch (e: any) {
      (e as any).status = (e as any).status || 400;
      next(e);
    }
  });

  // Stat
  app.get('/api/fs/stat', async (req, res, next) => {
    try {
      const target = safeJoinRoot(String(req.query.path || '/'));
      const st = await fsp.stat(target);
      res.json({
        path: toApiPath(target),
        isDir: st.isDirectory(),
        size: st.size,
        mtimeMs: st.mtimeMs,
      });
    } catch (e: any) {
      (e as any).status = (e as any).status || 400;
      next(e);
    }
  });
}
