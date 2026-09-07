/* @vitest-environment node */
// Basic happy-path tests for mkdir/rename/delete. Root-protection and path
// traversal cases are already covered by tests/server/security.test.ts.
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import fsp from 'fs/promises';
import request from 'supertest';

let app: import('express').Express;
let ROOT_DIR: string;

beforeAll(async () => {
  ROOT_DIR = await fsp.mkdtemp(path.join(os.tmpdir(), 'afb-mutate-'));
  process.env.FILEBROWSER_ROOT = ROOT_DIR;
  fs.mkdirSync(ROOT_DIR, { recursive: true });
  const mod = await import('../../src/server/app');
  app = mod.createApp();
}, 30000);

beforeEach(async () => {
  const entries = await fsp.readdir(ROOT_DIR).catch(() => []);
  for (const name of entries) {
    await fsp.rm(path.join(ROOT_DIR, name), { recursive: true, force: true }).catch(() => {});
  }
});

describe('POST /api/fs/mkdir', () => {
  it('creates a new directory', async () => {
    const res = await request(app)
      .post('/api/fs/mkdir')
      .send({ path: '/photos' })
      .set('content-type', 'application/json')
      .expect(200);

    expect(res.body).toEqual({ ok: true, path: '/photos', name: 'photos' });
    expect(fs.statSync(path.join(ROOT_DIR, 'photos')).isDirectory()).toBe(true);
  });

  it('renames to "name (2)" when the target already exists', async () => {
    fs.mkdirSync(path.join(ROOT_DIR, 'photos'));

    const res = await request(app)
      .post('/api/fs/mkdir')
      .send({ path: '/photos' })
      .set('content-type', 'application/json')
      .expect(200);

    expect(res.body).toEqual({ ok: true, path: '/photos (2)', name: 'photos (2)' });
    expect(fs.statSync(path.join(ROOT_DIR, 'photos (2)')).isDirectory()).toBe(true);
  });
});

describe('POST /api/fs/rename', () => {
  it('renames an existing file', async () => {
    await fsp.writeFile(path.join(ROOT_DIR, 'a.txt'), 'hi');

    const res = await request(app)
      .post('/api/fs/rename')
      .send({ from: '/a.txt', to: '/b.txt' })
      .set('content-type', 'application/json')
      .expect(200);

    expect(res.body).toEqual({ ok: true });
    expect(fs.existsSync(path.join(ROOT_DIR, 'a.txt'))).toBe(false);
    expect(fs.existsSync(path.join(ROOT_DIR, 'b.txt'))).toBe(true);
  });
});

describe('POST /api/fs/delete', () => {
  it('deletes a file', async () => {
    await fsp.writeFile(path.join(ROOT_DIR, 'a.txt'), 'hi');

    const res = await request(app)
      .post('/api/fs/delete')
      .send({ path: '/a.txt' })
      .set('content-type', 'application/json')
      .expect(200);

    expect(res.body).toEqual({ ok: true });
    expect(fs.existsSync(path.join(ROOT_DIR, 'a.txt'))).toBe(false);
  });

  it('deletes a directory recursively', async () => {
    fs.mkdirSync(path.join(ROOT_DIR, 'dir', 'nested'), { recursive: true });
    await fsp.writeFile(path.join(ROOT_DIR, 'dir', 'nested', 'f.txt'), 'hi');

    const res = await request(app)
      .post('/api/fs/delete')
      .send({ path: '/dir' })
      .set('content-type', 'application/json')
      .expect(200);

    expect(res.body).toEqual({ ok: true });
    expect(fs.existsSync(path.join(ROOT_DIR, 'dir'))).toBe(false);
  });

  it('returns 404 for a non-existing path', async () => {
    const res = await request(app)
      .post('/api/fs/delete')
      .send({ path: '/missing.txt' })
      .set('content-type', 'application/json');

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
