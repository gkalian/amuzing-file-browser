import express from 'express';
import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import mime from 'mime-types';
import { isTextLike, isImageLike } from '../utils.js';
import { safeJoinRoot, toApiPath } from '../paths.js';
import { getIgnoreNames } from '../config.js';
import { logAction } from '../log.js';

export function registerFsRoutes(app: express.Application) {
  // Pretty public file URL: /files/<path within root>
  app.get(/^\/files\/.+$/, async (req, res) => {
    try {
      const rel = req.path.slice('/files'.length) || '/';
      const target = safeJoinRoot(rel);
      const st = await fsp.stat(target);
      if (st.isDirectory()) return res.status(400).json({ error: 'Path is a directory' });
      const type = mime.lookup(target) || 'application/octet-stream';
      res.setHeader('Content-Type', String(type));
      return res.sendFile(target);
    } catch (e: any) {
      return res.status(404).json({ error: e.message });
    }
  });

  // List directory
  app.get('/api/fs/list', async (req, res) => {
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
      res.status(400).json({ error: e.message });
    }
  });

  // Stat
  app.get('/api/fs/stat', async (req, res) => {
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
      res.status(400).json({ error: e.message });
    }
  });

  // Download
  app.get('/api/fs/download', async (req, res) => {
    try {
      const target = safeJoinRoot(String(req.query.path || '/'));
      const st = await fsp.stat(target);
      if (st.isDirectory())
        return res.status(400).json({ error: 'Download for directories is not supported' });
      // Action log: download
      logAction('download', { path: toApiPath(target), bytes: st.size }, { ua: req.get('user-agent') || '' });
      res.download(target);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Preview (text/image including webp)
  app.get('/api/fs/preview', async (req, res) => {
    try {
      const target = safeJoinRoot(String(req.query.path || '/'));
      const st = await fsp.stat(target);
      if (st.isDirectory()) return res.status(400).json({ error: 'Cannot preview a directory' });
      const type = mime.lookup(target) || false;
      if (isTextLike(type)) {
        const content = await fsp.readFile(target, 'utf8');
        // Action log: preview (text)
        logAction('preview', { path: toApiPath(target), bytes: st.size }, { ua: req.get('user-agent') || '' });
        res.type((type as string) || 'text/plain').send(content);
      } else if (isImageLike(type)) {
        // Action log: preview (image)
        logAction('preview', { path: toApiPath(target), bytes: st.size }, { ua: req.get('user-agent') || '' });
        res.type((type as string) || 'application/octet-stream');
        fs.createReadStream(target).pipe(res);
      } else {
        res.status(415).json({ error: 'Unsupported preview type' });
      }
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Mkdir
  app.post('/api/fs/mkdir', async (req, res) => {
    try {
      const { path: p } = req.body as { path: string };
      const target = safeJoinRoot(p);
      await fsp.mkdir(target, { recursive: true });
      const apiPath = toApiPath(target);
      // Action log
      logAction('mkdir', { path: apiPath }, { ua: req.get('user-agent') || '' });
      res.json({ ok: true, path: apiPath });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Rename/Move
  app.post('/api/fs/rename', async (req, res) => {
    try {
      const { from, to } = req.body as { from: string; to: string };
      const src = safeJoinRoot(from);
      const dst = safeJoinRoot(to);
      await fsp.rename(src, dst);
      // Action log
      logAction('rename', { from: toApiPath(src), to: toApiPath(dst) }, { ua: req.get('user-agent') || '' });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Delete (file or directory)
  app.post('/api/fs/delete', async (req, res) => {
    try {
      const { path: p } = req.body as { path: string };
      const target = safeJoinRoot(p);
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
      res.status(400).json({ error: e.message });
    }
  });

  // Write text file
  app.put('/api/fs/write', async (req, res) => {
    try {
      const { path: p, content } = req.body as { path: string; content: string };
      const target = safeJoinRoot(p);
      await fsp.writeFile(target, content, 'utf8');
      // Action log
      logAction('write', { path: toApiPath(target), bytes: Buffer.byteLength(content, 'utf8') }, { ua: req.get('user-agent') || '' });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });
}
