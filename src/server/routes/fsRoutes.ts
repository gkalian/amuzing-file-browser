// File-system routes: list/stat/preview/download and basic mutations (mkdir/rename/delete/write).
// Uses safeJoinRoot/toApiPath to sandbox operations under ROOT and mime-based preview for text/images.
import express from 'express';
import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import mime from 'mime-types';
import { isTextLike, isImageLike } from '../utils.js';
import { safeJoinRoot, toApiPath } from '../paths.js';
import { getIgnoreNames, getRoot } from '../config.js';
import { logAction } from '../log.js';

export function registerFsRoutes(app: express.Application) {
  // List directory
  app.get('/api/fs/list', async (req, res, next) => {
    try {
      const target = safeJoinRoot(String(req.query.path || '/'));
      const entries = await fsp.readdir(target, { withFileTypes: true });
      const ignore = getIgnoreNames();
      const visible = entries.filter((ent) => !ignore.includes(ent.name));
      const list = await Promise.all(
        visible.map(async (ent) => {
          const abs = path.join(target, ent.name);
          const st = await fsp.stat(abs);
          const mimeType = ent.isFile() ? mime.lookup(ent.name) || false : false;
          return {
            name: ent.name,
            path: toApiPath(abs),
            isDir: ent.isDirectory(),
            size: st.size,
            mtimeMs: st.mtimeMs,
            mime: mimeType || null,
          };
        })
      );
      res.json({ path: toApiPath(target), items: list });
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
        { ua: req.get('user-agent') || '' }
      );
      res.download(target);
    } catch (e: any) {
      (e as any).status = (e as any).status || 400;
      next(e);
    }
  });

  // Preview (text/image including webp)
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
      const type = mime.lookup(target) || false; // Determine mime to decide text vs binary handling
      if (isTextLike(type)) {
        const content = await fsp.readFile(target, 'utf8');
        // Action log: preview (text)
        logAction(
          'preview',
          { path: toApiPath(target), bytes: st.size },
          { ua: req.get('user-agent') || '' }
        );
        res.type((type as string) || 'text/plain').send(content);
      } else if (isImageLike(type)) {
        // Stream images directly to the client
        logAction(
          'preview',
          { path: toApiPath(target), bytes: st.size },
          { ua: req.get('user-agent') || '' }
        );
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
        let i = m && m[2] ? Number(m[2]) + 1 : 2;
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
      logAction('mkdir', { path: apiPath, name: finalName }, { ua: req.get('user-agent') || '' });
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
      logAction(
        'rename',
        { from: toApiPath(src), to: toApiPath(dst) },
        { ua: req.get('user-agent') || '' }
      );
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
      const target = safeJoinRoot(p);
      // Protect root: forbid deleting the root directory
      const ROOT_REAL = fs.realpathSync(getRoot());
      if (target === ROOT_REAL || toApiPath(target) === '/') {
        const err = new Error('Deleting root is forbidden');
        (err as any).status = 403;
        (err as any).appCode = 'forbidden_root_operation';
        throw err;
      }
      const st = await fsp.stat(target);
      if (st.isDirectory()) {
        await fsp.rm(target, { recursive: true, force: true });
      } else {
        await fsp.unlink(target);
      }
      // Action log
      logAction(
        'delete',
        { path: toApiPath(target), targetType: st.isDirectory() ? 'directory' : 'file' },
        { ua: req.get('user-agent') || '' }
      );
      res.json({ ok: true });
    } catch (e: any) {
      (e as any).status = (e as any).status || 400;
      next(e);
    }
  });

  // Write text file
  app.put('/api/fs/write', async (req, res, next) => {
    try {
      const { path: p, content } = req.body as { path: string; content: string };
      const target = safeJoinRoot(p);
      await fsp.writeFile(target, content, 'utf8');
      // Action log
      logAction(
        'write',
        { path: toApiPath(target), bytes: Buffer.byteLength(content, 'utf8') },
        { ua: req.get('user-agent') || '' }
      );
      res.json({ ok: true });
    } catch (e: any) {
      (e as any).status = (e as any).status || 400;
      next(e);
    }
  });
}
