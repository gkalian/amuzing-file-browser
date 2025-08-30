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
  setRoot,
  setMaxUploadMB,
  setAllowedTypes,
  setIgnoreNames,
  setTheme,
  saveSettings,
  DEFAULT_ALLOWED_TYPES,
} from '../config.js';
import { logAction } from '../log.js';

export function registerConfigRoutes(app: express.Application) {
  // GET /api/config
  app.get('/api/config', (_req, res) => {
    res.json({
      root: getRoot(),
      maxUploadMB: getMaxUploadMB(),
      allowedTypes: getAllowedTypes() || DEFAULT_ALLOWED_TYPES,
      ignoreNames: getIgnoreNames(),
      theme: getTheme(),
    });
  });

  // POST /api/config
  app.post('/api/config', async (req, res) => {
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

      res.json({
        ok: true,
        root: getRoot(),
        maxUploadMB: getMaxUploadMB(),
        allowedTypes: getAllowedTypes() || DEFAULT_ALLOWED_TYPES,
        ignoreNames: getIgnoreNames(),
        theme: getTheme(),
      });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });
}
