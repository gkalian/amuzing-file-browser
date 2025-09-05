/* @vitest-environment node */
// Basic smoke tests for the server API using Supertest.
// Verifies health endpoint, simple directory listing and public files behavior.
import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import fsp from 'fs/promises';
import request from 'supertest';

let app: import('express').Express;
let ROOT_DIR: string;

beforeAll(async () => {
  // Prepare isolated temp root and set it before loading the app
  ROOT_DIR = await fsp.mkdtemp(path.join(os.tmpdir(), 'afb-'));
  process.env.FILEBROWSER_ROOT = ROOT_DIR;
  const mod = await import('../../src/server/app');
  app = mod.createApp();
  // Ensure root exists for fs/list
  fs.mkdirSync(ROOT_DIR, { recursive: true });
});

describe('server basic API (smoke)', () => {
  it('GET /api/health returns ok and X-Request-Id header', async () => {
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body?.ok).toBe(true);
    expect(typeof res.body?.root).toBe('string');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('GET /api/fs/list on root returns items array', async () => {
    const res = await request(app).get('/api/fs/list').query({ path: '/' }).expect(200);
    expect(res.body).toBeDefined();
    expect(res.body.items).toBeInstanceOf(Array);
  });

  it('GET /files/non-existing returns 404', async () => {
    const res = await request(app).get('/files/does-not-exist.txt').expect(404);
    expect(res.body?.error).toBeDefined();
  });
});
