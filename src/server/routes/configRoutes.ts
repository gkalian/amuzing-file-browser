// Config routes: expose current server config and allow updating persistent settings.
// POST /api/config validates and persists values to .settings.json via saveSettings().
import express from 'express';
import path from 'path';
import {
  getRoot,
  getMaxUploadMB,
  getAllowedTypes,
  getIgnoreNames,
  getTheme,
  getAdminDomain,
  getMediaDomain,
  setRoot,
  setMaxUploadMB,
  setAllowedTypes,
  setIgnoreNames,
  setTheme,
  DEFAULT_ALLOWED_TYPES,
} from '../config.js';
import { saveSettings } from '../lib/settings.js';
import { logAction } from '../log.js';

export function configRoutes(app: express.Application) {
  // GET /api/config
  app.get('/api/config', (_req, res) => {
    const maskRoot =
      process.env.NODE_ENV === 'production' && String(process.env.FILEBROWSER_EXPOSE_ROOT) !== 'true';
    const rootMasked = maskRoot ? true : false;
    const rootOut = maskRoot ? '/' : getRoot();

    res.json({
      root: rootOut,
      rootMasked,
      maxUploadMB: getMaxUploadMB(),
      allowedTypes: getAllowedTypes() || DEFAULT_ALLOWED_TYPES,
      ignoreNames: getIgnoreNames(),
      theme: getTheme(),
      adminDomain: getAdminDomain(),
      mediaDomain: getMediaDomain(),
    });
  });

  // POST /api/config
  app.post('/api/config', async (req, res, next) => {
    try {
      const { root, maxUploadMB, allowedTypes, ignoreNames, theme } = req.body as {
        root?: string;
        maxUploadMB?: number;
        allowedTypes?: string;
        ignoreNames?: string[];
        theme?: 'light' | 'dark';
      };

      if (typeof root === 'string' && root.trim()) {
        const newRoot = path.resolve(root.trim());
        setRoot(newRoot);
      }
      if (typeof maxUploadMB === 'number' && maxUploadMB > 0) {
        setMaxUploadMB(maxUploadMB);
      }
      if (typeof allowedTypes === 'string') {
        setAllowedTypes(allowedTypes);
      }
      if (Array.isArray(ignoreNames)) {
        setIgnoreNames(ignoreNames);
      }
      if (theme === 'light' || theme === 'dark') {
        setTheme(theme);
      }

      // Persist new values to settings file under the current root
      await saveSettings(getRoot(), {
        root: getRoot(),
        maxUploadMB: getMaxUploadMB(),
        allowedTypes: getAllowedTypes() || DEFAULT_ALLOWED_TYPES,
        ignoreNames: getIgnoreNames(),
        theme: getTheme(),
      });
      // Action log (base at info, extras at debug)
      logAction(
        'config.update',
        {
          root: getRoot(),
          maxUploadMB: getMaxUploadMB(),
          allowedTypes: getAllowedTypes() || DEFAULT_ALLOWED_TYPES,
          ignoreNames: getIgnoreNames(),
          theme: getTheme(),
        },
        { ua: req.get('user-agent') || '' }
      );

      // Apply the same masking logic as GET /api/config
      const maskRoot =
        process.env.NODE_ENV === 'production' && String(process.env.FILEBROWSER_EXPOSE_ROOT) !== 'true';
      const rootMasked = maskRoot ? true : false;
      const rootOut = maskRoot ? '/' : getRoot();

      res.json({
        ok: true,
        root: rootOut,
        rootMasked,
        maxUploadMB: getMaxUploadMB(),
        allowedTypes: getAllowedTypes() || DEFAULT_ALLOWED_TYPES,
        ignoreNames: getIgnoreNames(),
        theme: getTheme(),
        adminDomain: getAdminDomain(),
        mediaDomain: getMediaDomain(),
      });
    } catch (e: any) {
      // Normalize error to go through centralized error handler
      const err = e instanceof Error ? e : new Error(String(e));
      (err as any).status = (err as any).status || 400;
      (err as any).appCode = (err as any).appCode || 'invalid_config';
      next(err);
    }
  });
}
