/* @vitest-environment node */
// Tests for the upload endpoint: allowed/disallowed file types, duplicate-name
// resolution on disk, and the Content-Length preflight check.
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import fsp from 'fs/promises';
import request from 'supertest';

let app: import('express').Express;
let ROOT_DIR: string;
let cfg: typeof import('../../src/server/config');
let preUploadLimitCheck: typeof import('../../src/server/upload').preUploadLimitCheck;

beforeAll(async () => {
  ROOT_DIR = await fsp.mkdtemp(path.join(os.tmpdir(), 'afb-upload-'));
  process.env.FILEBROWSER_ROOT = ROOT_DIR;
  fs.mkdirSync(ROOT_DIR, { recursive: true });

  const appMod = await import('../../src/server/app');
  cfg = await import('../../src/server/config');
  const uploadMod = await import('../../src/server/upload');
  app = appMod.createApp();
  preUploadLimitCheck = uploadMod.preUploadLimitCheck;
}, 30000);

beforeEach(async () => {
  // Keep the root clean between tests so filename-collision assertions are deterministic
  const entries = await fsp.readdir(ROOT_DIR).catch(() => []);
  for (const name of entries) {
    await fsp.rm(path.join(ROOT_DIR, name), { recursive: true, force: true }).catch(() => {});
  }
  cfg.setAllowedTypes('txt');
  cfg.setMaxUploadMB(50);
});

describe('POST /api/fs/upload', () => {
  it('saves an allowed file to the target directory', async () => {
    const res = await request(app)
      .post('/api/fs/upload')
      .query({ path: '/' })
      .attach('files', Buffer.from('hello world'), 'note.txt')
      .expect(200);

    expect(res.body.ok).toBe(true);
    expect(res.body.files).toHaveLength(1);
    expect(res.body.files[0].filename).toBe('note.txt');
    expect(fs.readFileSync(path.join(ROOT_DIR, 'note.txt'), 'utf8')).toBe('hello world');
  });

  it('renames a duplicate upload instead of overwriting the existing file', async () => {
    await request(app)
      .post('/api/fs/upload')
      .query({ path: '/' })
      .attach('files', Buffer.from('first copy'), 'note.txt')
      .expect(200);

    const res = await request(app)
      .post('/api/fs/upload')
      .query({ path: '/' })
      .attach('files', Buffer.from('second copy'), 'note.txt')
      .expect(200);

    expect(res.body.files[0].filename).toBe('note (2).txt');
    expect(fs.readFileSync(path.join(ROOT_DIR, 'note.txt'), 'utf8')).toBe('first copy');
    expect(fs.readFileSync(path.join(ROOT_DIR, 'note (2).txt'), 'utf8')).toBe('second copy');
  });

  it('rejects a file type that is not in the allow-list', async () => {
    const res = await request(app)
      .post('/api/fs/upload')
      .query({ path: '/' })
      .attach('files', Buffer.from('binary'), 'archive.exe');

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(fs.existsSync(path.join(ROOT_DIR, 'archive.exe'))).toBe(false);
  });
});

describe('preUploadLimitCheck', () => {
  it('calls next() when Content-Length is within the configured limit', () => {
    cfg.setMaxUploadMB(10);
    const req: any = { headers: { 'content-length': String(5 * 1024 * 1024) } };
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    preUploadLimitCheck()(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects with 413 when Content-Length exceeds the configured limit', () => {
    cfg.setMaxUploadMB(1);
    const req: any = { headers: { 'content-length': String(2 * 1024 * 1024) } };
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    preUploadLimitCheck()(req, res, next);

    expect(res.status).toHaveBeenCalledWith(413);
    expect(next).not.toHaveBeenCalled();
  });
});
