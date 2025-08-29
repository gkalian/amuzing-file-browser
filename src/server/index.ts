// Express server entry: provides config endpoints and filesystem API (list/stat/preview/upload/download)
import express from 'express';
import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import multer from 'multer';
import mime from 'mime-types';
import { isTextLike, isImageLike } from './utils.js';

// Config
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
let ROOT = path.resolve(process.env.FILEBROWSER_ROOT || path.join(process.cwd(), 'data'));
let MAX_UPLOAD_MB = process.env.FILEBROWSER_MAX_UPLOAD_MB
  ? Number(process.env.FILEBROWSER_MAX_UPLOAD_MB)
  : 50;
let ALLOWED_TYPES: string | undefined = undefined;
const DEFAULT_ALLOWED = 'jpg, jpeg, gif, png, webp, 7z, zip';
// Server-side ignore list for directory listings
let IGNORED_NAMES: string[] = ['.settings.json'];

const app = express();
app.use(express.json({ limit: '5mb' }));

// Simple request logger: prints JSON to stdout (good for kubectl logs)
app.use((req, res, next) => {
  const start = Date.now();
  const { method } = req;
  const url = (req as any).originalUrl || req.url;
  const ua = req.get('user-agent') || '';
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const status = res.statusCode;
    const length = res.getHeader('content-length') || '-';
    // Structured line for easy parsing in log systems
    console.log(
      JSON.stringify({
        time: new Date().toISOString(),
        level: 'info',
        method,
        url,
        status,
        durationMs,
        length,
        ua,
      })
    );
  });
  next();
});

// Ensure root exists
fs.mkdirSync(ROOT, { recursive: true });

// Global error logging (unhandled errors)
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

// Settings helpers (.settings.json under ROOT)
function settingsPath(dir: string) {
  return path.join(dir, '.settings.json');
}

async function loadSettings(dir: string) {
  try {
    const p = settingsPath(dir);
    const exists = fs.existsSync(p);
    if (!exists) return null;
    const txt = await fsp.readFile(p, 'utf8');
    const data = JSON.parse(txt) as {
      root?: string;
      maxUploadMB?: number;
      allowedTypes?: string;
      ignoreNames?: string[];
    } | null;
    return data || null;
  } catch {
    return null;
  }
}

async function saveSettings(dir: string, data: { root: string; maxUploadMB: number; allowedTypes?: string; ignoreNames?: string[] }) {
  try {
    const p = settingsPath(dir);
    const doc = JSON.stringify(
      {
        root: data.root,
        maxUploadMB: data.maxUploadMB,
        allowedTypes: data.allowedTypes,
        ignoreNames: data.ignoreNames,
      },
      null,
      2
    );
    await fsp.writeFile(p, doc, 'utf8');
  } catch (e) {
    console.warn('Failed to write settings:', e);
  }
}

// Load settings if present
(async () => {
  const s = await loadSettings(ROOT);
  if (s) {
    if (typeof s.root === 'string' && s.root.trim()) {
      ROOT = path.resolve(s.root.trim());
      fs.mkdirSync(ROOT, { recursive: true });
    }
    if (typeof s.maxUploadMB === 'number' && s.maxUploadMB > 0) {
      MAX_UPLOAD_MB = Math.min(s.maxUploadMB, 1024);
    }
    if (typeof s.allowedTypes === 'string') {
      ALLOWED_TYPES = s.allowedTypes;
    }
    if (Array.isArray(s.ignoreNames)) {
      IGNORED_NAMES = s.ignoreNames.filter((v) => typeof v === 'string' && v.length > 0);
    }
  }
  // ensure defaults
  if (!ALLOWED_TYPES) ALLOWED_TYPES = DEFAULT_ALLOWED;
})();

// Helpers
function safeJoinRoot(p: string) {
  const rel = p.replaceAll('\\', '/');
  const target = path.resolve(ROOT, '.' + (rel.startsWith('/') ? rel : '/' + rel));
  if (!target.startsWith(ROOT)) {
    throw new Error('Path traversal detected');
  }
  return target;
}

function toApiPath(abs: string) {
  const rel = path.relative(ROOT, abs).split(path.sep).join('/');
  return '/' + rel.replace(/^\/+/, '');
}

// text/image helpers now live in utils.ts

