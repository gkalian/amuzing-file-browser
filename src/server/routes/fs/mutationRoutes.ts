// Mutation routes: mkdir, rename, delete
import express from 'express';
import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import { safeJoinRoot, safeJoinRootNoFollow, toApiPath } from '../../paths.js';
import { getRoot } from '../../config.js';
import { logAction, makeActionMeta } from '../../log.js';

export function fsMutationRoutes(app: express.Application) {
  // Mkdir
  app.post('/api/fs/mkdir', async (req, res, next) => {
    try {
      const { path: p } = req.body as { path: string };
      const target0 = safeJoinRoot(p);
      const parent = path.dirname(target0);
      const desired = path.basename(target0);

      // If directory exists, find a unique variant: "name (2)", "name (3)", ...
      let finalName = desired;
      let target = target0;
      if (fs.existsSync(target0)) {
        const m = desired.match(/^(.*?)(?: \((\d+)\))?$/);
        const base = m ? m[1] : desired;
        let i = (m && m[2] ? Number(m[2]) + 1 : 2) as number;
        for (;;) {
          const cand = `${base} (${i})`;
          const abs = path.join(parent, cand);
          if (!fs.existsSync(abs)) {
            finalName = cand;
            target = abs;
            break;
          }
          i += 1;
        }
      }

      await fsp.mkdir(target, { recursive: false });
      const apiPath = toApiPath(target);
      // Action log
      logAction('mkdir', { path: apiPath, name: finalName }, makeActionMeta(req, res));
      res.json({ ok: true, path: apiPath, name: finalName });
    } catch (e: any) {
      (e as any).status = (e as any).status || 400;
      next(e);
    }
  });

  // Rename/Move
  app.post('/api/fs/rename', async (req, res, next) => {
    try {
      const { from, to } = req.body as { from: string; to: string };
      const src = safeJoinRoot(from);
      const dst = safeJoinRoot(to);
      // Protect root: forbid renaming the root or renaming anything to the root path
      const ROOT_REAL = fs.realpathSync(getRoot());
      if (src === ROOT_REAL || toApiPath(src) === '/') {
        const err = new Error('Renaming root is forbidden');
        (err as any).status = 403;
        (err as any).appCode = 'forbidden_root_operation';
        throw err;
      }
      if (dst === ROOT_REAL || toApiPath(dst) === '/') {
        const err = new Error('Invalid rename target: root');
        (err as any).status = 400;
        (err as any).appCode = 'invalid_operation';
        throw err;
      }
      await fsp.rename(src, dst);
      // Action log
      logAction('rename', { from: toApiPath(src), to: toApiPath(dst) }, makeActionMeta(req, res));
      res.json({ ok: true });
    } catch (e: any) {
      (e as any).status = (e as any).status || 400;
      next(e);
    }
  });

  // Delete (file or directory)
  app.post('/api/fs/delete', async (req, res, next) => {
    try {
      const { path: p } = req.body as { path: string };
      // Use no-follow to operate on the link itself if it is a symlink
      const target = safeJoinRootNoFollow(p);
      // Protect root: forbid deleting the root directory
      const ROOT_REAL = fs.realpathSync(getRoot());
      if (target === ROOT_REAL || toApiPath(target) === '/') {
        const err = new Error('Deleting root is forbidden');
        (err as any).status = 403;
        (err as any).appCode = 'forbidden_root_operation';
        throw err;
      }
      const st = await fsp.lstat(target);
      if (st.isSymbolicLink()) {
        await fsp.unlink(target);
      } else if (st.isDirectory()) {
        await fsp.rm(target, { recursive: true, force: true });
      } else {
        await fsp.unlink(target);
      }
      // Action log
      logAction(
        'delete',
        { path: toApiPath(target), targetType: st.isDirectory() ? 'directory' : 'file' },
        makeActionMeta(req, res)
      );
      res.json({ ok: true });
    } catch (e: any) {
      (e as any).status = (e as any).status || 400;
      next(e);
    }
  });
}
