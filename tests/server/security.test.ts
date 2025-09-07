/* @vitest-environment node */
// Quick security tests: path traversal, root protection, and optional symlink escape
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import fsp from 'fs/promises';
import request from 'supertest';

let app: import('express').Express;
let ROOT_DIR: string;

beforeAll(async () => {
  ROOT_DIR = await fsp.mkdtemp(path.join(os.tmpdir(), 'afb-sec-'));
  process.env.FILEBROWSER_ROOT = ROOT_DIR;
  const mod = await import('../../src/server/app');
  app = mod.createApp();
  fs.mkdirSync(ROOT_DIR, { recursive: true });
});

beforeEach(async () => {
  // ensure root exists and is clean for each test case
  const entries = await fsp.readdir(ROOT_DIR).catch(() => []);
  for (const name of entries) {
    const p = path.join(ROOT_DIR, name);
    await fsp.rm(p, { recursive: true, force: true }).catch(() => {});
  }
});

describe('security: path traversal and root protection', () => {
  it('rejects .. traversal (stat)', async () => {
    const res = await request(app)
      .get('/api/fs/stat')
      .query({ path: '/../secret' })
      .expect(403);
    expect(res.body?.error).toBeDefined();
  });

  it('rejects absolute-like path (stat)', async () => {
    const abs = path.join(path.sep, 'etc', 'passwd');
    const res = await request(app)
      .get('/api/fs/stat')
      .query({ path: abs })
      // Non-existing absolute-like path resolves within ROOT and yields 404 (ENOENT)
      .expect(404);
    expect(res.body?.error).toBeDefined();
  });

  it('forbids deleting root', async () => {
    const res = await request(app)
      .post('/api/fs/delete')
      .send({ path: '/' })
      .set('content-type', 'application/json')
      .expect(403);
    expect(res.body?.error).toBeDefined();
  });

  it('forbids renaming root', async () => {
    const res = await request(app)
      .post('/api/fs/rename')
      .send({ from: '/', to: '/moved' })
      .set('content-type', 'application/json')
      .expect(403);
    expect(res.body?.error).toBeDefined();
  });

  it('rejects renaming to root target', async () => {
    // create a file
    const p = path.join(ROOT_DIR, 'a.txt');
    await fsp.writeFile(p, 'hi');
    const res = await request(app)
      .post('/api/fs/rename')
      .send({ from: '/a.txt', to: '/' })
      .set('content-type', 'application/json')
      .expect(400);
    expect(res.body?.error).toBeDefined();
  });
});

describe('security: symlink escape (optional)', () => {
  it('blocks access through symlink pointing outside ROOT (stat)', async (ctx) => {
    // On Windows creating symlinks may require privileges; skip if fails
    const outside = await fsp.mkdtemp(path.join(os.tmpdir(), 'afb-out-'));
    const outsideFile = path.join(outside, 'secret.txt');
    await fsp.writeFile(outsideFile, 'top-secret');

    const linkPath = path.join(ROOT_DIR, 'link-out');
    try {
      fs.symlinkSync(outsideFile, linkPath);
    } catch {
      ctx.skip();
      return;
    }

    const res = await request(app)
      .get('/api/fs/stat')
      .query({ path: '/link-out' })
      .expect(403);
    expect(res.body?.error).toBeDefined();
  });
});
