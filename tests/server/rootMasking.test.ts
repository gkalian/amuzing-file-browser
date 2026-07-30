/* @vitest-environment node */
// Verifies that the real filesystem root is masked in production responses
// (GET /api/health and GET /api/config) unless explicitly exposed via env.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import fsp from 'fs/promises';
import request from 'supertest';

let app: import('express').Express;
let ROOT_DIR: string;
const savedEnv = { ...process.env };

beforeAll(async () => {
  ROOT_DIR = await fsp.mkdtemp(path.join(os.tmpdir(), 'afb-mask-'));
  process.env.FILEBROWSER_ROOT = ROOT_DIR;
  process.env.NODE_ENV = 'production';
  delete process.env.FILEBROWSER_EXPOSE_ROOT;
  fs.mkdirSync(ROOT_DIR, { recursive: true });
  // Import after env is set so config picks up the temp root.
  const mod = await import('../../src/server/app');
  app = mod.createApp();
}, 30000);

afterAll(() => {
  process.env.NODE_ENV = savedEnv.NODE_ENV;
  process.env.FILEBROWSER_EXPOSE_ROOT = savedEnv.FILEBROWSER_EXPOSE_ROOT;
});

describe('root masking in production', () => {
  it('GET /api/health does not leak the real root path', async () => {
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.root).toBe('/');
    expect(res.body.root).not.toContain('afb-mask-');
  });

  it('GET /api/config masks the root and reports rootMasked', async () => {
    const res = await request(app).get('/api/config').expect(200);
    expect(res.body.root).toBe('/');
    expect(res.body.rootMasked).toBe(true);
  });
});
