/* @vitest-environment node */
// Basic tests for server/lib/settings: round-tripping .settings.json,
// and graceful fallbacks when the file is missing or invalid.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';
import { loadSettings, saveSettings, settingsPath } from '../../src/server/lib/settings';

let dir: string;

beforeAll(async () => {
  dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'afb-settings-'));
});

afterAll(async () => {
  await fsp.rm(dir, { recursive: true, force: true });
});

describe('settingsPath', () => {
  it('joins the directory with .settings.json', () => {
    expect(settingsPath('/data')).toBe(path.join('/data', '.settings.json'));
  });
});

describe('loadSettings', () => {
  it('returns null when the file does not exist', async () => {
    const empty = await fsp.mkdtemp(path.join(os.tmpdir(), 'afb-settings-empty-'));
    await expect(loadSettings(empty)).resolves.toBeNull();
    await fsp.rm(empty, { recursive: true, force: true });
  });

  it('returns null when the file contains invalid JSON', async () => {
    const bad = await fsp.mkdtemp(path.join(os.tmpdir(), 'afb-settings-bad-'));
    await fsp.writeFile(settingsPath(bad), '{ not valid json', 'utf8');
    await expect(loadSettings(bad)).resolves.toBeNull();
    await fsp.rm(bad, { recursive: true, force: true });
  });

  it('round-trips a document written by saveSettings', async () => {
    const doc = {
      root: '/data',
      maxUploadMB: 100,
      allowedTypes: 'jpg,png',
      ignoreNames: ['.git'],
      theme: 'dark' as const,
    };

    await saveSettings(dir, doc);
    const loaded = await loadSettings(dir);

    expect(loaded).toEqual(doc);
    expect(fs.existsSync(settingsPath(dir))).toBe(true);
  });
});
