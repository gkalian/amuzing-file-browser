/* @vitest-environment node */
// Basic tests for /api/config: reading current settings, persisting valid
// updates, ignoring wrongly-typed fields, and rejecting an out-of-root path.
import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import fsp from 'fs/promises';
import request from 'supertest';

let app: import('express').Express;
let ROOT_DIR: string;

beforeAll(async () => {
  ROOT_DIR = await fsp.mkdtemp(path.join(os.tmpdir(), 'afb-config-'));
  process.env.FILEBROWSER_ROOT = ROOT_DIR;
  fs.mkdirSync(ROOT_DIR, { recursive: true });
  const mod = await import('../../src/server/app');
  app = mod.createApp();
}, 30000);

describe('GET /api/config', () => {
  it('reports current settings', async () => {
    const res = await request(app).get('/api/config').expect(200);
    expect(res.body.rootMasked).toBe(false);
    expect(typeof res.body.maxUploadMB).toBe('number');
    expect(typeof res.body.allowedTypes).toBe('string');
    expect(Array.isArray(res.body.ignoreNames)).toBe(true);
  });
});

describe('POST /api/config', () => {
  it('updates and persists settings, reflected by a subsequent GET', async () => {
    const res = await request(app)
      .post('/api/config')
      .send({ maxUploadMB: 25, allowedTypes: 'png,jpg', theme: 'dark', ignoreNames: ['.git'] })
      .set('content-type', 'application/json')
      .expect(200);

    expect(res.body.ok).toBe(true);
    expect(res.body.maxUploadMB).toBe(25);
    expect(res.body.allowedTypes).toBe('png,jpg');
    expect(res.body.theme).toBe('dark');
    expect(res.body.ignoreNames).toEqual(['.git']);

    const settingsFile = path.join(ROOT_DIR, '.settings.json');
    expect(fs.existsSync(settingsFile)).toBe(true);
    const saved = JSON.parse(await fsp.readFile(settingsFile, 'utf8'));
    expect(saved.maxUploadMB).toBe(25);

    const getRes = await request(app).get('/api/config').expect(200);
    expect(getRes.body.maxUploadMB).toBe(25);
  });

  it('ignores fields with the wrong type instead of failing', async () => {
    const before = await request(app).get('/api/config').expect(200);
    const res = await request(app)
      .post('/api/config')
      .send({ maxUploadMB: 'not-a-number', ignoreNames: 'not-an-array', theme: 'purple' })
      .set('content-type', 'application/json')
      .expect(200);

    expect(res.body.ok).toBe(true);
    expect(res.body.maxUploadMB).toBe(before.body.maxUploadMB);
    expect(res.body.theme).toBe(before.body.theme);
  });

  it('rejects a root outside the initially configured root', async () => {
    const outside = path.resolve(ROOT_DIR, '..', '..', 'outside-root');
    const res = await request(app)
      .post('/api/config')
      .send({ root: outside })
      .set('content-type', 'application/json');

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.error).toBeDefined();
  });
});
