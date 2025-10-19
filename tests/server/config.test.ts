import { describe, it, expect, vi } from 'vitest';
import path from 'path';
import fs from 'fs';
import * as cfg from '@/server/config';

describe('server/config', () => {
  it('getters return sensible defaults', () => {
    expect(['error','warn','info','debug']).toContain(cfg.getLogLevel());
    expect(['light','dark']).toContain(cfg.getTheme());
    expect(typeof cfg.getPort()).toBe('number');
    expect(cfg.getAllowedTypes()).toContain('jpg');
    expect(Array.isArray(cfg.getIgnoreNames())).toBe(true);
    expect(typeof cfg.getAdminDomain()).toBe('string');
    expect(typeof cfg.getMediaDomain()).toBe('string');
  });

  it('isLevelEnabled honors log level order', () => {
    cfg.setLogLevel('warn');
    expect(cfg.isLevelEnabled('error')).toBe(true);
    expect(cfg.isLevelEnabled('warn')).toBe(true);
    expect(cfg.isLevelEnabled('info')).toBe(false);
    expect(cfg.isLevelEnabled('debug')).toBe(false);

    cfg.setLogLevel('debug');
    expect(cfg.isLevelEnabled('info')).toBe(true);
  });

  it('setMaxUploadMB floors and enforces minimum 1', () => {
    cfg.setMaxUploadMB(0.5 as any);
    expect(cfg.getMaxUploadMB()).toBe(1);
    cfg.setMaxUploadMB(10.8);
    expect(cfg.getMaxUploadMB()).toBe(10);
  });

  it('setTheme normalizes values', () => {
    cfg.setTheme('Dark');
    expect(cfg.getTheme()).toBe('dark');
    cfg.setTheme('weird');
    expect(cfg.getTheme()).toBe('light');
  });

  it('domain setters store strings', () => {
    cfg.setAdminDomain('admin.local');
    cfg.setMediaDomain('media.local');
    expect(cfg.getAdminDomain()).toBe('admin.local');
    expect(cfg.getMediaDomain()).toBe('media.local');
  });

  it('setRoot allows inside initial root and forbids outside', () => {
    const current = cfg.getRoot();
    const inside = path.join(current, 'subdir-test');
    cfg.setRoot(inside);
    expect(cfg.getRoot().replace(/\\/g, '/')).toContain('subdir-test');

    const outside = path.resolve(current, '..', '..', '..', '..', 'outside-test');
    expect(() => cfg.setRoot(outside)).toThrow();
  });

  it('ensureRootExists creates directory', () => {
    const spy = vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined as any);
    cfg.ensureRootExists();
    expect(spy).toHaveBeenCalledWith(cfg.getRoot(), { recursive: true });
    spy.mockRestore();
  });
});
