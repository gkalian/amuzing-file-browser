/* @vitest-environment node */
// Basic tests for GET /api/fs/preview and GET /api/fs/download.
import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import fsp from 'fs/promises';
import request from 'supertest';

let app: import('express').Express;
let ROOT_DIR: string;

beforeAll(async () => {
  ROOT_DIR = await fsp.mkdtemp(path.join(os.tmpdir(), 'afb-preview-'));
  process.env.FILEBROWSER_ROOT = ROOT_DIR;
  fs.mkdirSync(ROOT_DIR, { recursive: true });
  await fsp.writeFile(path.join(ROOT_DIR, 'pic.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  await fsp.writeFile(path.join(ROOT_DIR, 'note.txt'), 'hello');
  fs.mkdirSync(path.join(ROOT_DIR, 'sub'), { recursive: true });

  const mod = await import('../../src/server/app');
  app = mod.createApp();
}, 30000);

describe('GET /api/fs/preview', () => {
  it('streams an image file with its mime type', async () => {
    const res = await request(app).get('/api/fs/preview').query({ path: '/pic.png' }).expect(200);
    expect(res.headers['content-type']).toContain('image/png');
  });

  it('rejects previewing a directory', async () => {
    const res = await request(app).get('/api/fs/preview').query({ path: '/sub' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('rejects a non-image file type', async () => {
    const res = await request(app).get('/api/fs/preview').query({ path: '/note.txt' });
    expect(res.status).toBe(415);
    expect(res.body.error).toBeDefined();
  });

  it('rejects a non-existing file', async () => {
    const res = await request(app).get('/api/fs/preview').query({ path: '/missing.png' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/fs/download', () => {
  it('downloads an existing file', async () => {
    const res = await request(app).get('/api/fs/download').query({ path: '/note.txt' }).expect(200);
    expect(res.text).toBe('hello');
    expect(res.headers['content-disposition']).toContain('note.txt');
  });

  it('rejects downloading a directory', async () => {
    const res = await request(app).get('/api/fs/download').query({ path: '/sub' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('rejects a non-existing file', async () => {
    const res = await request(app).get('/api/fs/download').query({ path: '/missing.txt' });
    expect(res.status).toBe(404);
  });
});