// Multer storage within ROOT
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const dest = safeJoinRoot(String(req.query.path || '/'));
      fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    } catch (e) {
      cb(e as Error, '');
    }
  },
  filename: (_req, file, cb) => cb(null, file.originalname),
});
// Note: Multer limits are set at init; enforce dynamic limit via pre-check below
const upload = multer({ storage });

// Config endpoints
app.get('/api/config', (_req, res) => {
  res.json({
    root: ROOT,
    maxUploadMB: MAX_UPLOAD_MB,
    allowedTypes: ALLOWED_TYPES || DEFAULT_ALLOWED,
    ignoreNames: IGNORED_NAMES,
  });
});

app.post('/api/config', async (req, res) => {
  try {
    const { root, maxUploadMB, allowedTypes, ignoreNames } = req.body as {
      root?: string;
      maxUploadMB?: number;
      allowedTypes?: string;
      ignoreNames?: string[];
    };
    if (typeof root === 'string' && root.trim()) {
      const newRoot = path.resolve(root.trim());
      fs.mkdirSync(newRoot, { recursive: true });
      ROOT = newRoot;
    }
    if (typeof maxUploadMB === 'number' && maxUploadMB > 0) {
      MAX_UPLOAD_MB = Math.min(maxUploadMB, 1024); // clamp to 1 GiB
    }
    if (typeof allowedTypes === 'string') {
      ALLOWED_TYPES = allowedTypes;
    }
    if (Array.isArray(ignoreNames)) {
      IGNORED_NAMES = ignoreNames.filter((v) => typeof v === 'string' && v.length > 0);
    }
    // persist settings to .settings.json in current ROOT
    await saveSettings(ROOT, {
      root: ROOT,
      maxUploadMB: MAX_UPLOAD_MB,
      allowedTypes: ALLOWED_TYPES || DEFAULT_ALLOWED,
      ignoreNames: IGNORED_NAMES,
    });
    res.json({
      ok: true,
      root: ROOT,
      maxUploadMB: MAX_UPLOAD_MB,
      allowedTypes: ALLOWED_TYPES || DEFAULT_ALLOWED,
      ignoreNames: IGNORED_NAMES,
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Health
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, root: ROOT });
});

// Pretty public file URL: /files/<path within root> (use RegExp to avoid path-to-regexp v6 issues)
app.get(/^\/files\/.+$/, async (req, res) => {
  try {
    // Everything after '/files' is a relative path under ROOT
    const rel = req.path.slice('/files'.length) || '/';
    const target = safeJoinRoot(rel);
    const st = await fsp.stat(target);
    if (st.isDirectory()) return res.status(400).json({ error: 'Path is a directory' });
    const type = mime.lookup(target) || 'application/octet-stream';
    res.setHeader('Content-Type', String(type));
    // Let browser decide (inline). Client may still use download endpoint when needed.
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
    const visible = entries.filter((ent) => !IGNORED_NAMES.includes(ent.name));
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
      res.type(type || 'text/plain').send(content);
    } else if (isImageLike(type)) {
      res.type(type || 'application/octet-stream');
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
    res.json({ ok: true, path: toApiPath(target) });
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
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Upload
app.post(
  '/api/fs/upload',
  (req, res, next) => {
    const len = Number(req.headers['content-length'] || '0');
    const limit = MAX_UPLOAD_MB * 1024 * 1024;
    if (len && len > limit) {
      return res.status(413).json({ error: `Payload too large. Limit is ${MAX_UPLOAD_MB}MB` });
    }
    next();
  },
  upload.array('files'),
  async (req, res) => {
    res.json({
      ok: true,
      files:
        (req.files as Express.Multer.File[] | undefined)?.map((f) => ({
          originalname: f.originalname,
          size: f.size,
          path: toApiPath(f.path),
        })) || [],
    });
  }
);

// Write text file
app.put('/api/fs/write', async (req, res) => {
  try {
    const { path: p, content } = req.body as { path: string; content: string };
    const target = safeJoinRoot(p);
    await fsp.writeFile(target, content, 'utf8');
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// In production, serve client
if (process.env.NODE_ENV === 'production') {
  const dist = path.join(process.cwd(), 'dist');
  app.use(express.static(dist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(dist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`FileBrowser server listening on http://0.0.0.0:${PORT} with root ${ROOT}`);
});
